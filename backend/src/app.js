require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');

const app = express();

// The API is public and authenticates requests with JWT. Allow browser clients
// from Vercel previews and custom domains to reach the API.
app.use(cors({ origin: true }));
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
