const jwt = require('jsonwebtoken');

const secret = () => {
  return process.env.JWT_SECRET || 'cipher-default-jwt-secret-key-32chars!!';
};

const sign = (admin) =>
  jwt.sign({ sub: admin.id, u: admin.username }, secret(), { expiresIn: '8h' });

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.admin = jwt.verify(token, secret());
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { sign, requireAdmin };
