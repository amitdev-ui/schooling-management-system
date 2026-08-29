import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM subjects ORDER BY name').all();
  res.json(rows);
});

router.get('/:id/classes', (req, res) => {
  const rows = db.prepare(`
    SELECT c.id, c.name, c.section FROM class_subjects cs
    JOIN classes c ON c.id = cs.class_id WHERE cs.subject_id = ? ORDER BY c.name, c.section
  `).all(Number(req.params.id));
  res.json(rows);
});

router.post('/', requireAdmin, (req, res) => {
  const { name, code } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const info = db.prepare('INSERT INTO subjects (name, code) VALUES (?, ?)').run(name, code || null);
  res.status(201).json(db.prepare('SELECT * FROM subjects WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', requireAdmin, (req, res) => {
  const { name, code } = req.body || {};
  db.prepare('UPDATE subjects SET name=?, code=? WHERE id=?').run(name, code || null, Number(req.params.id));
  res.json(db.prepare('SELECT * FROM subjects WHERE id = ?').get(Number(req.params.id)));
});

router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM subjects WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

router.post('/:id/assign', requireAdmin, (req, res) => {
  const { class_ids } = req.body || {};
  const sid = Number(req.params.id);
  db.prepare('DELETE FROM class_subjects WHERE subject_id = ?').run(sid);
  const stmt = db.prepare('INSERT INTO class_subjects (class_id, subject_id) VALUES (?, ?)');
  if (Array.isArray(class_ids)) for (const cid of class_ids) stmt.run(Number(cid), sid);
  res.json({ ok: true });
});

export default router;
