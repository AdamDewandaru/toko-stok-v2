exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').unsigned().primary();
    // owner_id: NULL for an owner account itself. For a staff account, points to the owner's user id.
    table.integer('owner_id').unsigned().nullable();
    // store_id: NULL for owner accounts. For staff, the single store they are assigned to.
    table.integer('store_id').unsigned().nullable();
    table.string('business_name', 150).nullable(); // only meaningful for role = owner
    table.string('name', 150).notNullable();
    table.string('username', 100).notNullable().unique();
    table.string('password', 255).notNullable();
    table.enu('role', ['owner', 'staff']).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('users');
};
