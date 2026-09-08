const express = require('express');
const categories = require('../controllers/categoryController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', categories.list);
router.post('/', requireRole('owner'), categories.create);
router.put('/:id', requireRole('owner'), categories.update);
router.delete('/:id', requireRole('owner'), categories.remove);

module.exports = router;
