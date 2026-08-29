import { db } from './db.js';

export function notify(userId, title, message, type = 'info', link = null) {
  const stmt = db.prepare(
    'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)'
  );
  const info = stmt.run(userId, title, message, type, link);
  return info.lastInsertRowid;
}

export function notifyAllTeachers(title, message, type = 'info', link = null) {
  const teachers = db.prepare("SELECT id FROM users WHERE role = 'teacher'").all();
  const stmt = db.prepare(
    'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)'
  );
  for (const t of teachers) stmt.run(t.id, title, message, type, link);
}
