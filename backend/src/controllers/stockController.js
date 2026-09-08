const dayjs = require('dayjs');
const db = require('../config/db');
const { resolveStoreScope } = require('../utils/storeScope');
const { getStockMapForStores } = require('../utils/stockService');
const { generateTransactionCode } = require('../utils/transactionCode');

/**
 * GET /api/stock/products
 * Product picker with live stock for a given store (staff: own store only).
 * Used by "Pilih Barang" (staff) and "Lihat Stok" screens.
 */
async function productsWithStock(req, res, next) {
  try {
    const { search, categoryId } = req.query;
    const { storeIds, stores } = await resolveStoreScope(req.user, req.query.storeId);
    if (storeIds.length === 0) {
      return res.json({ data: [], stores: [] });
    }

    let query = db('products')
      .join('categories', 'products.category_id', 'categories.id')
      .leftJoin('brands', 'products.brand_id', 'brands.id')
      .where('products.owner_id', req.user.ownerId)
      .andWhere('products.is_active', true)
      .whereNull('products.deleted_at')
      .select(
        'products.id',
        'products.name',
        'products.code',
        'products.minimum_stock',
        'products.category_id',
        'categories.name as category_name',
        'products.brand_id',
        'brands.name as brand_name'
      );

    if (search) query = query.andWhere('products.name', 'like', `%${search}%`);
    if (categoryId) query = query.andWhere('products.category_id', categoryId);

    const products = await query.orderBy(['brand_name', 'products.name']);
    const stockMap = await getStockMapForStores(storeIds);

    const data = products.map((p) => {
      const stock = stockMap[p.id] || 0;
      let status = 'AMAN';
      if (stock <= 0) status = 'HABIS';
      else if (stock < p.minimum_stock) status = 'MENIPIS';
      return { ...p, stock, status };
    });

    res.json({ data, stores });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/stock/transactions
 * Records a Barang Masuk / Barang Keluar transaction (header + items).
 * body: { type: 'IN'|'OUT', items: [{productId, quantity}], notes, isAdjustment, transactionDate }
 */
async function createTransaction(req, res, next) {
  try {
    const { type, items, notes, isAdjustment, transactionDate } = req.body;

    if (!['IN', 'OUT'].includes(type)) {
      return res.status(400).json({ message: 'Jenis transaksi tidak valid.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Pilih minimal satu barang.' });
    }
    for (const item of items) {
      if (!item.productId || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ message: 'Jumlah barang tidak boleh kurang dari 1.' });
      }
    }

    const adjustmentRequested = !!isAdjustment;
    if (adjustmentRequested && req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Hanya pemilik usaha yang dapat melakukan penyesuaian stok.' });
    }

    // Staff can only record for their own store; owner must specify a store.
    let storeId;
    if (req.user.role === 'staff') {
      storeId = req.user.storeId;
      if (!storeId) return res.status(403).json({ message: 'Akun Anda belum ditugaskan ke toko manapun.' });
    } else {
      storeId = req.body.storeId;
      if (!storeId) return res.status(400).json({ message: 'Pilih toko terlebih dahulu.' });
      const store = await db('stores').where({ id: storeId, owner_id: req.user.ownerId }).first();
      if (!store) return res.status(404).json({ message: 'Toko tidak ditemukan.' });
    }

    const store = await db('stores').where({ id: storeId }).first();
    if (!store || !store.is_active) {
      return res.status(400).json({ message: 'Toko tidak aktif.' });
    }

    const productIds = items.map((i) => i.productId);
    const products = await db('products')
      .whereIn('id', productIds)
      .andWhere('owner_id', req.user.ownerId)
      .whereNull('deleted_at');
    if (products.length !== new Set(productIds).size) {
      return res.status(400).json({ message: 'Salah satu barang tidak ditemukan.' });
    }
    const productById = Object.fromEntries(products.map((p) => [p.id, p]));

    const date = transactionDate ? dayjs(transactionDate) : dayjs();

    const result = await db.transaction(async (trx) => {
      if (type === 'OUT' && !adjustmentRequested) {
        const stockMap = await getStockMapForStores([storeId], trx);
        const insufficient = [];
        for (const item of items) {
          const available = stockMap[item.productId] || 0;
          if (item.quantity > available) {
            insufficient.push({
              productId: item.productId,
              name: productById[item.productId]?.name,
              available,
              requested: item.quantity,
            });
          }
        }
        if (insufficient.length > 0) {
          const err = new Error('Stok tidak mencukupi.');
          err.statusCode = 422;
          err.details = insufficient;
          throw err;
        }
      }

      const transactionCode = await generateTransactionCode(trx, {
        storeCode: store.code,
        storeId,
        date: date.toDate(),
      });

      const [{ id: transactionId }] = await trx('stock_transactions').insert({
        owner_id: req.user.ownerId,
        store_id: storeId,
        user_id: req.user.id,
        transaction_code: transactionCode,
        type,
        is_adjustment: adjustmentRequested,
        transaction_date: date.format('YYYY-MM-DD'),
        notes: notes || null,
      }).returning('id');

      const itemRows = items.map((i) => ({
        stock_transaction_id: transactionId,
        product_id: i.productId,
        quantity: i.quantity,
      }));
      await trx('stock_transaction_items').insert(itemRows);

      await trx('audit_logs').insert({
        owner_id: req.user.ownerId,
        user_id: req.user.id,
        action: type === 'IN' ? 'stock.in' : 'stock.out',
        entity_type: 'stock_transaction',
        entity_id: transactionId,
        meta: JSON.stringify({ storeId, items, isAdjustment: adjustmentRequested }),
      });

      return { transactionId, transactionCode };
    });

    const newStockMap = await getStockMapForStores([storeId]);
    const resultItems = items.map((i) => ({
      productId: i.productId,
      name: productById[i.productId]?.name,
      quantity: i.quantity,
      stockNow: newStockMap[i.productId] || 0,
    }));

    res.status(201).json({
      message: type === 'IN' ? 'Barang berhasil dicatat masuk.' : 'Barang berhasil dicatat keluar.',
      data: {
        id: result.transactionId,
        transactionCode: result.transactionCode,
        type,
        storeId,
        items: resultItems,
      },
    });
  } catch (err) {
    if (err.statusCode === 422) {
      return res.status(422).json({ message: err.message, details: err.details });
    }
    next(err);
  }
}

