const db = require('../config/db');
const { hashPassword } = require('../utils/password');

async function list(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const staff = await db('users')
      .leftJoin('stores', 'users.store_id', 'stores.id')
      .where('users.owner_id', ownerId)
      .andWhere('users.role', 'staff')
      .select(
        'users.id',
        'users.name',
        'users.username',
        'users.is_active',
        'users.store_id',
        'stores.name as store_name',
        'stores.code as store_code',
        'users.created_at'
      )
      .orderBy('users.id', 'asc');
    res.json({ data: staff });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { name, username, password, storeId } = req.body;

    if (!name || !username || !password || !storeId) {
      return res.status(400).json({ message: 'Nama, username, password, dan toko wajib diisi.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter.' });
    }

    const store = await db('stores').where({ id: storeId, owner_id: ownerId }).first();
    if (!store) {
      return res.status(404).json({ message: 'Toko tidak ditemukan atau bukan milik akun Anda.' });
    }

    const existing = await db('users').where({ username }).first();
    if (existing) {
      return res.status(409).json({ message: 'Username sudah digunakan.' });
    }

    const hashed = await hashPassword(password);
    const [{ id }] = await db('users').insert({
      owner_id: ownerId,
      store_id: storeId,
      name,
      username,
      password: hashed,
      role: 'staff',
      is_active: true,
    }).returning('id');

    const staff = await db('users').where({ id }).first();
    res.status(201).json({
      message: 'Akun penjaga toko berhasil dibuat.',
      data: {
        id: staff.id,
        name: staff.name,
        username: staff.username,
        storeId: staff.store_id,
        isActive: staff.is_active,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { id } = req.params;
    const { name, storeId } = req.body;

    const staff = await db('users').where({ id, owner_id: ownerId, role: 'staff' }).first();
    if (!staff) return res.status(404).json({ message: 'Akun penjaga toko tidak ditemukan.' });

    let newStoreId = staff.store_id;
    if (storeId) {
      const store = await db('stores').where({ id: storeId, owner_id: ownerId }).first();
      if (!store) return res.status(404).json({ message: 'Toko tujuan tidak ditemukan.' });
      newStoreId = storeId;
    }

    await db('users')
      .where({ id })
      .update({
        name: name ?? staff.name,
        store_id: newStoreId,
        updated_at: db.fn.now(),
      });

    const updated = await db('users').where({ id }).first();
    res.json({
      message: 'Data penjaga toko berhasil diperbarui.',
      data: { id: updated.id, name: updated.name, storeId: updated.store_id, isActive: updated.is_active },
    });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password baru minimal 6 karakter.' });
    }
    const staff = await db('users').where({ id, owner_id: ownerId, role: 'staff' }).first();
    if (!staff) return res.status(404).json({ message: 'Akun penjaga toko tidak ditemukan.' });

    const hashed = await hashPassword(newPassword);
    await db('users').where({ id }).update({ password: hashed, updated_at: db.fn.now() });
    res.json({ message: 'Password berhasil direset.' });
  } catch (err) {
    next(err);
  }
}

async function setActive(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { id } = req.params;
    const { isActive } = req.body;

    const staff = await db('users').where({ id, owner_id: ownerId, role: 'staff' }).first();
    if (!staff) return res.status(404).json({ message: 'Akun penjaga toko tidak ditemukan.' });

    await db('users').where({ id }).update({ is_active: !!isActive, updated_at: db.fn.now() });
    res.json({ message: isActive ? 'Akun diaktifkan kembali.' : 'Akun dinonaktifkan. Riwayat transaksi tetap tersimpan.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, resetPassword, setActive };
