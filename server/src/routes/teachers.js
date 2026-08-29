import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { notifyAllTeachers } from '../notifications.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT t.*, s.name AS subject_name,
      (SELECT COUNT(*) FROM classes c WHERE c.class_teacher_id = t.id) AS class_teacher_for
    FROM teachers t LEFT JOIN subjects s ON s.id = t.subject_id ORDER BY t.name
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM teachers WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Teacher not found' });
  res.json(row);
});

router.get('/:id/classes', (req, res) => {
  const rows = db.prepare(`
    SELECT c.id, c.name, c.section, c.class_teacher_id,
      (SELECT COUNT(*) FROM students s WHERE s.class_id=c.id) AS student_count
    FROM classes c WHERE c.class_teacher_id = ? OR c.id IN (
      SELECT cs.class_id FROM class_subjects cs JOIN teachers t ON t.subject_id = cs.subject_id WHERE t.id = ?
    ) ORDER BY c.name, c.section
  `).all(Number(req.params.id), Number(req.params.id));
  res.json(rows);
});

router.post('/', requireAdmin, (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: 'Name is required' });
  const info = db.prepare(`
    INSERT INTO teachers (name, email, phone, subject_id, qualification, joined_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(b.name, b.email || null, b.phone || null, b.subject_id || null, b.qualification || null, b.joined_at || null);
  res.status(201).json(db.prepare('SELECT * FROM teachers WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', requireAdmin, (req, res) => {
  const b = req.body || {};
  db.prepare('UPDATE teachers SET name=?, email=?, phone=?, subject_id=?, qualification=?, joined_at=? WHERE id=?')
    .run(b.name, b.email || null, b.phone || null, b.subject_id || null, b.qualification || null, b.joined_at || null, Number(req.params.id));
  res.json(db.prepare('SELECT * FROM teachers WHERE id = ?').get(Number(req.params.id)));
});

router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM teachers WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

export default router;
