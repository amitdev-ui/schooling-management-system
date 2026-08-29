import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, t.name AS class_teacher_name,
      (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS student_count
    FROM classes c LEFT JOIN teachers t ON t.id = c.class_teacher_id
    ORDER BY c.name, c.section
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`SELECT c.*, t.name AS class_teacher_name FROM classes c LEFT JOIN teachers t ON t.id=c.class_teacher_id WHERE c.id=?`).get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Class not found' });
  res.json(row);
});

router.post('/', requireAdmin, (req, res) => {
  const { name, section, class_teacher_id } = req.body || {};
  if (!name || !section) return res.status(400).json({ error: 'Name and section are required' });
  try {
    const info = db.prepare('INSERT INTO classes (name, section, class_teacher_id) VALUES (?, ?, ?)').run(name, section, class_teacher_id || null);
    res.status(201).json(db.prepare('SELECT * FROM classes WHERE id = ?').get(info.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ error: 'Class already exists for this section' });
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  const { name, section, class_teacher_id } = req.body || {};
  db.prepare('UPDATE classes SET name=?, section=?, class_teacher_id=? WHERE id=?').run(name, section, class_teacher_id || null, Number(req.params.id));
  res.json(db.prepare('SELECT * FROM classes WHERE id = ?').get(Number(req.params.id)));
});

router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM classes WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

export default router;
