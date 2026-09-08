const knex = require('knex');
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexConfig[environment] || knexConfig.development);

module.exports = db;
