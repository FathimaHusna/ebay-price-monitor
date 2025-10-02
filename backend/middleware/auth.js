const jwt = require('jsonwebtoken');
const { loadEnv } = require('../config/environment');
const env = loadEnv();

function attachUser(req, _res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.substring(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { _id: payload.sub, email: payload.email };
  } catch (_) {
    // ignore
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

function signToken(user) {
  return jwt.sign({ sub: String(user._id), email: user.email }, env.JWT_SECRET, {
    expiresIn: '7d'
  });
}

module.exports = { attachUser, requireAuth, signToken };

