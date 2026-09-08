exports.up = function (knex) {
  return knex.schema.createTable('stock_transaction_items', (table) => {
    table.increments('id').unsigned().primary();
    table
      .integer('stock_transaction_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('stock_transactions')
      .onDelete('CASCADE');
    table
      .integer('product_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('products')
      .onDelete('RESTRICT');
    table.integer('quantity').unsigned().notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['product_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stock_transaction_items');
};
