const dayjs = require('dayjs');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const db = require('../config/db');
const { resolveStoreScope } = require('../utils/storeScope');
const { getStockRowsByStore } = require('../utils/stockService');

function resolvePeriod(query) {
  const { period, dateFrom, dateTo } = query;
  const today = dayjs();
  switch (period) {
    case 'today':
      return { from: today.format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') };
    case 'yesterday':
      return { from: today.subtract(1, 'day').format('YYYY-MM-DD'), to: today.subtract(1, 'day').format('YYYY-MM-DD') };
    case '7days':
      return { from: today.subtract(6, 'day').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') };
    case 'thisMonth':
      return { from: today.startOf('month').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') };
    case 'lastMonth': {
      const lastMonth = today.subtract(1, 'month');
      return { from: lastMonth.startOf('month').format('YYYY-MM-DD'), to: lastMonth.endOf('month').format('YYYY-MM-DD') };
    }
    case 'custom':
      return { from: dateFrom || today.format('YYYY-MM-DD'), to: dateTo || today.format('YYYY-MM-DD') };
    default:
      return { from: today.startOf('month').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') };
  }
}

/** Laporan 1 — Ringkasan Stok */
async function stockSummary(req, res, next) {
  try {
    const { storeIds } = await resolveStoreScope(req.user, req.query.storeId);
    if (storeIds.length === 0) return res.json({ data: { totalProducts: 0, totalStock: 0, lowStock: 0, outOfStock: 0 } });

    let productQuery = db('products')
      .where({ owner_id: req.user.ownerId, is_active: true })
      .whereNull('deleted_at');
    if (req.query.categoryId) productQuery = productQuery.andWhere('category_id', req.query.categoryId);
    const products = await productQuery.select('id', 'minimum_stock');
    const minStockById = Object.fromEntries(products.map((p) => [p.id, p.minimum_stock]));

    const stockRows = await getStockRowsByStore(storeIds);
    let totalStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    for (const row of stockRows) {
      if (!(row.productId in minStockById)) continue;
      totalStock += Math.max(row.stock, 0);
      if (row.stock <= 0) outOfStock += 1;
      else if (row.stock < minStockById[row.productId]) lowStock += 1;
    }

    res.json({ data: { totalProducts: products.length, totalStock, lowStock, outOfStock } });
  } catch (err) {
    next(err);
  }
}

/** Laporan 2 & 3 — Barang Masuk / Barang Keluar (detail list) */
async function movements(req, res, next) {
  try {
    const { type, categoryId, page = 1, limit = 50 } = req.query;
    const { from, to } = resolvePeriod(req.query);
    const { storeIds } = await resolveStoreScope(req.user, req.query.storeId);
    if (storeIds.length === 0) return res.json({ data: [], total: 0 });

    let query = db('stock_transaction_items as sti')
      .join('stock_transactions as st', 'st.id', 'sti.stock_transaction_id')
      .join('products as p', 'p.id', 'sti.product_id')
      .join('stores', 'stores.id', 'st.store_id')
      .join('users', 'users.id', 'st.user_id')
      .whereIn('st.store_id', storeIds)
      .andWhere('st.owner_id', req.user.ownerId)
      .andWhereBetween('st.transaction_date', [from, to]);

    if (type) query = query.andWhere('st.type', type);
    if (categoryId) query = query.andWhere('p.category_id', categoryId);

    const totalRow = await query.clone().count('sti.id as c').first();

    const rows = await query
      .clone()
      .select(
        'st.transaction_date',
        'st.transaction_code',
        'st.type',
        'stores.name as store_name',
        'p.name as product_name',
        'sti.quantity',
        'users.name as staff_name'
      )
      .orderBy('st.transaction_date', 'desc')
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));

    res.json({ data: rows, total: Number(totalRow.c), period: { from, to } });
  } catch (err) {
    next(err);
  }
}

/** Laporan 4 — Stok Menipis */
async function lowStock(req, res, next) {
  try {
    const { storeIds, stores } = await resolveStoreScope(req.user, req.query.storeId);
    if (storeIds.length === 0) return res.json({ data: [] });

    let productQuery = db('products')
      .where({ owner_id: req.user.ownerId, is_active: true })
      .whereNull('deleted_at');
    if (req.query.categoryId) productQuery = productQuery.andWhere('category_id', req.query.categoryId);
    const products = await productQuery.select('id', 'name', 'minimum_stock');
    const productById = Object.fromEntries(products.map((p) => [p.id, p]));
    const storeById = Object.fromEntries(stores.map((s) => [s.id, s]));

    const stockRows = await getStockRowsByStore(storeIds);
    const data = stockRows
      .filter((r) => r.productId in productById)
      .map((r) => ({
        productName: productById[r.productId].name,
        storeName: storeById[r.storeId]?.name,
        stock: r.stock,
        minimumStock: productById[r.productId].minimum_stock,
        status: r.stock <= 0 ? 'HABIS' : r.stock < productById[r.productId].minimum_stock ? 'MENIPIS' : 'AMAN',
      }))
      .filter((r) => r.status !== 'AMAN')
      .sort((a, b) => a.stock - b.stock);

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

/** Laporan 5 — Pergerakan Barang (top movers) */
async function topMovers(req, res, next) {
  try {
    const { type = 'OUT', limit = 10 } = req.query;
    const { from, to } = resolvePeriod(req.query);
    const { storeIds } = await resolveStoreScope(req.user, req.query.storeId);
    if (storeIds.length === 0) return res.json({ data: [] });

    const rows = await db('stock_transaction_items as sti')
      .join('stock_transactions as st', 'st.id', 'sti.stock_transaction_id')
      .join('products as p', 'p.id', 'sti.product_id')
      .whereIn('st.store_id', storeIds)
      .andWhere('st.type', type)
      .andWhereBetween('st.transaction_date', [from, to])
      .select('p.id', 'p.name')
      .sum({ total: 'sti.quantity' })
      .groupBy('p.id', 'p.name')
      .orderBy('total', 'desc')
      .limit(Number(limit));

    res.json({ data: rows.map((r) => ({ productId: r.id, name: r.name, total: Number(r.total) })), period: { from, to } });
  } catch (err) {
    next(err);
  }
}

/** Laporan 6 — Performa Toko */
async function storePerformance(req, res, next) {
  try {
    const { from, to } = resolvePeriod(req.query);
    const { storeIds, stores } = await resolveStoreScope(req.user, 'all');
    if (storeIds.length === 0) return res.json({ data: [] });

    const rows = await db('stock_transaction_items as sti')
      .join('stock_transactions as st', 'st.id', 'sti.stock_transaction_id')
      .whereIn('st.store_id', storeIds)
      .andWhereBetween('st.transaction_date', [from, to])
      .select('st.store_id', 'st.type')
      .sum({ total: 'sti.quantity' })
      .groupBy('st.store_id', 'st.type');

    const txCountRows = await db('stock_transactions')
      .whereIn('store_id', storeIds)
      .andWhereBetween('transaction_date', [from, to])
      .select('store_id')
      .count('id as c')
      .groupBy('store_id');
    const txCountByStore = Object.fromEntries(txCountRows.map((r) => [r.store_id, Number(r.c)]));

    const byStore = {};
    stores.forEach((s) => {
      byStore[s.id] = { storeId: s.id, name: s.name, code: s.code, in: 0, out: 0, transactions: txCountByStore[s.id] || 0 };
    });
    rows.forEach((r) => {
      if (!byStore[r.store_id]) return;
      if (r.type === 'IN') byStore[r.store_id].in = Number(r.total);
      else byStore[r.store_id].out = Number(r.total);
    });

    res.json({ data: Object.values(byStore), period: { from, to } });
  } catch (err) {
    next(err);
  }
}

/** Export Excel (.xlsx) for the "Barang Masuk/Keluar" movements report, respecting the same filters. */
async function exportMovements(req, res, next) {
  try {
    const { type, categoryId } = req.query;
    const { from, to } = resolvePeriod(req.query);
    const { storeIds } = await resolveStoreScope(req.user, req.query.storeId);

    let query = db('stock_transaction_items as sti')
      .join('stock_transactions as st', 'st.id', 'sti.stock_transaction_id')
      .join('products as p', 'p.id', 'sti.product_id')
      .join('stores', 'stores.id', 'st.store_id')
      .join('users', 'users.id', 'st.user_id')
      .whereIn('st.store_id', storeIds)
      .andWhere('st.owner_id', req.user.ownerId)
      .andWhereBetween('st.transaction_date', [from, to]);

    if (type) query = query.andWhere('st.type', type);
    if (categoryId) query = query.andWhere('p.category_id', categoryId);

    const rows = await query
      .select(
        'st.transaction_date as Tanggal',
        'st.transaction_code as NoTransaksi',
        'st.type as Jenis',
        'stores.name as Toko',
        'p.name as Barang',
        'sti.quantity as Jumlah',
        'users.name as Petugas',
        'st.notes as Catatan'
      )
      .orderBy('st.transaction_date', 'desc');

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-stok-${from}_${to}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

/** Log Aktivitas — audit trail of stock transactions and key account actions. */
async function auditLog(req, res, next) {
  try {
    const { page = 1, limit = 30, action } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 30));

    let query = db('audit_logs as al')
      .leftJoin('users as u', 'u.id', 'al.user_id')
      .where('al.owner_id', req.user.ownerId);

    if (action) query = query.andWhere('al.action', action);

    const totalRow = await query.clone().count('al.id as c').first();

    const rows = await query
      .clone()
      .select('al.id', 'al.action', 'al.entity_type', 'al.entity_id', 'al.meta', 'al.created_at', 'u.name as user_name', 'u.role as user_role')
      .orderBy('al.id', 'desc')
      .limit(limitNum)
      .offset((pageNum - 1) * limitNum);

    const data = rows.map((r) => ({
      ...r,
      meta: typeof r.meta === 'string' ? JSON.parse(r.meta) : r.meta,
    }));

    res.json({ data, total: Number(totalRow.c), page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
}

/** Shared PDF table renderer (portrait A4, simple grid) used by the export endpoints below. */
function renderTablePdf(res, { filename, title, subtitle, columns, rows }) {
  const doc = new PDFDocument({ margin: 36, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  doc.font('Helvetica-Bold').fontSize(16).text(title);
  if (subtitle) doc.font('Helvetica').fontSize(10).fillColor('#5b6459').text(subtitle);
  doc.moveDown(0.8);
  doc.fillColor('#20281f');

  const startX = doc.page.margins.left;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = usableWidth / columns.length;
  const rowHeight = 20;

  function drawHeader(y) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    doc.rect(startX, y, usableWidth, rowHeight).fill('#0f6e6a');
    doc.fillColor('#ffffff');
    columns.forEach((col, i) => {
      doc.text(col.label, startX + i * colWidth + 4, y + 6, { width: colWidth - 8, ellipsis: true });
    });
    doc.fillColor('#20281f');
    return y + rowHeight;
  }

  let y = drawHeader(doc.y);
  doc.font('Helvetica').fontSize(8.5);

  rows.forEach((row, idx) => {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = drawHeader(doc.page.margins.top);
      doc.font('Helvetica').fontSize(8.5);
    }
    if (idx % 2 === 0) {
      doc.rect(startX, y, usableWidth, rowHeight).fill('#f2ede3');
      doc.fillColor('#20281f');
    }
    columns.forEach((col, i) => {
      const value = row[col.key] === undefined || row[col.key] === null ? '-' : String(row[col.key]);
      doc.text(value, startX + i * colWidth + 4, y + 5, { width: colWidth - 8, ellipsis: true });
    });
    y += rowHeight;
  });

  if (rows.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#5b6459').text('Tidak ada data pada periode/filter ini.', startX, y + 8);
  }

  doc.end();
}

/** Export PDF: Barang Masuk/Keluar (same filters as the Excel export). */
async function exportMovementsPdf(req, res, next) {
  try {
    const { type, categoryId } = req.query;
    const { from, to } = resolvePeriod(req.query);
    const { storeIds } = await resolveStoreScope(req.user, req.query.storeId);

    let query = db('stock_transaction_items as sti')
      .join('stock_transactions as st', 'st.id', 'sti.stock_transaction_id')
      .join('products as p', 'p.id', 'sti.product_id')
      .join('stores', 'stores.id', 'st.store_id')
      .join('users', 'users.id', 'st.user_id')
      .whereIn('st.store_id', storeIds)
      .andWhere('st.owner_id', req.user.ownerId)
      .andWhereBetween('st.transaction_date', [from, to]);

    if (type) query = query.andWhere('st.type', type);
    if (categoryId) query = query.andWhere('p.category_id', categoryId);

    const rows = await query
      .select(
        'st.transaction_date',
        'st.transaction_code',
        'st.type',
        'stores.name as store_name',
        'p.name as product_name',
        'sti.quantity',
        'users.name as staff_name'
      )
      .orderBy('st.transaction_date', 'desc');

    const tableRows = rows.map((r) => ({
      tanggal: dayjs(r.transaction_date).format('DD/MM/YYYY'),
      kode: r.transaction_code,
      jenis: r.type === 'IN' ? 'Masuk' : 'Keluar',
      toko: r.store_name,
      barang: r.product_name,
      jumlah: r.quantity,
      petugas: r.staff_name,
    }));

    renderTablePdf(res, {
      filename: `laporan-stok-${from}_${to}.pdf`,
      title: 'Laporan Barang Masuk / Keluar',
      subtitle: `Periode ${dayjs(from).format('DD/MM/YYYY')} — ${dayjs(to).format('DD/MM/YYYY')}`,
      columns: [
        { key: 'tanggal', label: 'Tanggal' },
        { key: 'kode', label: 'Kode' },
        { key: 'jenis', label: 'Jenis' },
        { key: 'toko', label: 'Toko' },
        { key: 'barang', label: 'Barang' },
        { key: 'jumlah', label: 'Jml' },
        { key: 'petugas', label: 'Petugas' },
      ],
      rows: tableRows,
    });
  } catch (err) {
    next(err);
  }
}

/** Export PDF: Stok Menipis / Habis. */
async function exportLowStockPdf(req, res, next) {
  try {
    const { storeIds, stores } = await resolveStoreScope(req.user, req.query.storeId);

    let productQuery = db('products')
      .where({ owner_id: req.user.ownerId, is_active: true })
      .whereNull('products.deleted_at');
    if (req.query.categoryId) productQuery = productQuery.andWhere('category_id', req.query.categoryId);
    const products = await productQuery.select('id', 'name', 'minimum_stock');
    const productById = Object.fromEntries(products.map((p) => [p.id, p]));
    const storeById = Object.fromEntries(stores.map((s) => [s.id, s]));

    const stockRows = await getStockRowsByStore(storeIds);
    const tableRows = stockRows
      .filter((r) => r.productId in productById && r.stock < productById[r.productId].minimum_stock)
      .sort((a, b) => a.stock - b.stock)
      .map((r) => ({
        barang: productById[r.productId].name,
        toko: storeById[r.storeId]?.name,
        stok: r.stock,
        minimum: productById[r.productId].minimum_stock,
        status: r.stock <= 0 ? 'Habis' : 'Menipis',
      }));

    renderTablePdf(res, {
      filename: `laporan-stok-menipis-${dayjs().format('YYYY-MM-DD')}.pdf`,
      title: 'Laporan Stok Menipis',
      subtitle: `Dicetak ${dayjs().format('DD/MM/YYYY HH:mm')}`,
      columns: [
        { key: 'barang', label: 'Barang' },
        { key: 'toko', label: 'Toko' },
        { key: 'stok', label: 'Stok' },
        { key: 'minimum', label: 'Min.' },
        { key: 'status', label: 'Status' },
      ],
      rows: tableRows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  stockSummary,
  movements,
  lowStock,
  topMovers,
  storePerformance,
  exportMovements,
  exportMovementsPdf,
  exportLowStockPdf,
  auditLog,
};
