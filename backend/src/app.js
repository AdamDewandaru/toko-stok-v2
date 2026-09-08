require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');

const app = express();

const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

app.use(cors({
  origin(origin, callback) {
    const isVercelOrigin = origin && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
    if (!origin || configuredOrigins.includes(origin) || isVercelOrigin) {
      return callback(null, true);
    }
    return callback(new Error('Origin tidak diizinkan oleh CORS.'));
  },
}));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'toko-stok-v2-api' }));

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
});

// Centralized error handler — keeps messages user-friendly in Indonesian
// and never leaks stack traces to the client.
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Data sudah ada / duplikat.' });
  }
  res.status(err.statusCode || 500).json({
    message: err.publicMessage || 'Terjadi kesalahan pada server. Silakan coba lagi.',
  });
});

module.exports = app;
