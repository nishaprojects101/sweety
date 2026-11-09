import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    const errors = [];
    if (!name) errors.push({ field: 'name', message: 'Please enter your name.' });
    if (!EMAIL_RE.test(email)) errors.push({ field: 'email', message: 'Please enter a valid email.' });
    if (password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters.' });
    }
    if (errors.length) return res.status(400).json({ error: errors[0].message, errors });

    const existing = await query('SELECT 1 FROM users WHERE lower(email) = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
        errors: [{ field: 'email', message: 'An account with this email already exists.' }],
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hash]
    );
    res.status(201).json({ token: signToken(rows[0]), user: publicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    const { rows } = await query('SELECT * FROM users WHERE lower(email) = $1', [email]);
    const user = rows[0];
    // Same message for "no such user" and "wrong password" so we don't reveal which emails exist.
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) return res.status(401).json({ error: 'Incorrect email or password.' });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT id, name, email FROM users WHERE id = $1', [req.userId]);
    if (!rows[0]) return res.status(401).json({ error: 'Please log in.' });
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
