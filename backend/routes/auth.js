const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateOTP } = require('../utils/otp');
const { sendEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const db = require('../config/db');

// // Validation
// const signupSchema = Joi.object({ name: Joi.string().required(), email: Joi.string().email().required(), password: Joi.string().min(6).required() });
// const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required(), captcha_token: Joi.string().required() });

// Validation
// const signupSchema = Joi.object({ name: Joi.string().required(), email: Joi.string().email().required(), password: Joi.string().min(6).required() });
const loginSchema = Joi.object({ 
  email: Joi.string().email().required(), 
  password: Joi.string().required(), 
  captcha_token: Joi.string().required(),
  rememberMe: Joi.boolean().optional()  // Fixed: Allow optional rememberMe
});

// Send OTP
router.post('/send-otp', async (req, res) => {
  const { error } = Joi.object({ email: Joi.string().email().required(), purpose: Joi.string().valid('verification', 'reset').required() }).validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { email, purpose } = req.body;
  const user = await User.findByEmail(email);
  if (purpose === 'verification' && !user) return res.status(400).json({ error: 'User not found' });
  if (purpose === 'reset' && !user) return res.status(400).json({ error: 'No account' });

  const otp = generateOTP();
  await User.storeOTP(email, otp);
  const subject = purpose === 'verification' ? 'Verify Email' : 'Reset Password';
  const html = `<h2>OTP: ${otp}</h2><p>Expires in 10 min.</p>`;
  await sendEmail(email, subject, html);

  res.json({ message: 'OTP sent' });
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { error } = Joi.object({ email: Joi.string().email().required(), otp: Joi.string().length(6).required() }).validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { email, otp } = req.body;
  const isValid = await User.verifyOTP(email, otp);
  if (!isValid) return res.status(400).json({ error: 'Invalid OTP' });

  const user = await User.findByEmail(email);
  if (user && !user.email_verified) {
    await db.execute('UPDATE users SET email_verified = true WHERE email = ?', [email]);
  }

  res.json({ verified: true, user_id: user.user_id });
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { error } = Joi.object({ email: Joi.string().email().required(), newPassword: Joi.string().min(6).required() }).validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  await User.updatePassword(req.body.email, req.body.newPassword);
  res.json({ message: 'Password reset' });
});

// Login
router.post('/login', async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { email, password, captcha_token, rememberMe = false } = req.body;

  // CAPTCHA Verify
  const captchaRes = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captcha_token}`);
  const captchaData = await captchaRes.json();
  if (!captchaData.success) return res.status(400).json({ error: 'CAPTCHA failed' });

  // Auth
  const isValid = await User.verifyPassword(email, password);
  if (!isValid) return res.status(400).json({ error: 'Invalid credentials' });

  const user = await User.findByEmail(email);
  const token = jwt.sign({ user_id: user.user_id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  if (rememberMe) res.cookie('authToken', token, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, secure: false });

  res.json({ token, user_id: user.user_id, role: user.role });
});

module.exports = router;