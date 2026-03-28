import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password, display_name } = req.body || {};
  if (!email || !password || !display_name) {
    return res.status(400).json({ error: 'email, password, and display_name are required' });
  }
  const password_hash = await bcrypt.hash(password, 10);
  try {
    const [r] = await pool.query(
      'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
      [email.trim().toLowerCase(), password_hash, display_name.trim()]
    );
    const userId = r.insertId;
    const token = signToken(userId, email);
    return res.status(201).json({ token, user: { id: userId, email: email.trim().toLowerCase(), display_name } });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error(e);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }
  try {
    const [rows] = await pool.query('SELECT id, email, password_hash, display_name FROM users WHERE email = ?', [
      email.trim().toLowerCase(),
    ]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(user.id, user.email);
    res.json({
      token,
      user: {
        id: Number(user.id),
        email: user.email,
        display_name: user.display_name,
      },
    });
  } catch (e) {
    console.error('POST /login', e);
    const code = e.code;
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT' || code === 'EAI_AGAIN') {
      return res.status(503).json({
        error:
          'Cannot reach MySQL. Start the MySQL service and check MYSQL_HOST / MYSQL_PORT in server/.env.',
      });
    }
    if (code === 'ER_BAD_DB_ERROR') {
      return res.status(503).json({
        error: 'Database does not exist. From the server folder run: npm run db:init',
      });
    }
    if (code === 'ER_ACCESS_DENIED_ERROR') {
      return res.status(503).json({
        error: 'MySQL rejected the login. Fix MYSQL_USER and MYSQL_PASSWORD in server/.env.',
      });
    }
    return res.status(500).json({
      error: 'Login failed (server). Check the API terminal for details.',
    });
  }
});

function signToken(userId, email) {
  const secret = process.env.JWT_SECRET || 'dev-insecure-secret';
  const id = Number(userId);
  if (!Number.isFinite(id)) {
    throw new Error('Invalid user id for token');
  }
  return jwt.sign({ sub: id, email }, secret, { expiresIn: '7d' });
}

export default router;
