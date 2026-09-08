/**
 * Seeds global (owner_id = NULL) default categories and brands.
 * These are visible to every owner and used to pre-fill Kelola Barang.
 */
exports.seed = async function (knex) {
  const existingCategories = await knex('categories').whereNull('owner_id').count('id as c').first();
  if (Number(existingCategories.c) === 0) {
    await knex('categories').insert([
      { name: 'Rokok', owner_id: null },
      { name: 'Sembako', owner_id: null },
      { name: 'Makanan & Minuman', owner_id: null },
    ]);
  }

  const existingBrands = await knex('brands').whereNull('owner_id').count('id as c').first();
  if (Number(existingBrands.c) === 0) {
    await knex('brands').insert([
      { name: 'Sampoerna', owner_id: null },
      { name: 'Djarum', owner_id: null },
      { name: 'Gudang Garam', owner_id: null },
      { name: 'Gajah Baru', owner_id: null },
      { name: 'JTI', owner_id: null },
      { name: 'BAT', owner_id: null },
      { name: 'Wismilak', owner_id: null },
      { name: 'Umum / Tanpa Brand', owner_id: null },
    ]);
  }
};
