const express = require('express');
const stock = require('../controllers/stockController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/products', stock.productsWithStock);
router.post('/transactions', stock.createTransaction);
router.get('/transactions', stock.listTransactions);
router.get('/transactions/:id', stock.transactionDetail);

module.exports = router;
