const express = require('express');
const staff = require('../controllers/staffController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('owner'));

router.get('/', staff.list);
router.post('/', staff.create);
router.put('/:id', staff.update);
router.patch('/:id/password', staff.resetPassword);
router.patch('/:id/active', staff.setActive);

module.exports = router;
