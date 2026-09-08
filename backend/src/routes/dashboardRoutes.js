const express = require('express');
const dashboard = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/home', dashboard.home);
router.get('/low-stock', dashboard.lowStockAlerts);

module.exports = router;
