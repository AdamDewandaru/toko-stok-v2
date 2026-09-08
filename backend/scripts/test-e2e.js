/* eslint-disable no-console */
require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

function log(label, res) {
  console.log(`\n--- ${label} [${res.status}] ---`);
  console.log(JSON.stringify(res.body, null, 2));
}

async function run() {
  const rand = Math.floor(Math.random() * 100000);

  // 1. Register owner
  let res = await request(app).post('/api/auth/register').send({
    ownerName: 'Adam',
    businessName: 'Berkah Jaya Group',
    username: `adam.owner.${rand}`,
    password: 'rahasia123',
    confirmPassword: 'rahasia123',
    recoveryQuestion: 'Nama hewan peliharaan pertama?',
    recoveryAnswer: 'Milo',
  });
  log('REGISTER OWNER', res);
  if (res.status !== 201) throw new Error('register failed');
  const ownerToken = res.body.token;

  // 2. Create store 1 & 2, try 4th over the limit later
  res = await request(app)
    .post('/api/stores')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ name: 'Berkah Jaya 1', address: 'Jl. Mawar No 1' });
  log('CREATE STORE 1', res);
  const store1 = res.body.data;

  res = await request(app)
    .post('/api/stores')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ name: 'Berkah Jaya 2' });
  log('CREATE STORE 2', res);

  res = await request(app)
    .post('/api/stores')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ name: 'Berkah Jaya 3' });
  log('CREATE STORE 3', res);

  res = await request(app)
    .post('/api/stores')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ name: 'Berkah Jaya 4 (harusnya ditolak)' });
  log('CREATE STORE 4 (expect 422 - batas 3 toko)', res);
  if (res.status !== 422) throw new Error('store limit not enforced!');

  // 3. Create staff for store 1
  res = await request(app)
    .post('/api/staff')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ name: 'Andi', username: `andi.${rand}`, password: 'staff123', storeId: store1.id });
  log('CREATE STAFF ANDI', res);
  const staffUsername = `andi.${rand}`;

  // 4. Login as staff
  res = await request(app).post('/api/auth/login').send({ username: staffUsername, password: 'staff123' });
  log('LOGIN STAFF', res);
  const staffToken = res.body.token;

  // 5. Owner adds a custom product
  res = await request(app).get('/api/categories').set('Authorization', `Bearer ${ownerToken}`);
  const rokokCategory = res.body.data.find((c) => c.name === 'Rokok');
  res = await request(app).get('/api/brands').set('Authorization', `Bearer ${ownerToken}`);
  const sampoernaBrand = res.body.data.find((b) => b.name === 'Sampoerna');

  res = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ name: 'Sampoerna Mild 16 Test', categoryId: rokokCategory.id, brandId: sampoernaBrand.id, minimumStock: 5 });
  log('CREATE PRODUCT', res);
  const product = res.body.data;

  // 6. Staff records stock IN
  res = await request(app)
    .post('/api/stock/transactions')
    .set('Authorization', `Bearer ${staffToken}`)
    .send({ type: 'IN', items: [{ productId: product.id, quantity: 20 }], notes: 'Kiriman dari agen' });
  log('STAFF STOCK IN 20', res);
  if (res.status !== 201) throw new Error('stock in failed');

  // 7. Staff records stock OUT (valid)
  res = await request(app)
    .post('/api/stock/transactions')
    .set('Authorization', `Bearer ${staffToken}`)
    .send({ type: 'OUT', items: [{ productId: product.id, quantity: 17 }] });
  log('STAFF STOCK OUT 17 (sisa harus 3 -> MENIPIS)', res);

  // 8. Staff tries to record OUT more than available (should fail)
  res = await request(app)
    .post('/api/stock/transactions')
    .set('Authorization', `Bearer ${staffToken}`)
    .send({ type: 'OUT', items: [{ productId: product.id, quantity: 100 }] });
  log('STAFF STOCK OUT 100 (expect 422 - stok tidak cukup)', res);
  if (res.status !== 422) throw new Error('insufficient stock check not enforced!');

  // 9. Staff tries to access another store's data via query param (should be ignored / forced own store)
  res = await request(app)
    .get('/api/stock/products')
    .set('Authorization', `Bearer ${staffToken}`)
    .query({ storeId: 99999 });
  log('STAFF TRY FOREIGN STORE (should silently use own store only)', res);

  // 10. Staff dashboard
  res = await request(app).get('/api/dashboard/home').set('Authorization', `Bearer ${staffToken}`);
  log('STAFF DASHBOARD', res);

  // 11. Owner dashboard (all stores)
  res = await request(app).get('/api/dashboard/home').set('Authorization', `Bearer ${ownerToken}`);
  log('OWNER DASHBOARD (semua toko)', res);

  // 12. Owner reports
  res = await request(app).get('/api/reports/stock-summary').set('Authorization', `Bearer ${ownerToken}`);
  log('REPORT: RINGKASAN STOK', res);

  res = await request(app).get('/api/reports/low-stock').set('Authorization', `Bearer ${ownerToken}`);
  log('REPORT: STOK MENIPIS', res);

  res = await request(app)
    .get('/api/reports/movements')
    .set('Authorization', `Bearer ${ownerToken}`)
    .query({ period: 'thisMonth' });
  log('REPORT: MOVEMENTS (bulan ini)', res);

  // 13. Staff must NOT access owner-only endpoints
  res = await request(app).get('/api/reports/stock-summary').set('Authorization', `Bearer ${staffToken}`);
  log('STAFF TRY ACCESS REPORTS (expect 403)', res);
  if (res.status !== 403) throw new Error('role guard failed for staff on reports!');

  res = await request(app).get('/api/staff').set('Authorization', `Bearer ${staffToken}`);
  log('STAFF TRY ACCESS STAFF MGMT (expect 403)', res);
  if (res.status !== 403) throw new Error('role guard failed for staff on staff mgmt!');

  // 14. Forgot password flow (owner, security question)
  const ownerUsername = `adam.owner.${rand}`;
  res = await request(app).get('/api/auth/recovery-question').query({ username: ownerUsername });
  log('GET RECOVERY QUESTION', res);
  if (res.status !== 200) throw new Error('recovery question fetch failed');

  res = await request(app).post('/api/auth/forgot-password').send({
    username: ownerUsername,
    recoveryAnswer: 'milo', // case-insensitive on purpose
    newPassword: 'passwordBaru123',
  });
  log('FORGOT PASSWORD (correct answer)', res);
  if (res.status !== 200) throw new Error('forgot password with correct answer failed');

  res = await request(app).post('/api/auth/login').send({ username: ownerUsername, password: 'passwordBaru123' });
  log('LOGIN WITH NEW PASSWORD', res);
  if (res.status !== 200) throw new Error('login with reset password failed');

  res = await request(app).post('/api/auth/forgot-password').send({
    username: ownerUsername,
    recoveryAnswer: 'jawaban salah',
    newPassword: 'lainnya123',
  });
  log('FORGOT PASSWORD (wrong answer, expect 401)', res);
  if (res.status !== 401) throw new Error('forgot password should reject wrong answer!');

  // 15. Audit log (owner only)
  res = await request(app).get('/api/reports/audit-log').set('Authorization', `Bearer ${ownerToken}`);
  log('AUDIT LOG', res);
  if (res.status !== 200) throw new Error('audit log fetch failed');

  res = await request(app).get('/api/reports/audit-log').set('Authorization', `Bearer ${staffToken}`);
  log('AUDIT LOG (staff, expect 403)', res);
  if (res.status !== 403) throw new Error('audit log should be owner-only!');

  // 16. Products pagination
  res = await request(app).get('/api/products').set('Authorization', `Bearer ${ownerToken}`).query({ page: 1, limit: 5 });
  log('PRODUCTS PAGE 1 (limit 5)', res);
  if (res.status !== 200 || res.body.data.length > 5) throw new Error('pagination limit not respected!');

  console.log('\n\n✅ SEMUA SKENARIO UTAMA LULUS');
  await db.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error('\n❌ TEST GAGAL:', err.message);
  db.destroy().finally(() => process.exit(1));
});
