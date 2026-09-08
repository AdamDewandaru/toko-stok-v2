exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.string('recovery_question', 150).nullable();
    table.string('recovery_answer_hash', 255).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('recovery_question');
    table.dropColumn('recovery_answer_hash');
  });
};
