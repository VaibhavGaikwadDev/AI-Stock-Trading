const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Joi = require('joi');
const fs = require('fs');
const db = require('../config/db');

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only images'), false);
} });

// Get Balance
router.get('/balance', async (req, res) => {
  const user = await User.findById(req.user.user_id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ balance: user.wallet_balance, trial_remaining: user.trial_remaining });
});

// Submit Top-up
router.post('/topup', upload.single('screenshot'), async (req, res) => {
  const { error } = Joi.object({ txn_id: Joi.string().required(), method: Joi.string().valid('UPI', 'NEFT').required(), amount: Joi.number().positive().required() }).validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { txn_id, method, amount } = req.body;
  const screenshot_path = req.file ? `/uploads/${req.file.filename}` : '';
  await db.execute(
    'INSERT INTO transactions (txn_id, user_id, method, screenshot_path, amount) VALUES (?, ?, ?, ?, ?)',
    [txn_id, req.user.user_id, method, screenshot_path, amount]
  );
  res.json({ message: 'Payment submitted, pending approval' });
});

module.exports = router;