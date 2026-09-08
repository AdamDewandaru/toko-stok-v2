const express = require('express');
const auth = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { loginLimiter, forgotPasswordLimiter, registerLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', registerLimiter, auth.register);
router.post('/login', loginLimiter, auth.login);
router.get('/me', requireAuth, auth.me);
router.post('/change-password', requireAuth, auth.changePassword);
router.get('/recovery-question', forgotPasswordLimiter, auth.getRecoveryQuestion);
router.post('/forgot-password', forgotPasswordLimiter, auth.forgotPassword);

module.exports = router;