/**
 * GET /api/stock/transactions  — Buku Besar / Riwayat, with filters.
 */
async function listTransactions(req, res, next) {
  try {
    const { type, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const { storeIds } = await resolveStoreScope(req.user, req.query.storeId);
    if (storeIds.length === 0) return res.json({ data: [], total: 0, page: Number(page), limit: Number(limit) });

    let base = db('stock_transactions as st')
      .whereIn('st.store_id', storeIds)
      .andWhere('st.owner_id', req.user.ownerId);

    if (type) base = base.andWhere('st.type', type);
    if (dateFrom) base = base.andWhere('st.transaction_date', '>=', dateFrom);
    if (dateTo) base = base.andWhere('st.transaction_date', '<=', dateTo);

    const totalRow = await base.clone().count('st.id as c').first();

    const rows = await base
      .clone()
      .join('stores', 'stores.id', 'st.store_id')
      .join('users', 'users.id', 'st.user_id')
      .select(
        'st.id',
        'st.transaction_code',
        'st.type',
        'st.is_adjustment',
        'st.transaction_date',
        'st.notes',
        'st.created_at',
        'stores.name as store_name',
        'stores.code as store_code',
        'users.name as staff_name'
      )
      .orderBy('st.id', 'desc')
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    const ids = rows.map((r) => r.id);
    let itemsByTx = {};
    if (ids.length) {
      const items = await db('stock_transaction_items as sti')
        .join('products', 'products.id', 'sti.product_id')
        .whereIn('sti.stock_transaction_id', ids)
        .select('sti.stock_transaction_id', 'sti.quantity', 'products.name as product_name');
      itemsByTx = items.reduce((acc, it) => {
        acc[it.stock_transaction_id] = acc[it.stock_transaction_id] || [];
        acc[it.stock_transaction_id].push({ name: it.product_name, quantity: it.quantity });
        return acc;
      }, {});
    }

    const data = rows.map((r) => ({ ...r, items: itemsByTx[r.id] || [] }));

    res.json({ data, total: Number(totalRow.c), page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

async function transactionDetail(req, res, next) {
  try {
    const { id } = req.params;
    const { storeIds } = await resolveStoreScope(req.user, 'all');

    const tx = await db('stock_transactions as st')
      .join('stores', 'stores.id', 'st.store_id')
      .join('users', 'users.id', 'st.user_id')
      .where('st.id', id)
      .andWhere('st.owner_id', req.user.ownerId)
      .whereIn('st.store_id', storeIds)
      .select(
        'st.id',
        'st.transaction_code',
        'st.type',
        'st.is_adjustment',
        'st.transaction_date',
        'st.notes',
        'st.created_at',
        'stores.name as store_name',
        'stores.code as store_code',
        'users.name as staff_name'
      )
      .first();

    if (!tx) return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });

    const items = await db('stock_transaction_items as sti')
      .join('products', 'products.id', 'sti.product_id')
      .where('sti.stock_transaction_id', id)
      .select('sti.quantity', 'products.name as product_name', 'products.code as product_code');

    res.json({ data: { ...tx, items } });
  } catch (err) {
    next(err);
  }
}

module.exports = { productsWithStock, createTransaction, listTransactions, transactionDetail };
