const { verifyToken } = require('../utils/jwt');
const db = require('../config/db');

/**
 * Verifies the Bearer token and attaches a normalized `req.user` context:
 *   { id, role, ownerId, storeId, isActive }
 * ownerId is ALWAYS the id that scopes tenant data:
 *   - for an owner account, ownerId === their own user id
 *   - for a staff account, ownerId === the owner's user id they belong to
 * This is looked up fresh from the DB (not just trusted from the token)
 * so a deactivated account is rejected immediately.
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login kembali.' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ message: 'Sesi tidak valid atau sudah kedaluwarsa. Silakan login kembali.' });
    }

    const user = await db('users').where({ id: decoded.sub }).first();
    if (!user) {
      return res.status(401).json({ message: 'Akun tidak ditemukan.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan. Hubungi pemilik usaha.' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      ownerId: user.role === 'owner' ? user.id : user.owner_id,
      storeId: user.store_id,
      businessName: user.business_name,
    };
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk melakukan tindakan ini.' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
