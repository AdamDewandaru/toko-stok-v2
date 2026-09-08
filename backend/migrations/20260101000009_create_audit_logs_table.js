exports.up = function (knex) {
  return knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').unsigned().primary();
    table
      .integer('owner_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.string('action', 100).notNullable();
    table.string('entity_type', 60).notNullable();
    table.integer('entity_id').unsigned().nullable();
    table.json('meta').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['owner_id', 'created_at']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('audit_logs');
};
