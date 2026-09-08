const express = require('express');
const brands = require('../controllers/brandController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', brands.list);
router.post('/', requireRole('owner'), brands.create);
router.put('/:id', requireRole('owner'), brands.update);
router.delete('/:id', requireRole('owner'), brands.remove);

module.exports = router;
