exports.up = function (knex) {
  return knex.schema.createTable('products', (table) => {
    table.increments('id').unsigned().primary();
    table
      .integer('owner_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('category_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('categories')
      .onDelete('RESTRICT');
    table
      .integer('brand_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('brands')
      .onDelete('SET NULL');
    table.string('code', 40).nullable();
    table.string('name', 150).notNullable();
    table.integer('minimum_stock').unsigned().notNullable().defaultTo(5);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    table.index(['owner_id', 'is_active']);
    table.index(['owner_id', 'category_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('products');
};
