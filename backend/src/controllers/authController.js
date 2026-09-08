const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

const STARTER_PRODUCTS = [
  { name: 'Sampoerna Mild 16', category: 'Rokok', brand: 'Sampoerna' },
  { name: 'Djarum Super 12', category: 'Rokok', brand: 'Djarum' },
  { name: 'Gudang Garam Filter 12', category: 'Rokok', brand: 'Gudang Garam' },
  { name: 'Beras 5kg', category: 'Sembako', brand: 'Umum / Tanpa Brand' },
  { name: 'Minyak Goreng 1L', category: 'Sembako', brand: 'Umum / Tanpa Brand' },
  { name: 'Gula Pasir 1kg', category: 'Sembako', brand: 'Umum / Tanpa Brand' },
  { name: 'Telur Ayam 1kg', category: 'Sembako', brand: 'Umum / Tanpa Brand' },
  { name: 'Indomie Goreng', category: 'Makanan & Minuman', brand: 'Umum / Tanpa Brand' },
  { name: 'Aqua Botol 600ml', category: 'Makanan & Minuman', brand: 'Umum / Tanpa Brand' },
  { name: 'Teh Botol Sosro', category: 'Makanan & Minuman', brand: 'Umum / Tanpa Brand' },
];

/**
 * Seeds a small starter catalog for a brand-new owner so the app is not
 * completely empty right after onboarding. Uses the global default
 * categories/brands (owner_id IS NULL).
 */
async function seedStarterProducts(trx, ownerId) {
  const categories = await trx('categories').whereNull('owner_id');
  const brands = await trx('brands').whereNull('owner_id');
  const categoryByName = Object.fromEntries(categories.map((c) => [c.name, c.id]));
  const brandByName = Object.fromEntries(brands.map((b) => [b.name, b.id]));

  const rows = STARTER_PRODUCTS.filter(
    (p) => categoryByName[p.category] && brandByName[p.brand]
  ).map((p) => ({
    owner_id: ownerId,
    category_id: categoryByName[p.category],
    brand_id: brandByName[p.brand],
    name: p.name,
    minimum_stock: 5,
    is_active: true,
  }));

  if (rows.length) {
    await trx('products').insert(rows);
  }
}

async function register(req, res, next) {
  try {
    const { ownerName, businessName, username, password, confirmPassword, recoveryQuestion, recoveryAnswer } = req.body;

    if (!ownerName || !username || !password) {
      return res.status(400).json({ message: 'Nama pemilik, username, dan password wajib diisi.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter.' });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: 'Konfirmasi password tidak sama.' });
    }
    if (!recoveryQuestion || !recoveryAnswer) {
      return res.status(400).json({
        message: 'Pertanyaan dan jawaban keamanan wajib diisi, dipakai untuk pemulihan password jika lupa.',
      });
    }

    const existing = await db('users').where({ username }).first();
    if (existing) {
      return res.status(409).json({ message: 'Username sudah digunakan. Silakan gunakan username lain.' });
    }

    const hashed = await hashPassword(password);
    const recoveryAnswerHash = await hashPassword(recoveryAnswer.trim().toLowerCase());

    const result = await db.transaction(async (trx) => {
      const [{ id: ownerId }] = await trx('users').insert({
        owner_id: null,
        store_id: null,
        business_name: businessName || null,
        name: ownerName,
        username,
        password: hashed,
        role: 'owner',
        is_active: true,
        recovery_question: recoveryQuestion.trim(),
        recovery_answer_hash: recoveryAnswerHash,
      }).returning('id');

      await seedStarterProducts(trx, ownerId);

      return ownerId;
    });

    const owner = await db('users').where({ id: result }).first();
    const token = signToken({ sub: owner.id, role: 'owner' });

    return res.status(201).json({
      message: 'Akun berhasil dibuat. Selamat datang!',
      token,
      user: {
        id: owner.id,
        name: owner.name,
        username: owner.username,
        role: owner.role,
        businessName: owner.business_name,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi.' });
    }

    const user = await db('users').where({ username }).first();
    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan. Hubungi pemilik usaha.' });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const ownerId = user.role === 'owner' ? user.id : user.owner_id;
    const token = signToken({ sub: user.id, role: user.role });

    let store = null;
    if (user.store_id) {
      store = await db('stores').where({ id: user.store_id }).first();
    }

    const storeCount = user.role === 'owner'
      ? await db('stores').where({ owner_id: ownerId, is_active: true }).count('id as c').first()
      : null;

    return res.json({
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        businessName: user.business_name,
        store: store ? { id: store.id, code: store.code, name: store.name } : null,
        hasStores: user.role === 'owner' ? Number(storeCount.c) > 0 : true,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) return res.status(404).json({ message: 'Akun tidak ditemukan.' });

    let store = null;
    if (user.store_id) {
      store = await db('stores').where({ id: user.store_id }).first();
    }

    const storeCount = user.role === 'owner'
      ? await db('stores').where({ owner_id: req.user.ownerId, is_active: true }).count('id as c').first()
      : null;

    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      businessName: user.business_name,
      store: store ? { id: store.id, code: store.code, name: store.name } : null,
      hasStores: user.role === 'owner' ? Number(storeCount.c) > 0 : true,
    });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Password lama dan baru wajib diisi.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password baru minimal 6 karakter.' });
    }
    const user = await db('users').where({ id: req.user.id }).first();
    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Password lama tidak sesuai.' });
    }
    const hashed = await hashPassword(newPassword);
    await db('users').where({ id: user.id }).update({ password: hashed, updated_at: db.fn.now() });
    res.json({ message: 'Password berhasil diubah.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/recovery-question?username=...
 * Returns ONLY the recovery question text (never the answer) so the forgot-
 * password form can display it. Only owner accounts have a recovery
 * question — staff passwords are reset by their owner instead.
 * Note: this necessarily confirms whether a username exists, similar to
 * most "forgot password" flows; the response is deliberately generic
 * either way to avoid leaking anything beyond that.
 */
async function getRecoveryQuestion(req, res, next) {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: 'Username wajib diisi.' });

    const user = await db('users').where({ username, role: 'owner' }).first();
    if (!user || !user.recovery_question) {
      return res.status(404).json({ message: 'Akun tidak ditemukan atau belum memiliki pertanyaan keamanan.' });
    }
    res.json({ recoveryQuestion: user.recovery_question });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/forgot-password
 * body: { username, recoveryAnswer, newPassword }
 * Self-service reset for OWNER accounts only, using the security question
 * set at registration (no email/SMS service is configured for this app).
 */
async function forgotPassword(req, res, next) {
  try {
    const { username, recoveryAnswer, newPassword } = req.body;
    if (!username || !recoveryAnswer || !newPassword) {
      return res.status(400).json({ message: 'Username, jawaban keamanan, dan password baru wajib diisi.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password baru minimal 6 karakter.' });
    }

    const user = await db('users').where({ username, role: 'owner' }).first();
    if (!user || !user.recovery_answer_hash) {
      return res.status(404).json({ message: 'Akun tidak ditemukan atau belum memiliki pertanyaan keamanan.' });
    }

    const valid = await comparePassword(recoveryAnswer.trim().toLowerCase(), user.recovery_answer_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Jawaban keamanan tidak sesuai.' });
    }

    const hashed = await hashPassword(newPassword);
    await db('users').where({ id: user.id }).update({ password: hashed, updated_at: db.fn.now() });
    res.json({ message: 'Password berhasil direset. Silakan masuk dengan password baru Anda.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, changePassword, getRecoveryQuestion, forgotPassword };
