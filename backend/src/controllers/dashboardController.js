const dayjs = require('dayjs');
const db = require('../config/db');
const { resolveStoreScope } = require('../utils/storeScope');
const { getStockRowsByStore } = require('../utils/stockService');

async function home(req, res, next) {
  try {
    const { storeIds, stores } = await resolveStoreScope(req.user, req.query.storeId);
    const today = dayjs().format('YYYY-MM-DD');

    if (storeIds.length === 0) {
      return res.json({
        role: req.user.role,
        hasStores: false,
        stores: [],
      });
    }

    // Active product catalog scoped to this owner.
    const products = await db('products')
      .where({ owner_id: req.user.ownerId, is_active: true })
      .whereNull('deleted_at')
      .select('id', 'minimum_stock');
    const minStockById = Object.fromEntries(products.map((p) => [p.id, p.minimum_stock]));

    const stockRows = await getStockRowsByStore(storeIds);

    let totalStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const lowStockList = [];

    for (const row of stockRows) {
      if (!(row.productId in minStockById)) continue; // ignore inactive/deleted products
      totalStock += Math.max(row.stock, 0);
      if (row.stock <= 0) {
        outOfStockCount += 1;
      } else if (row.stock < minStockById[row.productId]) {
        lowStockCount += 1;
        lowStockList.push(row);
      }
    }

    const [todayIn, todayOut, todayTxCount] = await Promise.all([
      db('stock_transaction_items as sti')
        .join('stock_transactions as st', 'st.id', 'sti.stock_transaction_id')
        .whereIn('st.store_id', storeIds)
        .andWhere('st.type', 'IN')
        .andWhere('st.transaction_date', today)
        .sum({ total: 'sti.quantity' })
        .first(),
      db('stock_transaction_items as sti')
        .join('stock_transactions as st', 'st.id', 'sti.stock_transaction_id')
        .whereIn('st.store_id', storeIds)
        .andWhere('st.type', 'OUT')
        .andWhere('st.transaction_date', today)
        .sum({ total: 'sti.quantity' })
        .first(),
      db('stock_transactions')
        .whereIn('store_id', storeIds)
        .andWhere('transaction_date', today)
        .count('id as c')
        .first(),
    ]);

    let storeActivity = [];
    if (req.user.role === 'owner') {
      const rows = await db('stock_transactions')
        .whereIn('store_id', storeIds)
        .andWhere('transaction_date', today)
        .select('store_id')
        .count('id as c')
        .groupBy('store_id');
      const countByStore = Object.fromEntries(rows.map((r) => [r.store_id, Number(r.c)]));
      storeActivity = stores.map((s) => ({ storeId: s.id, name: s.name, code: s.code, transactions: countByStore[s.id] || 0 }));
    }

    res.json({
      role: req.user.role,
      hasStores: true,
      name: req.user.name,
      businessName: req.user.businessName,
      stores: stores.map((s) => ({ id: s.id, name: s.name, code: s.code })),
      totalStock,
      lowStockCount,
      outOfStockCount,
      transactionsToday: Number(todayTxCount.c),
      stockInToday: Number(todayIn.total || 0),
      stockOutToday: Number(todayOut.total || 0),
      storeActivity,
    });
  } catch (err) {
    next(err);
  }
}

async function lowStockAlerts(req, res, next) {
  try {
    const { storeIds, stores } = await resolveStoreScope(req.user, req.query.storeId);
    if (storeIds.length === 0) return res.json({ data: [] });

    const products = await db('products')
      .where({ owner_id: req.user.ownerId, is_active: true })
      .whereNull('deleted_at')
      .select('id', 'name', 'minimum_stock');
    const productById = Object.fromEntries(products.map((p) => [p.id, p]));
    const storeById = Object.fromEntries(stores.map((s) => [s.id, s]));

    const stockRows = await getStockRowsByStore(storeIds);

    const data = stockRows
      .filter((row) => row.productId in productById && row.stock < productById[row.productId].minimum_stock)
      .map((row) => ({
        productId: row.productId,
        productName: productById[row.productId].name,
        storeId: row.storeId,
        storeName: storeById[row.storeId]?.name,
        stock: row.stock,
        minimumStock: productById[row.productId].minimum_stock,
        status: row.stock <= 0 ? 'HABIS' : 'MENIPIS',
      }))
      .sort((a, b) => a.stock - b.stock);

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = { home, lowStockAlerts };
