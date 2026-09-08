const express = require('express');
const products = require('../controllers/productController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('owner'));

router.get('/', products.list);
router.post('/', products.create);
router.put('/:id', products.update);
router.patch('/:id/active', products.setActive);
router.delete('/:id', products.remove);

module.exports = router;
