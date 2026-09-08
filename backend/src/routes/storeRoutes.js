const express = require('express');
const stores = require('../controllers/storeController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', stores.list);
router.post('/', requireRole('owner'), stores.create);
router.put('/:id', requireRole('owner'), stores.update);
router.patch('/:id/active', requireRole('owner'), stores.setActive);

module.exports = router;
