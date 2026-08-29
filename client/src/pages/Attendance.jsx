import { useState, useEffect, useCallback } from 'react';
import { http } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import Icon from '../components/Icon';
import { PageLoader } from '../components/Spinner';
import { useFetch } from '../utils/useFetch';

const STATUS = { present: 'present', absent: 'absent', late: 'late', leave: 'leave' };

export default function Attendance() {
  const { isAdmin, teacher } = useAuth();
  const [tab, setTab] = useState(isAdmin ? 'reports' : 'mark');

  return (
    <div className="fade-in-up">
      <PageHeader title="Attendance" subtitle={isAdmin ? 'Monitor attendance across the school' : 'Mark attendance for your classes'} />

      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {!isAdmin && <TabBtn active={tab === 'mark'} onClick={() => setTab('mark')}>Mark Attendance</TabBtn>}
        <TabBtn active={tab === 'reports'} onClick={() => setTab('reports')}>Reports</TabBtn>
      </div>

      {tab === 'mark' && <MarkAttendance teacher={teacher} />}
      {tab === 'reports' && <AttendanceReports isAdmin={isAdmin} teacher={teacher} />}
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return <button onClick={onClick} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${active ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'}`}>{children}</button>;
}

function MarkAttendance({ teacher }) {
  const toast = useToast();
  const { data: classes } = useFetch('/classes');
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!classId) return;
    setLoading(true);
    try {
      const list = await http.get(`/attendance/class/${classId}/students`);
      setStudents(list);
      const init = {};
      try {
        const existing = await http.get(`/attendance/class/${classId}?date=${date}`);
        for (const s of list) init[s.id] = existing.find((x) => x.student_id === s.id)?.status || 'present';
      } catch { for (const s of list) init[s.id] = 'present'; }
      setStatuses(init);
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [classId, date]);

  async function save() {
    const records = students.map((s) => ({ student_id: s.id, status: statuses[s.id] || 'present' }));
    try {
      await http.post('/attendance/mark', { records, date });
      toast.success(`Attendance saved for ${records.length} students`);
      load();
    } catch (e) { toast.error(e.message); }
  }

  const counts = students.reduce((acc, s) => { acc[statuses[s.id] || 'present'] = (acc[statuses[s.id] || 'present'] || 0) + 1; return acc; }, {});

  return (
    <div className="fade-in-up">
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Class</label>
            <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select class</option>
              {(classes || []).map((c) => <option key={c.id} value={c.id}>Class {c.name} - {c.section}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex items-end pb-1">
            <button className="btn-primary w-full" onClick={save} disabled={!classId}>💾 Save Attendance</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="badge bg-emerald-100 text-emerald-700">Present {counts.present || 0}</span>
          <span className="badge bg-red-100 text-red-700">Absent {counts.absent || 0}</span>
          <span className="badge bg-amber-100 text-amber-700">Late {counts.late || 0}</span>
          <span className="badge bg-purple-100 text-purple-700">Leave {counts.leave || 0}</span>
          <span className="badge bg-ink-100 text-ink-600">Total {students.length}</span>
        </div>
      </div>

      {!classId ? <div className="card py-16 text-center text-ink-400 text-sm">Select a class to begin marking attendance</div>
      : loading ? <PageLoader /> :
      <div className="card overflow-hidden">
        {students.length === 0 ? <div className="py-16 text-center text-ink-400 text-sm">No students in this class</div> :
        <div className="table-responsive">
          <table className="min-w-full">
            <thead><tr><th className="th">Student</th><th className="th">Roll No</th><th className="th text-center">Present</th><th className="th text-center">Absent</th><th className="th text-center">Late</th><th className="th text-center">Leave</th></tr></thead>
            <tbody>
              {students.map((s) => {
                const st = statuses[s.id] || 'present';
                return (
                  <tr key={s.id} className="hover:bg-ink-50/70">
                    <td className="td font-semibold text-ink-800">{s.name}</td>
                    <td className="td font-mono text-ink-500">{s.roll_no}</td>
                    {['present', 'absent', 'late', 'leave'].map((status) => (
                      <td key={status} className="td text-center">
                        <button onClick={() => setStatuses((x) => ({ ...x, [s.id]: status }))}
                          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-md transition ${st === status ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400 hover:bg-ink-200'}`}>
                          {st === status ? <Icon name={STATUS[status]} className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-ink-300" />}
                        </button>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>}
      </div>}
    </div>
  );
}

function AttendanceReports({ isAdmin, teacher }) {
  const [classFilter, setClassFilter] = useState('');
  const { data: classes } = useFetch('/classes');
  const { data: rows, loading, reload } = useFetch(`/attendance/report?class_id=${classFilter}`);

  function pct(row) {
    if (!row.total) return 0;
    return Math.round((row.present / row.total) * 100);
  }

  let list = rows || [];
  // For teacher: filter to their classes only (we'll just show all for simplicity but teacher can filter)
  // isAdmin can see all

  return (
    <div className="fade-in-up">
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <label className="label !mb-0">Class</label>
        <select className="input max-w-xs" value={classFilter} onChange={(e) => { setClassFilter(e.target.value); }}>
          <option value="">All classes</option>
          {(classes || []).map((c) => <option key={c.id} value={c.id}>Class {c.name} - {c.section}</option>)}
        </select>
      </div>
      {loading ? <PageLoader /> :
      <div className="card overflow-hidden">
        <div className="table-responsive">
          <table className="min-w-full">
            <thead><tr><th className="th">Student</th><th className="th">Class</th><th className="th">Present</th><th className="th">Absent</th><th className="th">Late</th><th className="th">Total</th><th className="th">Attendance %</th></tr></thead>
            <tbody>
              {(list || []).map((r) => (
                <tr key={r.student_id} className="hover:bg-ink-50/70">
                  <td className="td font-semibold text-ink-800">{r.student_name}</td>
                  <td className="td text-ink-500">Class {r.class_name} - {r.section}</td>
                  <td className="td text-emerald-600 font-semibold">{r.present || 0}</td>
                  <td className="td text-red-600 font-semibold">{r.absent || 0}</td>
                  <td className="td text-amber-600">{r.late || 0}</td>
                  <td className="td text-ink-500">{r.total || 0}</td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-ink-100 overflow-hidden">
                        <div className={`h-full ${pct(r) >= 80 ? 'bg-emerald-500' : pct(r) >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: pct(r) + '%' }} />
                      </div>
                      <span className="font-bold text-sm">{pct(r)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(list || []).length === 0 && <div className="py-16 text-center text-ink-400 text-sm">No attendance records</div>}
      </div>}
    </div>
  );
}
