const db = require('../config/db');

async function list(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { search, categoryId, brandId, status, page = 1, limit = 20 } = req.query;

    let query = db('products')
      .join('categories', 'products.category_id', 'categories.id')
      .leftJoin('brands', 'products.brand_id', 'brands.id')
      .where('products.owner_id', ownerId)
      .whereNull('products.deleted_at');

    if (search) {
      query = query.andWhere('products.name', 'like', `%${search}%`);
    }
    if (categoryId) {
      query = query.andWhere('products.category_id', categoryId);
    }
    if (brandId) {
      query = query.andWhere('products.brand_id', brandId);
    }
    if (status === 'active') {
      query = query.andWhere('products.is_active', true);
    } else if (status === 'inactive') {
      query = query.andWhere('products.is_active', false);
    }

    const totalRow = await query.clone().count('products.id as c').first();

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(200, Math.max(1, Number(limit) || 20));

    const products = await query
      .clone()
      .select(
        'products.id',
        'products.name',
        'products.code',
        'products.minimum_stock',
        'products.is_active',
        'products.category_id',
        'categories.name as category_name',
        'products.brand_id',
        'brands.name as brand_name',
        'products.created_at'
      )
      .orderBy(['brand_name', 'products.name'])
      .limit(limitNum)
      .offset((pageNum - 1) * limitNum);

    res.json({ data: products, total: Number(totalRow.c), page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { name, categoryId, brandId, code, minimumStock } = req.body;

    if (!name) return res.status(400).json({ message: 'Nama barang wajib diisi.' });
    if (!categoryId) return res.status(400).json({ message: 'Kategori wajib dipilih.' });

    const category = await db('categories')
      .where({ id: categoryId })
      .andWhere((b) => b.whereNull('owner_id').orWhere({ owner_id: ownerId }))
      .first();
    if (!category) return res.status(400).json({ message: 'Kategori tidak valid.' });

    if (brandId) {
      const brand = await db('brands')
        .where({ id: brandId })
        .andWhere((b) => b.whereNull('owner_id').orWhere({ owner_id: ownerId }))
        .first();
      if (!brand) return res.status(400).json({ message: 'Brand tidak valid.' });
    }

    const [{ id }] = await db('products').insert({
      owner_id: ownerId,
      category_id: categoryId,
      brand_id: brandId || null,
      code: code || null,
      name,
      minimum_stock: minimumStock ?? Number(process.env.DEFAULT_MIN_STOCK || 5),
      is_active: true,
    }).returning('id');

    const product = await db('products').where({ id }).first();
    res.status(201).json({ message: 'Barang berhasil ditambahkan.', data: product });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { id } = req.params;
    const { name, categoryId, brandId, code, minimumStock } = req.body;

    const product = await db('products').where({ id, owner_id: ownerId }).whereNull('deleted_at').first();
    if (!product) return res.status(404).json({ message: 'Barang tidak ditemukan.' });

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Nama barang wajib diisi.' });
    }

    await db('products')
      .where({ id })
      .update({
        name,
        category_id: categoryId ?? product.category_id,
        brand_id: brandId === undefined ? product.brand_id : brandId,
        code: code === undefined ? product.code : code,
        minimum_stock: minimumStock ?? product.minimum_stock,
        updated_at: db.fn.now(),
      });

    const updated = await db('products').where({ id }).first();
    res.json({ message: 'Barang berhasil diperbarui.', data: updated });
  } catch (err) {
    next(err);
  }
}

async function setActive(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { id } = req.params;
    const { isActive } = req.body;

    const product = await db('products').where({ id, owner_id: ownerId }).whereNull('deleted_at').first();
    if (!product) return res.status(404).json({ message: 'Barang tidak ditemukan.' });

    await db('products').where({ id }).update({ is_active: !!isActive, updated_at: db.fn.now() });
    res.json({ message: isActive ? 'Barang diaktifkan kembali.' : 'Barang dinonaktifkan.' });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const ownerId = req.user.ownerId;
    const { id } = req.params;

    const product = await db('products').where({ id, owner_id: ownerId }).whereNull('deleted_at').first();
    if (!product) return res.status(404).json({ message: 'Barang tidak ditemukan.' });

    // Soft delete only: transaction history must remain readable (RB-08).
    await db('products')
      .where({ id })
      .update({ deleted_at: db.fn.now(), is_active: false, updated_at: db.fn.now() });

    res.json({ message: 'Barang berhasil dihapus. Riwayat transaksi barang ini tetap tersimpan.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, setActive, remove };
