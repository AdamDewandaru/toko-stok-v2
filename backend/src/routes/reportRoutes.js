const express = require('express');
const reports = require('../controllers/reportController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('owner'));

router.get('/stock-summary', reports.stockSummary);
router.get('/movements', reports.movements);
router.get('/low-stock', reports.lowStock);
router.get('/top-movers', reports.topMovers);
router.get('/store-performance', reports.storePerformance);
router.get('/export/movements', reports.exportMovements);
router.get('/export/movements-pdf', reports.exportMovementsPdf);
router.get('/export/low-stock-pdf', reports.exportLowStockPdf);
router.get('/audit-log', reports.auditLog);

module.exports = router;
