const express = require('express');
const router = express.Router();
const db = require('../config/db');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');
const Joi = require('joi');

// List Pending Payments
router.get('/payments', async (req, res) => {
  const { status = 'pending', page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  const [rows] = await db.execute(
    'SELECT t.*, u.name, u.email FROM transactions t JOIN users u ON t.user_id = u.user_id WHERE t.status = ? LIMIT ? OFFSET ?',
    [status, limit, offset]
  );
  const [count] = await db.execute('SELECT COUNT(*) as total FROM transactions WHERE status = ?', [status]);
  res.json({ payments: rows, total: count[0].total, page: parseInt(page), limit: parseInt(limit) });
});

// Approve/Reject Payment
router.put('/payments/:txn_id', async (req, res) => {
  const { status, credits } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  await db.execute('UPDATE transactions SET status = ? WHERE txn_id = ?', [status, req.params.txn_id]);
  if (status === 'approved') {
    await db.execute('UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = (SELECT user_id FROM transactions WHERE txn_id = ?)', [credits, req.params.txn_id]);
    const [user] = await db.execute('SELECT email FROM users u JOIN transactions t ON u.user_id = t.user_id WHERE t.txn_id = ?', [req.params.txn_id]);
    await sendEmail(user[0].email, 'Payment Approved', '<h2>Credits added to wallet!</h2>');
  } else {
    const [user] = await db.execute('SELECT email FROM users u JOIN transactions t ON u.user_id = t.user_id WHERE t.txn_id = ?', [req.params.txn_id]);
    await sendEmail(user[0].email, 'Payment Rejected', '<h2>Please check details and resubmit.</h2>');
  }
  res.json({ updated: true });
});
// Send Low Balance Email
router.post('/send-notification/:user_id', async (req, res) => {
  const user = await User.findById(req.params.user_id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await sendEmail(user.email, 'Low Balance Alert', '<h2>Your wallet balance is low, please top-up.</h2>');
  res.json({ message: 'Email sent' });
});
module.exports = router;
