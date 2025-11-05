const db = require('../config/db');
const bcrypt = require('bcrypt');
const { generateOTP } = require('../utils/otp');

class User {
  static async create({ name, email, password }) {
    const hashed = await bcrypt.hash(password, 12);
    const userId = `U${Date.now()}`;
    const [result] = await db.execute(
      'INSERT INTO users (user_id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [userId, name, email, hashed]
    );
    return { id: result.insertId, user_id: userId };
  }

  static async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async verifyPassword(email, password) {
    const user = await this.findByEmail(email);
    if (!user) return false;
    return bcrypt.compare(password, user.password_hash);
  }

  static async updatePassword(email, password) {
    const hashed = await bcrypt.hash(password, 12);
    await db.execute('UPDATE users SET password_hash = ? WHERE email = ?', [hashed, email]);
  }

  static async listUsers(search = '', limit = 10, offset = 0) {
    const query = search 
      ? 'SELECT *, COUNT(*) OVER() as total FROM users WHERE email LIKE ? OR user_id LIKE ? LIMIT ? OFFSET ?'
      : 'SELECT *, COUNT(*) OVER() as total FROM users LIMIT ? OFFSET ?';
    const params = search ? [`%${search}%`, `%${search}%`, limit, offset] : [limit, offset];
    const [rows] = await db.execute(query, params);
    const total = rows[0]?.total || 0;
    return { users: rows, total };
  }

  static async findById(user_id) {
    const [rows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [user_id]);
    return rows[0];
  }

  static async update(user_id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), user_id];
    await db.execute(`UPDATE users SET ${fields} WHERE user_id = ?`, values);
  }

  static async delete(user_id) {
    await db.execute('DELETE FROM users WHERE user_id = ?', [user_id]);
  }

  static async storeOTP(email, otp) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.execute(
      'INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, expires_at = ?',
      [email, otp, expiresAt, otp, expiresAt]
    );
  }

  static async verifyOTP(email, otp) {
    const [rows] = await db.execute('SELECT * FROM otps WHERE email = ? AND otp = ? AND expires_at > NOW()', [email, otp]);
    if (rows.length === 0) return false;
    await db.execute('DELETE FROM otps WHERE email = ? AND otp = ?', [email, otp]);
    return true;
  }
}

module.exports = User;

// // backend/models/User.js
// const db = require('../config/db');
// const bcrypt = require('bcrypt');
// const { generateOTP } = require('../utils/otp');

// /**
//  * User Model
//  * Matches your DB schema:
//  * - user_id (UNIQUE)
//  * - name, email, password_hash
//  * - wallet_balance (DECIMAL)
//  * - trial_remaining (INT)
//  * - email_verified (TINYINT)
//  * - blocked (TINYINT)
//  */
// class User {
//   // ========================
//   // 1. CREATE USER (Signup)
//   // ========================
//   static async create({ name, email, password }) {
//     try {
//       // 1. Check duplicate
//       const existing = await this.findByEmail(email);
//       if (existing) throw new Error('Email already registered');

//       // 2. Hash password
//       const password_hash = await bcrypt.hash(password, 12);

//       // 3. Unique user_id
//       const user_id = `U${Date.now()}_${Math.floor(Math.random() * 10000)}`;

//       // 4. Insert with defaults
//       const [result] = await db.execute(
//         `INSERT INTO users 
//          (user_id, name, email, password_hash, wallet_balance, trial_remaining, email_verified, blocked)
//          VALUES (?, ?, ?, ?, 0.00, 5, 0, 0)`,
//         [user_id, name, email, password_hash]
//       );

//       return { id: result.insertId, user_id };
//     } catch (err) {
//       throw new Error(err.message || 'Failed to create user');
//     }
//   }

//   // ========================
//   // 2. FIND USER
//   // ========================
//   static async findByEmail(email) {
//     const [rows] = await db.execute(
//       'SELECT * FROM users WHERE email = ?',
//       [email]
//     );
//     return rows[0] || null;
//   }

//   static async findById(user_id) {
//     const [rows] = await db.execute(
//       'SELECT * FROM users WHERE user_id = ?',
//       [user_id]
//     );
//     return rows[0] || null;
//   }

//   // ========================
//   // 3. PASSWORD
//   // ========================
//   static async verifyPassword(email, password) {
//     const user = await this.findByEmail(email);
//     if (!user) return false;
//     return bcrypt.compare(password, user.password_hash);
//   }

//   static async updatePassword(email, newPassword) {
//     const hashed = await bcrypt.hash(newPassword, 12);
//     await db.execute(
//       'UPDATE users SET password_hash = ? WHERE email = ?',
//       [hashed, email]
//     );
//   }

//   // ========================
//   // 4. ADMIN: LIST USERS
//   // ========================
//   static async listUsers({ search = '', page = 1, limit = 10 }) {
//     const offset = (page - 1) * limit;
//     const searchParam = `%${search}%`;

//     let query = `
//       SELECT 
//         id, user_id, name, email, wallet_balance, trial_remaining,
//         email_verified, blocked, created_at,
//         COUNT(*) OVER() AS total_count
//       FROM users
//     `;
//     let params = [];

//     if (search) {
//       query += ` WHERE email LIKE ? OR user_id LIKE ?`;
//       params = [searchParam, searchParam];
//     }

//     query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
//     params.push(limit, offset);

//     const [rows] = await db.execute(query, params);
//     const total = rows[0]?.total_count || 0;

//     return {
//       users: rows.map(r => ({
//         ...r,
//         total_count: undefined // clean up
//       })),
//       total,
//       page: parseInt(page),
//       limit: parseInt(limit),
//     };
//   }

//   // ========================
//   // 5. UPDATE USER (Admin)
//   // ========================
//   static async update(user_id, updates) {
//     const allowed = ['wallet_balance', 'trial_remaining', 'blocked', 'email_verified'];
//     const fields = [];
//     const values = [];

//     for (const [key, value] of Object.entries(updates)) {
//       if (allowed.includes(key)) {
//         fields.push(`${key} = ?`);
//         values.push(value);
//       }
//     }

//     if (fields.length === 0) throw new Error('No valid fields to update');

//     values.push(user_id);
//     await db.execute(
//       `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`,
//       values
//     );
//   }

//   // ========================
//   // 6. DELETE USER
//   // ========================
//   static async delete(user_id) {
//     await db.execute('DELETE FROM users WHERE user_id = ?', [user_id]);
//   }

//   // ========================
//   // 7. OTP HANDLING
//   // ========================
//   static async storeOTP(email, otp) {
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
//     await db.execute(
//       `INSERT INTO otps (email, otp, expires_at)
//        VALUES (?, ?, ?)
//        ON DUPLICATE KEY UPDATE
//        otp = VALUES(otp), expires_at = VALUES(expires_at)`,
//       [email, otp, expiresAt]
//     );
//   }

//   static async verifyOTP(email, otp) {
//     const [rows] = await db.execute(
//       'SELECT 1 FROM otps WHERE email = ? AND otp = ? AND expires_at > NOW()',
//       [email, otp]
//     );

//     if (rows.length === 0) return false;

//     await db.execute('DELETE FROM otps WHERE email = ?', [email]);
//     await db.execute('UPDATE users SET email_verified = 1 WHERE email = ?', [email]);
//     return true;
//   }

//   // ========================
//   // 8. MARK EMAIL VERIFIED (after OTP)
//   // ========================
//   static async verifyEmail(email) {
//     await db.execute('UPDATE users SET email_verified = 1 WHERE email = ?', [email]);
//   }
// }

// module.exports = User;