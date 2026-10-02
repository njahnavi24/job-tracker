// Middleware: checks the JWT sent in the "Authorization: Bearer <token>" header
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Login required' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id; // routes use this to only touch the user's own data
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};