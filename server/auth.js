const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'cipher_manage_session';
const SESSION_TTL = '8h';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and contain at least 32 characters.');
  }
  return secret;
}

function sign(admin) {
  return jwt.sign({
    sub: Number(admin.id),
    role: admin.role,
    v: Number(admin.session_version || 1),
  }, getSecret(), { expiresIn: SESSION_TTL });
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => {
    const idx = part.indexOf('=');
    if (idx < 0) return [part.trim(), ''];
    return [part.slice(0, idx).trim(), decodeURIComponent(part.slice(idx + 1).trim())];
  }).filter(([k]) => k));
}

function getToken(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies[COOKIE_NAME]) return cookies[COOKIE_NAME];
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=28800; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`);
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`);
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const payload = verifyToken(token);
    if (!payload?.sub) throw new Error('Invalid session');
    req.admin = payload;
    next();
  } catch {
    clearSessionCookie(res);
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
}

function requireSameOrigin(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (!origin) return next();
  try {
    const url = new URL(origin);
    if (url.host !== req.get('host')) return res.status(403).json({ error: 'Cross-origin request blocked' });
  } catch {
    return res.status(403).json({ error: 'Invalid request origin' });
  }
  next();
}

module.exports = {
  COOKIE_NAME,
  sign,
  getToken,
  setSessionCookie,
  clearSessionCookie,
  verifyToken,
  requireAuth,
  requireAdmin: requireAuth,
  requireSameOrigin,
};
