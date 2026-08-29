import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { notify } from '../notifications.js';

const router = Router();
router.use(requireAuth);

// Exams list (filter by class/subject)
router.get('/exams', (req, res) => {
  const { class_id, subject_id } = req.query;
  let sql = `
    SELECT e.*, c.name AS class_name, c.section, s.name AS subject_name
    FROM exams e
    JOIN classes c ON c.id = e.class_id
    JOIN subjects s ON s.id = e.subject_id
  `;
  const where = []; const params = [];
  if (class_id) { where.push('e.class_id = ?'); params.push(Number(class_id)); }
  if (subject_id) { where.push('e.subject_id = ?'); params.push(Number(subject_id)); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY e.date, e.name';
  res.json(db.prepare(sql).all(...params));
});

router.post('/exams', requireAuth, (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.class_id || !b.subject_id) return res.status(400).json({ error: 'Name, class and subject are required' });
  const info = db.prepare('INSERT INTO exams (name, class_id, subject_id, date, max_marks) VALUES (?, ?, ?, ?, ?)')
    .run(b.name, Number(b.class_id), Number(b.subject_id), b.date || null, b.max_marks || 100);
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(info.lastInsertRowid);
  // prefill marks rows
  const students = db.prepare('SELECT id FROM students WHERE class_id = ?').all(Number(b.class_id));
  const ins = db.prepare('INSERT INTO marks (exam_id, student_id, marks_obtained) VALUES (?, ?, NULL) ON CONFLICT(exam_id, student_id) DO NOTHING');
  for (const s of students) ins.run(info.lastInsertRowid, s.id);
  res.status(201).json(exam);
});

router.delete('/exams/:id', (req, res) => {
  db.prepare('DELETE FROM exams WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// Marks for an exam
router.get('/exams/:id/marks', (req, res) => {
  const examId = Number(req.params.id);
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  const rows = db.prepare(`
    SELECT m.*, s.name AS student_name, s.roll_no FROM marks m
    JOIN students s ON s.id = m.student_id
    WHERE m.exam_id = ? ORDER BY m.marks_obtained DESC
  `).all(examId);
  res.json({ exam, rows });
});

// Save a single mark
router.post('/exams/:id/marks', (req, res) => {
  const { student_id, marks_obtained } = req.body || {};
  db.prepare(`
    INSERT INTO marks (exam_id, student_id, marks_obtained) VALUES (?, ?, ?)
    ON CONFLICT(exam_id, student_id) DO UPDATE SET marks_obtained = excluded.marks_obtained
  `).run(Number(req.params.id), Number(student_id), Number(marks_obtained));
  if (req.user.role === 'teacher') {
    notify(req.user.id, 'Marks saved', 'Student marks were updated successfully.', 'success', '/marks');
  }
  res.json({ ok: true });
});

// Report card for a class
router.get('/report-card/:classId', (req, res) => {
  const classId = Number(req.params.classId);
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  const subjects = db.prepare(`SELECT s.* FROM class_subjects cs JOIN subjects s ON s.id=cs.subject_id WHERE cs.class_id=? ORDER BY s.name`).all(classId);
  const students = db.prepare('SELECT * FROM students WHERE class_id = ? ORDER BY name').all(classId);
  const exams = db.prepare('SELECT * FROM exams WHERE class_id = ?').all(classId);
  const marks = db.prepare('SELECT * FROM marks WHERE exam_id IN (SELECT id FROM exams WHERE class_id = ?)').all(classId);
  const result = students.map((st) => {
    const entries = {};
    let total = 0, max = 0, count = 0;
    for (const sub of subjects) {
      const subExams = exams.filter((e) => e.subject_id === sub.id);
      const subMarks = subExams.map((e) => {
        const m = marks.find((x) => x.exam_id === e.id && x.student_id === st.id);
        return m ? m.marks_obtained : null;
      });
      const scored = subMarks.filter((m) => m !== null).reduce((a, b) => a + b, 0);
      const subMax = subExams.length > 0 ? subExams.length * (subExams[0].max_marks || 100) : 0;
      entries[sub.name] = { scored, max: subMax, exams: subMarks };
      total += scored; max += subMax; count++;
    }
    const pct = max > 0 ? (total / max) * 100 : 0;
    return {
      student: { id: st.id, name: st.name, roll_no: st.roll_no },
      subjects: entries,
      total, max, pct: Math.round(pct * 10) / 10,
      grade: pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F',
    };
  });
  // rank
  const sorted = [...result].sort((a, b) => b.pct - a.pct);
  result.forEach((r) => { r.rank = sorted.findIndex((x) => x.student.id === r.student.id) + 1; });
  res.json({ class: cls, subjects, students: result });
});

export default router;
