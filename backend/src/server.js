const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Toko Stok API berjalan di http://localhost:${PORT}`);
});
