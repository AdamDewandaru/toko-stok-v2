const db = require('../config/db');

async function list(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const brands = await db('brands')
      .where({ owner_id: null })
      .orWhere({ owner_id: ownerId })
      .orderBy('name', 'asc');
    res.json({ data: brands });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Nama brand wajib diisi.' });

    const [{ id }] = await db('brands').insert({ owner_id: ownerId, name }).returning('id');
    const brand = await db('brands').where({ id }).first();
    res.status(201).json({ message: 'Brand berhasil ditambahkan.', data: brand });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { id } = req.params;
    const { name } = req.body;

    const brand = await db('brands').where({ id, owner_id: ownerId }).first();
    if (!brand) {
      return res.status(404).json({ message: 'Brand tidak ditemukan atau merupakan brand default sistem.' });
    }
    await db('brands').where({ id }).update({ name: name ?? brand.name, updated_at: db.fn.now() });
    const updated = await db('brands').where({ id }).first();
    res.json({ message: 'Brand berhasil diperbarui.', data: updated });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { id } = req.params;
    const brand = await db('brands').where({ id, owner_id: ownerId }).first();
    if (!brand) {
      return res.status(404).json({ message: 'Brand tidak ditemukan atau merupakan brand default sistem.' });
    }
    const usedCount = await db('products').where({ brand_id: id }).count('id as c').first();
    if (Number(usedCount.c) > 0) {
      return res.status(409).json({ message: 'Brand masih digunakan oleh barang dan tidak dapat dihapus.' });
    }
    await db('brands').where({ id }).del();
    res.json({ message: 'Brand berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
