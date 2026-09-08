const db = require('../config/db');

/**
 * Resolves the list of store ids the current user is allowed to operate on.
 *  - staff: ALWAYS their own assigned store, regardless of any query param
 *    the client might send (RB-AUTH: backend must not trust client-provided
 *    store_id for staff).
 *  - owner: either every active store they own, or a single store they own
 *    if `requestedStoreId` is provided and actually belongs to them.
 * Returns { storeIds: number[], stores: StoreRow[] }.
 */
async function resolveStoreScope(user, requestedStoreId) {
  if (user.role === 'staff') {
    if (!user.storeId) return { storeIds: [], stores: [] };
    const store = await db('stores').where({ id: user.storeId }).first();
    return { storeIds: store ? [store.id] : [], stores: store ? [store] : [] };
  }

  // owner
  if (requestedStoreId && requestedStoreId !== 'all') {
    const store = await db('stores').where({ id: requestedStoreId, owner_id: user.ownerId }).first();
    if (!store) return { storeIds: [], stores: [] };
    return { storeIds: [store.id], stores: [store] };
  }

  const stores = await db('stores').where({ owner_id: user.ownerId });
  return { storeIds: stores.map((s) => s.id), stores };
}

module.exports = { resolveStoreScope };
