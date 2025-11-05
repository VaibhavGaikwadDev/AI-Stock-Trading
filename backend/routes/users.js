const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Joi = require('joi');

// Create User
router.post('/', async (req, res) => {
  const { error } = Joi.object({ name: Joi.string().required(), email: Joi.string().email().required(), password: Joi.string().min(6).required() }).validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { name, email, password } = req.body;
  const existing = await User.findByEmail(email);
  if (existing) return res.status(409).json({ error: 'Email exists' });

  const result = await User.create({ name, email, password });
  res.status(201).json({ message: 'User created, verify OTP', user_id: result.user_id });
});

// List Users
router.get('/', async (req, res) => {
  const { search = '', page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  const { users, total } = await User.listUsers(search, parseInt(limit), parseInt(offset));
  res.json({ users: users.map(u => ({ ...u, password_hash: undefined })), total, page: parseInt(page), limit: parseInt(limit) });
});

// Get User
router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password_hash, ...safe } = user;
  res.json({ user: safe });
});

// Update User
router.put('/:id', async (req, res) => {
  await User.update(req.params.id, req.body);
  res.json({ updated: true });
});

// Delete User
router.delete('/:id', async (req, res) => {
  await User.delete(req.params.id);
  res.json({ deleted: true });
});

module.exports = router;