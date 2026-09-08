const db = require('../config/db');

/**
 * Returns a map of { [product_id]: currentStock } for the given store ids.
 * currentStock = SUM(IN quantities) - SUM(OUT quantities), computed from
 * stock_transaction_items joined to stock_transactions. Runs against the
 * given query executor (`executor`) so it can participate in a DB
 * transaction when needed (defaults to the plain db connection).
 */
async function getStockMapForStores(storeIds, executor = db) {
  if (!storeIds || storeIds.length === 0) return {};
  const rows = await executor('stock_transaction_items as sti')
    .join('stock_transactions as st', 'st.id', 'sti.stock_transaction_id')
    .whereIn('st.store_id', storeIds)
    .select('sti.product_id')
    .sum({
      stock: db.raw("CASE WHEN st.type = 'IN' THEN sti.quantity ELSE -sti.quantity END"),
    })
    .groupBy('sti.product_id');

  const map = {};
  rows.forEach((r) => {
    map[r.product_id] = Number(r.stock);
  });
  return map;
}

/**
 * Returns current stock for a single store, split per product AND per store,
 * useful for owner "semua toko" views that still need a per-store breakdown.
 */
async function getStockRowsByStore(storeIds, executor = db) {
  if (!storeIds || storeIds.length === 0) return [];
  const rows = await executor('stock_transaction_items as sti')
    .join('stock_transactions as st', 'st.id', 'sti.stock_transaction_id')
    .whereIn('st.store_id', storeIds)
    .select('sti.product_id', 'st.store_id')
    .sum({
      stock: db.raw("CASE WHEN st.type = 'IN' THEN sti.quantity ELSE -sti.quantity END"),
    })
    .groupBy('sti.product_id', 'st.store_id');

  return rows.map((r) => ({ productId: r.product_id, storeId: r.store_id, stock: Number(r.stock) }));
}

module.exports = { getStockMapForStores, getStockRowsByStore };
