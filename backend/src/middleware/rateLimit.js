const rateLimit = require('express-rate-limit');

/**
 * Limits repeated login/password attempts to slow down brute-force guessing.
 * Keyed by IP + username so one attacker can't lock out a legitimate user's
 * IP, and a shared IP (e.g. a whole warung's wifi) doesn't get globally
 * blocked by one bad actor targeting a different account.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${(req.body?.username || '').toLowerCase()}`,
  message: { message: 'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit.' },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${(req.body?.username || '').toLowerCase()}`,
  message: { message: 'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan pendaftaran dari perangkat ini. Coba lagi nanti.' },
});

module.exports = { loginLimiter, forgotPasswordLimiter, registerLimiter };
