exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.foreign('owner_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('store_id').references('id').inTable('stores').onDelete('SET NULL');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropForeign('owner_id');
    table.dropForeign('store_id');
  });
};
