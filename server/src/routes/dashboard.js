import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/stats', (req, res) => {
  if (req.user.role === 'admin') {
    const students = db.prepare("SELECT COUNT(*) c FROM students WHERE status='active'").get().c;
    const teachers = db.prepare('SELECT COUNT(*) c FROM teachers').get().c;
    const classes = db.prepare('SELECT COUNT(*) c FROM classes').get().c;
    const subjects = db.prepare('SELECT COUNT(*) c FROM subjects').get().c;
    const fees = db.prepare('SELECT COALESCE(SUM(amount),0) t FROM payments').get().t;
    const feesMonth = db.prepare("SELECT COALESCE(SUM(amount),0) t FROM payments WHERE date >= date('now','start of month')").get().t;
    const attendanceToday = db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) AS absent
      FROM attendance WHERE date = date('now')
    `).get();
    const announcementCount = db.prepare('SELECT COUNT(*) c FROM announcements').get().c;
    res.json({
      students, teachers, classes, subjects,
      fees, feesMonth, announcementCount,
      attendanceToday: { total: attendanceToday.total || 0, present: attendanceToday.present || 0, absent: attendanceToday.absent || 0 },
    });
  } else {
    const tid = req.user.teacher_id;
    const myClasses = tid ? db.prepare('SELECT * FROM classes WHERE class_teacher_id = ?').all(tid) : [];
    const classIds = myClasses.map((c) => c.id);
    const studentWhere = classIds.length ? `WHERE class_id IN (${classIds.join(',')})` : 'WHERE 1=0';
    const myStudents = db.prepare(`SELECT COUNT(*) c FROM students ${studentWhere}`).get().c;
    const exams = db.prepare(`
      SELECT COUNT(DISTINCT e.id) c FROM exams e
      JOIN teachers t ON t.subject_id = e.subject_id WHERE t.id = ?
    `).get(tid).c;
    const announcements = db.prepare('SELECT COUNT(*) c FROM announcements').get().c;
    const unread = db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND is_read=0').get(req.user.id).c;
    const todayAtt = db.prepare(`
      SELECT COUNT(*) total, SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) present
      FROM attendance WHERE date=date('now')
    `).get();
    res.json({
      myClasses: myClasses.length,
      myStudents,
      exams,
      announcements,
      unread,
      todayAtt: { total: todayAtt.total || 0, present: todayAtt.present || 0 },
    });
  }
});

// Monthly fees trend (admin)
router.get('/fees-trend', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', date) AS month, COALESCE(SUM(amount),0) AS total
    FROM payments GROUP BY month ORDER BY month DESC LIMIT 6
  `).all().reverse();
  res.json(rows);
});

// Students per class (pie)
router.get('/students-per-class', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT c.name || ' ' || c.section AS name, COUNT(s.id) AS value
    FROM classes c LEFT JOIN students s ON s.class_id = c.id AND s.status='active'
    GROUP BY c.id ORDER BY c.name, c.section
  `).all();
  res.json(rows);
});

// Attendance trend (last 10 days)
router.get('/attendance-trend', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT date, COUNT(*) total,
      ROUND(100.0 * SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) / COUNT(*), 1) AS pct
    FROM attendance GROUP BY date ORDER BY date DESC LIMIT 10
  `).all().reverse();
  res.json(rows);
});

// Recent activity/notifications for admin
router.get('/activity', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT 'payment' AS kind, 'Fee payment' AS title,
      COALESCE((SELECT name FROM students WHERE id=p.student_id),'') AS detail,
      p.date AS created_at
    FROM payments p ORDER BY p.id DESC LIMIT 6
  `).all();
  res.json(rows);
});

export default router;
