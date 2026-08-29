import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { notify } from '../notifications.js';

const router = Router();
router.use(requireAuth);

// Get students of a class for attendance marking
router.get('/class/:classId/students', (req, res) => {
  const students = db.prepare('SELECT * FROM students WHERE class_id = ? ORDER BY name').all(Number(req.params.classId));
  res.json(students);
});

// Get attendance for a class/date
router.get('/class/:classId', (req, res) => {
  const classId = Number(req.params.classId);
  const date = req.query.date;
  const rows = db.prepare('SELECT * FROM attendance WHERE class_id = ? AND date = ? ORDER BY student_id').all(classId, date);
  res.json(rows);
});

// Mark attendance (bulk)
router.post('/mark', (req, res) => {
  const { records, date } = req.body || {};
  if (!Array.isArray(records) || !date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  const upsert = db.prepare(`
    INSERT INTO attendance (student_id, class_id, date, status, marked_by)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status
  `);
  let saved = 0;
  for (const r of records) {
    if (!r.student_id || !r.status) continue;
    const stu = db.prepare('SELECT class_id FROM students WHERE id = ?').get(Number(r.student_id));
    if (!stu) continue;
    upsert.run(Number(r.student_id), stu.class_id, date, r.status, req.user.id);
    saved++;
  }
  if (req.user.role === 'teacher') {
    notify(req.user.id, 'Attendance saved', `Attendance for ${date} saved for ${saved} student(s).`, 'success', '/attendance');
  }
  res.json({ ok: true, saved });
});

// Edit single
router.post('/:studentId/status', (req, res) => {
  const { date, status } = req.body || {};
  const stu = db.prepare('SELECT class_id FROM students WHERE id = ?').get(Number(req.params.studentId));
  if (!stu) return res.status(404).json({ error: 'Student not found' });
  db.prepare(`
    INSERT INTO attendance (student_id, class_id, date, status, marked_by)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status
  `).run(Number(req.params.studentId), stu.class_id, date, status, req.user.id);
  res.json({ ok: true });
});

// Report: attendance summary by class & date
router.get('/report', (req, res) => {
  const { from, to, class_id } = req.query;
  let sql = `
    SELECT s.id AS student_id, s.name AS student_name, s.roll_no, c.name AS class_name, c.section,
      c.id AS class_id,
      COUNT(a.id) AS total,
      SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) AS present,
      SUM(CASE WHEN a.status='absent' THEN 1 ELSE 0 END) AS absent,
      SUM(CASE WHEN a.status='late' THEN 1 ELSE 0 END) AS late,
      SUM(CASE WHEN a.status='leave' THEN 1 ELSE 0 END) AS leaved
    FROM students s
    JOIN classes c ON c.id = s.class_id
    LEFT JOIN attendance a ON a.student_id = s.id
      AND (a.date >= ? OR ? IS NULL) AND (a.date <= ? OR ? IS NULL)
    WHERE 1=1
  `;
  const params = [from || null, from || null, to || null, to || null];
  if (class_id) { sql += ' AND s.class_id = ?'; params.push(Number(class_id)); }
  sql += ' GROUP BY s.id ORDER BY c.name, c.section, s.name';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

export default router;
