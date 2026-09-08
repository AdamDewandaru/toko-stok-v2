import { vi } from 'vitest';

const store1 = { id: 1, code: 'BER1', name: 'Berkah Jaya 1', address: 'Jl. Mawar 1', is_active: true };
const store2 = { id: 2, code: 'BER2', name: 'Berkah Jaya 2', address: null, is_active: true };

const category1 = { id: 1, name: 'Rokok', owner_id: null };
const category2 = { id: 2, name: 'Sembako', owner_id: null };
const brand1 = { id: 1, name: 'Sampoerna', owner_id: null };

const product1 = {
  id: 1,
  name: 'Sampoerna Mild 16',
  code: null,
  minimum_stock: 5,
  is_active: true,
  category_id: 1,
  category_name: 'Rokok',
  brand_id: 1,
  brand_name: 'Sampoerna',
  created_at: '2026-09-01T00:00:00.000Z',
};

const productWithStock = { ...product1, stock: 12, status: 'AMAN' };

const staffMember = {
  id: 10,
  name: 'Andi',
  username: 'andi',
  is_active: true,
  store_id: 1,
  store_name: 'Berkah Jaya 1',
  store_code: 'BER1',
  created_at: '2026-09-01T00:00:00.000Z',
};

const transactionRow = {
  id: 1,
  transaction_code: 'TRX-20260901-BER1-0001',
  type: 'IN',
  is_adjustment: false,
  transaction_date: '2026-09-01',
  notes: null,
  created_at: '2026-09-01T00:00:00.000Z',
  store_name: 'Berkah Jaya 1',
  store_code: 'BER1',
  staff_name: 'Andi',
  items: [{ name: 'Sampoerna Mild 16', quantity: 20 }],
};

export function ownerUser(overrides = {}) {
  return {
    id: 1,
    name: 'Adam',
    username: 'adam.owner',
    role: 'owner',
    businessName: 'Berkah Jaya Group',
    store: null,
    hasStores: true,
    ...overrides,
  };
}

export function staffUser(overrides = {}) {
  return {
    id: 10,
    name: 'Andi',
    username: 'andi',
    role: 'staff',
    businessName: null,
    store: { id: 1, code: 'BER1', name: 'Berkah Jaya 1' },
    hasStores: true,
    ...overrides,
  };
}

/**
 * Installs a global fetch mock that returns realistic fixture JSON for every
 * endpoint the app calls, keyed by path prefix. `meOverrides` lets a test
 * control what /auth/me returns (owner vs staff, hasStores, etc).
 */
export function installFetchMock({ meOverrides } = {}) {
  const me = meOverrides || ownerUser();

  const handler = vi.fn((url, options = {}) => {
    const u = new URL(url, 'http://localhost');
    const path = u.pathname.replace('/api', '');
    const method = (options.method || 'GET').toUpperCase();

    const json = (body, status = 200) =>
      Promise.resolve({
        ok: status < 400,
        status,
        json: () => Promise.resolve(body),
        blob: () => Promise.resolve(new Blob()),
      });

    if (path === '/auth/login' && method === 'POST') {
      return json({ message: 'Login berhasil.', token: 'fake-token', user: me });
    }
    if (path === '/auth/register' && method === 'POST') {
      return json({ message: 'Akun berhasil dibuat.', token: 'fake-token', user: ownerUser({ hasStores: false }) }, 201);
    }
    if (path === '/auth/forgot-password' && method === 'POST') {
      return json({ message: 'Password berhasil direset.' });
    }
    if (path === '/auth/me') return json(me);
    if (path === '/auth/recovery-question') return json({ recoveryQuestion: 'Nama hewan peliharaan pertama?' });
    if (path === '/stores') return json({ data: [store1, store2], maxStores: 3 });
    if (path === '/categories') return json({ data: [category1, category2] });
    if (path === '/brands') return json({ data: [brand1] });
    if (path === '/products') return json({ data: [product1], total: 1, page: 1, limit: 20 });
    if (path === '/staff') return json({ data: [staffMember] });
    if (path === '/stock/products') return json({ data: [productWithStock], stores: [store1] });
    if (path === '/stock/transactions') return json({ data: [transactionRow], total: 1, page: 1, limit: 20 });
    if (path === '/dashboard/home') {
      return json({
        role: me.role,
        hasStores: true,
        name: me.name,
        businessName: me.businessName,
        stores: [store1],
        totalStock: 120,
        lowStockCount: 2,
        outOfStockCount: 1,
        transactionsToday: 3,
        stockInToday: 20,
        stockOutToday: 17,
        storeActivity: [{ storeId: 1, name: store1.name, code: store1.code, transactions: 3 }],
      });
    }
    if (path === '/dashboard/low-stock') {
      return json({
        data: [
          { productId: 1, productName: 'Sampoerna Mild 16', storeId: 1, storeName: 'Berkah Jaya 1', stock: 3, minimumStock: 5, status: 'MENIPIS' },
        ],
      });
    }
    if (path === '/reports/stock-summary') return json({ data: { totalProducts: 10, totalStock: 120, lowStock: 2, outOfStock: 1 } });
    if (path === '/reports/movements') return json({ data: [], total: 0, period: { from: '2026-09-01', to: '2026-09-07' } });
    if (path === '/reports/low-stock') return json({ data: [] });
    if (path === '/reports/top-movers') return json({ data: [], period: { from: '2026-09-01', to: '2026-09-07' } });
    if (path === '/reports/store-performance') return json({ data: [{ storeId: 1, name: store1.name, code: store1.code, in: 20, out: 17, transactions: 3 }], period: {} });
    if (path === '/reports/audit-log') return json({ data: [], total: 0, page: 1, limit: 30 });

    return json({ message: 'not found in mock' }, 404);
  });

  vi.stubGlobal('fetch', handler);
  return handler;
}
