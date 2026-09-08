exports.up = function (knex) {
  return knex.schema.createTable('stock_transactions', (table) => {
    table.increments('id').unsigned().primary();
    table
      .integer('owner_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('store_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('stores')
      .onDelete('CASCADE');
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');
    table.string('transaction_code', 40).notNullable();
    table.enu('type', ['IN', 'OUT']).notNullable();
    table.boolean('is_adjustment').notNullable().defaultTo(false);
    table.date('transaction_date').notNullable();
    table.string('notes', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['owner_id', 'store_id', 'transaction_date']);
    table.index(['store_id', 'type']);
    // Transaction codes are human-readable per business, not globally unique —
    // two different owners may independently generate the same code (e.g. same
    // store-code pattern on the same day), so uniqueness is scoped per owner.
    table.unique(['owner_id', 'transaction_code']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stock_transactions');
};
