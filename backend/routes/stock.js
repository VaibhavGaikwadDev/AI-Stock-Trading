const express = require('express');
const router = express.Router();
const User = require('../models/User');
const db = require('../config/db');
const multer = require('multer');
const upload = multer({ dest: './uploads/' });

const charges = { Scalping: 2, 'Day Trading': 3, 'Swing Trading': 5 };

// Perform Analysis
router.post('/analysis', upload.single('image'), async (req, res) => {
  const { strategy } = req.body;
  const user = await User.findById(req.user.user_id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.trial_remaining <= 0 && user.wallet_balance <= 0) return res.status(403).json({ error: 'No access, top-up wallet' });

  const cost = charges[strategy];
  if (user.wallet_balance < cost && user.trial_remaining <= 0) return res.status(403).json({ error: 'Insufficient balance' });

  let trialDeduct = false;
  if (user.trial_remaining > 0) {
    await db.execute('UPDATE users SET trial_remaining = trial_remaining - 1 WHERE user_id = ?', [user.user_id]);
    trialDeduct = true;
  } else {
    await db.execute('UPDATE users SET wallet_balance = wallet_balance - ? WHERE user_id = ?', [cost, user.user_id]);
  }

  const report = { strategy, recommendation: 'Buy', target: 150.00, stopLoss: 140.00, imagePath: req.file ? `/uploads/${req.file.filename}` : '' };

  await db.execute(
    'INSERT INTO stock_analysis_history (user_id, strategy, credits_deducted, analysis_result) VALUES (?, ?, ?, ?)',
    [user.user_id, strategy, cost, JSON.stringify(report)]
  );

  res.json({ report, credits_deducted: cost, trial_used: trialDeduct });
});

// Get History
router.get('/history', async (req, res) => {
  const user = await User.findById(req.user.user_id);
  if (!user || (user.wallet_balance === 0 && user.trial_remaining === 0)) return res.status(403).json({ error: 'No access to history' });

  const days = user.wallet_balance > 0 ? 15 : 0;
  const [rows] = await db.execute(
    'SELECT * FROM stock_analysis_history WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY created_at DESC',
    [user.user_id, days]
  );
  res.json({ history: rows });
});

module.exports = router;