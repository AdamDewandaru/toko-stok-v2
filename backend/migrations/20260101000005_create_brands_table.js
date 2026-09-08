exports.up = function (knex) {
  return knex.schema.createTable('brands', (table) => {
    table.increments('id').unsigned().primary();
    // owner_id NULL = a global default brand visible to all owners.
    table
      .integer('owner_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('brands');
};
