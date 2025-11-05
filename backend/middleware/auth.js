const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.authToken;
    if (!token) return res.status(401).json({ error: 'Access denied' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    const [rows] = await db.execute('SELECT blocked, role FROM users WHERE user_id = ?', [decoded.user_id]);
    if (rows[0]?.blocked) return res.status(403).json({ error: 'Account blocked' });
    if (req.path.startsWith('/api/admin') && rows[0]?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};