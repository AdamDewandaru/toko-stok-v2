const dayjs = require('dayjs');

/**
 * Generates a human-readable transaction code such as TRX-20260906-BJ1-0007.
 * Must be called inside a DB transaction (trx) with the stores row locked
 * (or at least queried) beforehand to keep the running number consistent.
 */
async function generateTransactionCode(trx, { storeCode, storeId, date }) {
  const day = dayjs(date).format('YYYYMMDD');
  const row = await trx('stock_transactions')
    .where({ store_id: storeId })
    .andWhereRaw('DATE(transaction_date) = ?', [dayjs(date).format('YYYY-MM-DD')])
    .count('id as c')
    .first();
  const nextSeq = Number(row.c) + 1;
  const seqStr = String(nextSeq).padStart(4, '0');
  return `TRX-${day}-${storeCode}-${seqStr}`;
}

module.exports = { generateTransactionCode };
