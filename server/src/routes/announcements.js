import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { notifyAllTeachers } from '../notifications.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, u.name AS author FROM announcements a
    JOIN users u ON u.id = a.created_by ORDER BY a.created_at DESC, a.id DESC
  `).all();
  res.json(rows);
});

router.post('/', requireAdmin, (req, res) => {
  const { title, body, audience } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const info = db.prepare('INSERT INTO announcements (title, body, audience, created_by) VALUES (?, ?, ?, ?)')
    .run(title, body || '', audience || 'all', req.user.id);
  const ann = db.prepare(`
    SELECT a.*, u.name AS author FROM announcements a JOIN users u ON u.id=a.created_by WHERE a.id = ?
  `).get(info.lastInsertRowid);
  notifyAllTeachers('New announcement', title, 'announcement', '/announcements');
  res.status(201).json(ann);
});

router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

export default router;
