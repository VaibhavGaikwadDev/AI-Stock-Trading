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