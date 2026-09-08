exports.up = function (knex) {
  return knex.schema.createTable('stores', (table) => {
    table.increments('id').unsigned().primary();
    table
      .integer('owner_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('code', 30).notNullable(); // e.g. BJ1, unique per owner
    table.string('name', 150).notNullable();
    table.string('address', 255).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['owner_id', 'code']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('stores');
};
