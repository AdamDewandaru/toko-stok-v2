require('dotenv').config();

/** @type {import('knex').Knex.Config} */
const base = {
  client: 'pg',
  connection: process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'tokostok',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'toko_stok_v2',
      },
  pool: { min: 0, max: 10 },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
  },
};

module.exports = {
  development: base,
  production: base,
};
