import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { notify } from '../notifications.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const ok = await bcrypt.compare(String(password), user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
  const token = signToken(user);
  db.prepare('INSERT INTO sessions (user_id, token) VALUES (?, ?)').run(user.id, token);
  let teacher = null;
  if (user.role === 'teacher' && user.teacher_id) {
    teacher = db.prepare('SELECT t.*, s.name AS subject_name FROM teachers t LEFT JOIN subjects s ON s.id=t.subject_id WHERE t.id = ?').get(user.teacher_id);
  }
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, teacherId: user.teacher_id },
    teacher,
  });
});

router.post('/logout', requireAuth, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(req.sessionToken);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  let teacher = null;
  if (req.user.role === 'teacher' && req.user.teacher_id) {
    teacher = db.prepare('SELECT t.*, s.name AS subject_name FROM teachers t LEFT JOIN subjects s ON s.id=t.subject_id WHERE t.id = ?').get(req.user.teacher_id);
  }
  res.json({ user: req.user, teacher });
});

router.post('/change-password', requireAuth, async (req, res) => {
  const { current, next } = req.body || {};
  if (!current || !next) return res.status(400).json({ error: 'All fields required' });
  const ok = await bcrypt.compare(String(current), req.user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
  if (String(next).length < 4) return res.status(400).json({ error: 'New password too short' });
  const hash = await bcrypt.hash(String(next), 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  notify(req.user.id, 'Password changed', 'Your account password was updated successfully.', 'success');
  res.json({ ok: true });
});

export default router;
