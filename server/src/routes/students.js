import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { notify, notifyAllTeachers } from '../notifications.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { q, class_id, status } = req.query;
  let sql = `
    SELECT s.*, c.name AS class_name, c.section
    FROM students s
    LEFT JOIN classes c ON c.id = s.class_id
  `;
  const where = [];
  const params = [];
  if (q) {
    where.push('(s.name LIKE ? OR s.roll_no LIKE ? OR s.guardian LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (class_id) {
    where.push('s.class_id = ?');
    params.push(Number(class_id));
  }
  if (status) {
    where.push('s.status = ?');
    params.push(status);
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY c.name, c.section, s.name';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT s.*, c.name AS class_name, c.section
    FROM students s LEFT JOIN classes c ON c.id = s.class_id WHERE s.id = ?
  `).get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Student not found' });
  res.json(row);
});

router.post('/', requireAdmin, (req, res) => {
  const b = req.body || {};
  const required = ['name', 'roll_no'];
  for (const f of required) if (!b[f]) return res.status(400).json({ error: `${f} is required` });
  const info = db.prepare(`
    INSERT INTO students (roll_no, name, gender, dob, class_id, guardian, guardian_phone, address, email, admission_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    b.roll_no, b.name, b.gender || 'Male', b.dob || null, b.class_id || null,
    b.guardian || null, b.guardian_phone || null, b.address || null, b.email || null,
    b.admission_date || null, b.status || 'active'
  );
  const id = info.lastInsertRowid;
  notifyAllTeachers('New student added', `${b.name} (roll ${b.roll_no}) has been added to the school.`, 'info', '/students');
  res.status(201).json(db.prepare('SELECT * FROM students WHERE id = ?').get(id));
});

router.put('/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  db.prepare(`
    UPDATE students SET roll_no=?, name=?, gender=?, dob=?, class_id=?, guardian=?, guardian_phone=?, address=?, email=?, admission_date=?, status=?
    WHERE id=?
  `).run(
    b.roll_no, b.name, b.gender || 'Male', b.dob || null, b.class_id || null,
    b.guardian || null, b.guardian_phone || null, b.address || null, b.email || null,
    b.admission_date || null, b.status || 'active', id
  );
  res.json(db.prepare('SELECT * FROM students WHERE id = ?').get(id));
});

router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM students WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

export default router;
