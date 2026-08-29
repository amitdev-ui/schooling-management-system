import { db } from './db.js';
import bcrypt from 'bcryptjs';

export async function seed() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count > 0) return;

  const adminHash = await bcrypt.hash('admin123', 10);
  const teacherHash = await bcrypt.hash('teacher123', 10);

  // Seed classes
  const classNames = ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const sections = ['A', 'B'];
  const classIds = [];
  for (const name of classNames) {
    for (const sec of sections) {
      const info = db.prepare('INSERT INTO classes (name, section) VALUES (?, ?)').run(name, sec);
      classIds.push(info.lastInsertRowid);
    }
  }

  // Seed subjects
  const subjectNames = [
    ['Mathematics', 'MATH'],
    ['English', 'ENG'],
    ['Science', 'SCI'],
    ['Social Studies', 'SST'],
    ['Computer Science', 'CS'],
    ['Urdu', 'URD'],
    ['Islamic Studies', 'ISL'],
    ['Art', 'ART'],
  ];
  const subjectIds = {};
  for (const [name, code] of subjectNames) {
    const info = db.prepare('INSERT INTO subjects (name, code) VALUES (?, ?)').run(name, code);
    subjectIds[name] = info.lastInsertRowid;
    subjectIds[code] = info.lastInsertRowid;
  }

  // Assign subjects to each class
  const assignSubject = db.prepare('INSERT INTO class_subjects (class_id, subject_id) VALUES (?, ?)');
  const allSubjectIds = subjectNames.map(([name]) => subjectIds[name]);
  for (const cid of classIds) {
    for (const sid of allSubjectIds) {
      assignSubject.run(cid, sid);
    }
  }

  // Seed teachers
  const teacherNames = [
    ['Ayesha Khan', 'MATH'],
    ['Muhammad Ali', 'ENG'],
    ['Sara Ahmed', 'SCI'],
    ['Usman Tariq', 'CS'],
    ['Fatima Noor', 'URD'],
  ];
  const teacherIds = [];
  for (const [name, subj] of teacherNames) {
    const info = db.prepare(
      'INSERT INTO teachers (name, email, phone, subject_id, qualification, joined_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@school.com`, `0300${Math.floor(1000000 + Math.random() * 9000000)}`, subjectIds[subj], 'Masters', '2023-01-01');
    teacherIds.push(info.lastInsertRowid);
  }

  // Seed users
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run('System Administrator', 'admin@school.com', adminHash, 'admin');

  // Give a couple teachers user accounts
  for (let i = 0; i < 2; i++) {
    const t = teacherIds[i];
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(t);
    db.prepare('INSERT INTO users (name, email, password_hash, role, teacher_id) VALUES (?, ?, ?, ?, ?)')
      .run(teacher.name, teacher.email, teacherHash, 'teacher', t);
  }

  // Assign Teacher 1 (Ayesha - Math) as class teacher of Class 1-A etc.
  const assignCT = db.prepare('UPDATE classes SET class_teacher_id = ? WHERE id = ?');
  teacherIds.forEach((t, i) => {
    assignCT.run(t, classIds[i % classIds.length]);
  });

  // Seed students - generate realistic names
  const firstNames = ['Ahmed', 'Ali', 'Hassan', 'Bilal', 'Omar', 'Zain', 'Hamza', 'Danish', 'Imran', 'Salman', 'Areeba', 'Hina', 'Zara', 'Maryam', 'Sana', 'Aqsa', 'Rida', 'Nimra', 'Maham', 'Laiba', 'Talha', 'Farhan', 'Saad', 'Waqar', 'Noman', 'Fahad', 'Zubair', 'Yasir', 'Kamran', 'Rashid'];
  const lastNames = ['Khan', 'Ahmed', 'Hussain', 'Malik', 'Qureshi', 'Sheikh', 'Butt', 'Chaudhry', 'Rana', 'Abbasi', 'Javed', 'Iqbal', 'Nawaz', 'Sharif', 'Ali', 'Siddiqui', 'Farooqi', 'Haider', 'Raza', 'Baig'];
  let roll = 1;
  const insertStudent = db.prepare(
    'INSERT INTO students (roll_no, name, gender, dob, class_id, guardian, guardian_phone, address, email, admission_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const cids = classIds;
  for (let i = 0; i < 120; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const gender = Math.random() > 0.5 ? 'Male' : 'Female';
    const classId = cids[i % cids.length];
    insertStudent.run(
      String(roll++).padStart(4, '0'),
      `${fn} ${ln}`,
      gender,
      `20${10 + (i % 12)}-0${(i % 9) + 1}-1${i % 9}`,
      classId,
      `${ln} ${gender === 'Male' ? 'Father' : 'Father'}`,
      `0301${Math.floor(1000000 + Math.random() * 9000000)}`,
      `House ${1 + (i % 50)}, Street ${1 + (i % 20)}, Lahore`,
      `${fn.toLowerCase()}.${ln.toLowerCase()}@gmail.com`,
      '2022-04-01',
      'active'
    );
  }

  // Seed attendance for today
  const today = new Date().toISOString().slice(0, 10);
  const students = db.prepare('SELECT * FROM students').all();
  const insertAtt = db.prepare('INSERT INTO attendance (student_id, class_id, date, status, marked_by) VALUES (?, ?, ?, ?, ?)');
  const adminUser = db.prepare("SELECT id FROM users WHERE role='admin'").get();
  for (const s of students) {
    const r = Math.random();
    const status = r < 0.82 ? 'present' : r < 0.9 ? 'absent' : r < 0.97 ? 'late' : 'leave';
    insertAtt.run(s.id, s.class_id, today, status, adminUser.id);
  }

  // Seed fee structure for each class
  const feeInsert = db.prepare('INSERT INTO fee_structure (class_id, name, amount) VALUES (?, ?, ?)');
  for (const cid of classIds) {
    const tuition = 8000 + (classIds.length - cid) * 500;
    feeInsert.run(cid, 'Tuition Fee (Monthly)', tuition);
    feeInsert.run(cid, 'Transport Fee (Monthly)', 2000);
    feeInsert.run(cid, 'Examination Fee', 1000);
  }

  // Seed some payments
  const paymentInsert = db.prepare('INSERT INTO payments (student_id, fee_structure_id, amount, method, note, recorded_by, date) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (let i = 0; i < students.length; i += 2) {
    const s = students[i];
    const fee = db.prepare('SELECT * FROM fee_structure WHERE class_id = ? LIMIT 1').get(s.class_id);
    paymentInsert.run(s.id, fee.id, fee.amount, 'cash', 'Monthly fee', adminUser.id, today);
  }

  // Seed exams and marks
  const examInsert = db.prepare('INSERT INTO exams (name, class_id, subject_id, date, max_marks) VALUES (?, ?, ?, ?, ?)');
  const markInsert = db.prepare('INSERT INTO marks (exam_id, student_id, marks_obtained) VALUES (?, ?, ?)');
  for (const cid of classIds) {
    const classSubjects = db.prepare('SELECT subject_id FROM class_subjects WHERE class_id = ?').all(cid);
    for (const cs of classSubjects) {
      const examId = examInsert.run('Mid-term', cid, cs.subject_id, today, 100).lastInsertRowid;
      const classStudents = db.prepare('SELECT id FROM students WHERE class_id = ?').all(cid);
      for (const st of classStudents) {
        markInsert.run(examId, st.id, Math.floor(40 + Math.random() * 61));
      }
    }
  }

  // Seed announcements
  db.prepare('INSERT INTO announcements (title, body, audience, created_by) VALUES (?, ?, ?, ?)')
    .run('Welcome to the new academic session', 'We are excited to welcome all students and staff to the new academic year. Classes begin next Monday.', 'all', adminUser.id);
  db.prepare('INSERT INTO announcements (title, body, audience, created_by) VALUES (?, ?, ?, ?)')
    .run('Parent-Teacher Meeting', 'The quarterly parent-teacher meeting will be held this Saturday at 10:00 AM in the main hall.', 'all', adminUser.id);

  // Seed some notifications
  const notifInsert = db.prepare('INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?)');
  const teachers = db.prepare("SELECT id FROM users WHERE role='teacher'").all();
  for (const t of teachers) {
    notifInsert.run(t.id, 'Attendance marking due', 'Please mark today\u2019s attendance for your classes before 2:00 PM.', 'warning', 0);
  }
  notifInsert.run(adminUser.id, 'Fees update', 'Monthly fee collection is 52% complete. A few dues remain.', 'info', 0);

  console.log('Seed data created.');
}
