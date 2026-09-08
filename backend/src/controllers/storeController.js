const db = require('../config/db');

const MAX_STORES = Number(process.env.MAX_STORES_PER_OWNER || 3);

function slugCode(name, index) {
  const letters = name
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toUpperCase()
    .slice(0, 3) || 'TK';
  return `${letters}${index}`;
}

async function list(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const stores = await db('stores').where({ owner_id: ownerId }).orderBy('id', 'asc');
    res.json({ data: stores, maxStores: MAX_STORES });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { name, address, code } = req.body;
    if (!name) return res.status(400).json({ message: 'Nama toko wajib diisi.' });

    const activeCount = await db('stores')
      .where({ owner_id: ownerId, is_active: true })
      .count('id as c')
      .first();

    if (Number(activeCount.c) >= MAX_STORES) {
      return res.status(422).json({
        message: `Batas toko tercapai. Akun Anda sudah memiliki ${MAX_STORES} toko aktif.`,
      });
    }

    const finalCode = code && code.trim() ? code.trim().toUpperCase() : slugCode(name, Number(activeCount.c) + 1);

    const existingCode = await db('stores').where({ owner_id: ownerId, code: finalCode }).first();
    if (existingCode) {
      return res.status(409).json({ message: 'Kode toko sudah digunakan. Gunakan kode lain.' });
    }

    const [{ id }] = await db('stores').insert({
      owner_id: ownerId,
      code: finalCode,
      name,
      address: address || null,
      is_active: true,
    }).returning('id');

    const store = await db('stores').where({ id }).first();
    res.status(201).json({ message: 'Toko berhasil ditambahkan.', data: store });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { id } = req.params;
    const { name, address } = req.body;

    const store = await db('stores').where({ id, owner_id: ownerId }).first();
    if (!store) return res.status(404).json({ message: 'Toko tidak ditemukan.' });

    await db('stores')
      .where({ id })
      .update({
        name: name ?? store.name,
        address: address ?? store.address,
        updated_at: db.fn.now(),
      });

    const updated = await db('stores').where({ id }).first();
    res.json({ message: 'Toko berhasil diperbarui.', data: updated });
  } catch (err) {
    next(err);
  }
}

async function setActive(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { id } = req.params;
    const { isActive } = req.body;

    const store = await db('stores').where({ id, owner_id: ownerId }).first();
    if (!store) return res.status(404).json({ message: 'Toko tidak ditemukan.' });

    if (isActive) {
      const activeCount = await db('stores')
        .where({ owner_id: ownerId, is_active: true })
        .whereNot({ id })
        .count('id as c')
        .first();
      if (Number(activeCount.c) >= MAX_STORES) {
        return res.status(422).json({
          message: `Batas toko tercapai. Akun Anda sudah memiliki ${MAX_STORES} toko aktif.`,
        });
      }
    }

    await db('stores').where({ id }).update({ is_active: !!isActive, updated_at: db.fn.now() });
    const updated = await db('stores').where({ id }).first();
    res.json({
      message: isActive ? 'Toko diaktifkan kembali.' : 'Toko dinonaktifkan. Riwayat transaksi tetap tersimpan.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, setActive, MAX_STORES };
