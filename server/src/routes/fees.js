import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Fee structure
router.get('/structure', (req, res) => {
  const rows = db.prepare(`
    SELECT fs.*, c.name AS class_name, c.section
    FROM fee_structure fs JOIN classes c ON c.id = fs.class_id ORDER BY c.name, c.section, fs.name
  `).all();
  res.json(rows);
});

router.post('/structure', requireAdmin, (req, res) => {
  const { class_id, name, amount } = req.body || {};
  if (!class_id || !name || amount == null) return res.status(400).json({ error: 'Missing fields' });
  const info = db.prepare('INSERT INTO fee_structure (class_id, name, amount) VALUES (?, ?, ?)')
    .run(Number(class_id), name, Number(amount));
  res.status(201).json(db.prepare('SELECT * FROM fee_structure WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/structure/:id', requireAdmin, (req, res) => {
  const { name, amount, class_id } = req.body || {};
  db.prepare('UPDATE fee_structure SET name=?, amount=?, class_id=? WHERE id=?')
    .run(name, Number(amount), Number(class_id), Number(req.params.id));
  res.json(db.prepare('SELECT * FROM fee_structure WHERE id = ?').get(Number(req.params.id)));
});

router.delete('/structure/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM fee_structure WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// Payments
router.get('/payments', (req, res) => {
  const { student_id, class_id } = req.query;
  let sql = `
    SELECT p.*, s.name AS student_name, s.roll_no, c.name AS class_name, c.section, fs.name AS fee_name
    FROM payments p
    JOIN students s ON s.id = p.student_id
    JOIN classes c ON c.id = s.class_id
    LEFT JOIN fee_structure fs ON fs.id = p.fee_structure_id
  `;
  const where = []; const params = [];
  if (student_id) { where.push('p.student_id = ?'); params.push(Number(student_id)); }
  if (class_id) { where.push('s.class_id = ?'); params.push(Number(class_id)); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY p.date DESC, p.id DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/payments', requireAdmin, (req, res) => {
  const b = req.body || {};
  if (!b.student_id || b.amount == null) return res.status(400).json({ error: 'Student and amount required' });
  const info = db.prepare('INSERT INTO payments (student_id, fee_structure_id, amount, method, note, recorded_by, date) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(Number(b.student_id), b.fee_structure_id ? Number(b.fee_structure_id) : null, Number(b.amount), b.method || 'cash', b.note || null, req.user.id, b.date || new Date().toISOString().slice(0, 10));
  res.status(201).json(db.prepare('SELECT * FROM payments WHERE id = ?').get(info.lastInsertRowid));
});

router.delete('/payments/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM payments WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// Dues / ledger per student: sum structure - sum paid / month
router.get('/dues', (req, res) => {
  const { class_id } = req.query;
  let sql = `
    SELECT s.id AS student_id, s.name AS student_name, s.roll_no,
      c.name AS class_name, c.section, c.id AS class_id,
      COALESCE((SELECT SUM(amount) FROM fee_structure WHERE class_id = s.class_id), 0) AS expected,
      COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = s.id), 0) AS paid
    FROM students s JOIN classes c ON c.id = s.class_id WHERE s.status='active'
  `;
  const params = [];
  if (class_id) { sql += ' AND s.class_id = ?'; params.push(Number(class_id)); }
  sql += ' ORDER BY c.name, c.section, s.name';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map((r) => ({ ...r, due: Math.max(0, r.expected - r.paid) })));
});

// Summary
router.get('/summary', (req, res) => {
  const total = db.prepare('SELECT COALESCE(SUM(amount),0) AS t FROM payments').get().t;
  const month = db.prepare("SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE date >= date('now','start of month')").get().t;
  const due = db.prepare(`
    SELECT COUNT(*) AS c FROM (
      SELECT s.id,
        COALESCE((SELECT SUM(amount) FROM fee_structure WHERE class_id = s.class_id), 0) AS expected,
        COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = s.id), 0) AS paid
      FROM students s WHERE s.status='active'
    ) WHERE paid < expected
  `).get().c;
  const today = db.prepare("SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE date = date('now')").get().t;
  const outstanding = db.prepare(`
    SELECT COALESCE(SUM(expected - paid), 0) AS t FROM (
      SELECT s.id,
        COALESCE((SELECT SUM(amount) FROM fee_structure WHERE class_id = s.class_id), 0) AS expected,
        COALESCE((SELECT SUM(amount) FROM payments WHERE student_id = s.id), 0) AS paid
      FROM students s WHERE s.status='active'
    )
  `).get().t;
  res.json({ total, month, today, dues: due, outstanding });
});

export default router;
