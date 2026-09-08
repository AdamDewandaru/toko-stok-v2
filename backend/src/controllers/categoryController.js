const db = require('../config/db');

async function list(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const categories = await db('categories')
      .where({ owner_id: null })
      .orWhere({ owner_id: ownerId })
      .orderBy('name', 'asc');
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Nama kategori wajib diisi.' });

    const [{ id }] = await db('categories').insert({ owner_id: ownerId, name }).returning('id');
    const category = await db('categories').where({ id }).first();
    res.status(201).json({ message: 'Kategori berhasil ditambahkan.', data: category });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { id } = req.params;
    const { name } = req.body;

    const category = await db('categories').where({ id, owner_id: ownerId }).first();
    if (!category) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan atau merupakan kategori default sistem.' });
    }
    await db('categories').where({ id }).update({ name: name ?? category.name, updated_at: db.fn.now() });
    const updated = await db('categories').where({ id }).first();
    res.json({ message: 'Kategori berhasil diperbarui.', data: updated });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { id } = req.params;
    const category = await db('categories').where({ id, owner_id: ownerId }).first();
    if (!category) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan atau merupakan kategori default sistem.' });
    }
    const usedCount = await db('products').where({ category_id: id }).count('id as c').first();
    if (Number(usedCount.c) > 0) {
      return res.status(409).json({ message: 'Kategori masih digunakan oleh barang dan tidak dapat dihapus.' });
    }
    await db('categories').where({ id }).del();
    res.json({ message: 'Kategori berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
