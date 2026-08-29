import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { http } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { PageLoader } from '../components/Spinner';
import { useFetch } from '../utils/useFetch';

export default function Marks() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState(isAdmin ? 'report' : 'mark');

  return (
    <div className="fade-in-up">
      <PageHeader title="Marks & Exams" subtitle={isAdmin ? 'View report cards and manage exams' : 'Enter marks for your subjects'} />

      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        <TabBtn active={tab === 'mark'} onClick={() => setTab('mark')}>Enter Marks</TabBtn>
        {isAdmin && <TabBtn active={tab === 'report'} onClick={() => setTab('report')}>Report Cards</TabBtn>}
      </div>

      {tab === 'mark' && <EnterMarks />}
      {tab === 'report' && <Reports isAdmin={isAdmin} />}
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return <button onClick={onClick} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${active ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'}`}>{children}</button>;
}

function EnterMarks() {
  const toast = useToast();
  const [examId, setExamId] = useState('');
  const { data: exams } = useFetch('/exams');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!examId) return;
      setLoading(true);
      try { const d = await http.get(`/marks/exams/${examId}/marks`); setRows(d.rows); } catch (e) { toast.error(e.message); } finally { setLoading(false); }
    })();
  }, [examId]);

  async function saveAll() {
    try {
      for (const r of rows) await http.post(`/marks/exams/${examId}/marks`, { student_id: r.student_id, marks_obtained: r.marks_obtained });
      toast.success('All marks saved');
    } catch (e) { toast.error(e.message); }
  }

  function update(id, val) {
    setRows((rs) => rs.map((r) => (r.student_id === id ? { ...r, marks_obtained: val === '' ? null : Number(val) } : r)));
  }

  return (
    <div className="fade-in-up">
      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1"><label className="label">Select Exam</label>
          <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>
            <option value="">Choose an exam</option>
            {(exams || []).map((x) => <option key={x.id} value={x.id}>{x.name} — Class {x.class_name} {x.section} ({x.subject_name})</option>)}
          </select>
        </div>
        <button className="btn-primary self-end" onClick={saveAll} disabled={!examId || rows.length === 0}>💾 Save All</button>
      </div>

      {!examId ? <div className="card py-16 text-center text-ink-400 text-sm">Select an exam to enter marks. New exams are added by admins.</div>
      : loading ? <PageLoader /> :
      <div className="card overflow-hidden">
        <div className="table-responsive">
          <table className="min-w-full">
            <thead><tr><th className="th">#</th><th className="th">Student</th><th className="th">Roll No</th><th className="th">Marks (out of 100)</th><th className="th">Grade</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.student_id} className="hover:bg-ink-50/70">
                  <td className="td text-ink-400">{i + 1}</td>
                  <td className="td font-semibold text-ink-800">{r.student_name}</td>
                  <td className="td font-mono text-ink-500">{r.roll_no}</td>
                  <td className="td">
                    <input className="input w-24" type="number" min="0" max="100" value={r.marks_obtained ?? ''} onChange={(e) => update(r.student_id, e.target.value)} />
                  </td>
                  <td className="td"><GradeBadge m={r.marks_obtained} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <div className="py-16 text-center text-ink-400 text-sm">No students in this exam</div>}
      </div>}
    </div>
  );
}

function GradeBadge({ m }) {
  if (m == null) return <span className="badge bg-ink-100 text-ink-500">Pending</span>;
  const pct = Number(m);
  const g = pct >= 90 ? ['A+', 'success'] : pct >= 80 ? ['A', 'success'] : pct >= 70 ? ['B', 'info'] : pct >= 60 ? ['C', 'warning'] : pct >= 50 ? ['D', 'warning'] : ['F', 'danger'];
  return <Badge tone={g[1]}>{g[0]}</Badge>;
}

function Reports({ isAdmin }) {
  const { data: classes } = useFetch('/classes');
  const [classId, setClassId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const printRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (!classId) { setReport(null); return; }
      setLoading(true);
      try { setReport(await http.get(`/marks/report-card/${classId}`)); } catch (e) { toast.error(e.message); } finally { setLoading(false); }
    })();
  }, [classId]);

  return (
    <div className="fade-in-up">
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <label className="label !mb-0">Class</label>
        <select className="input max-w-xs" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Select class</option>
          {(classes || []).map((c) => <option key={c.id} value={c.id}>Class {c.name} - {c.section}</option>)}
        </select>
        <button className="btn-secondary no-print" onClick={() => window.print()} disabled={!report}>🖨️ Print report cards</button>
      </div>

      {!classId ? <div className="card py-16 text-center text-ink-400 text-sm">Select a class to generate report cards</div>
      : loading ? <PageLoader /> : report ?
      <div ref={printRef} className="space-y-4">
        {Array.isArray(report.students) && report.students.map((r) => (
          <div key={r.student.id} className="card p-5 print-area">
            <div className="flex items-center justify-between border-b-2 border-dashed border-ink-200 pb-3 mb-3">
              <div>
                <p className="text-xl font-extrabold text-brand-700">EduCore School</p>
                <p className="text-xs text-ink-400">Report Card — Class {report.class.name} {report.class.section}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-ink-800">{r.student.name}</p>
                <p className="text-xs text-ink-400 font-mono">Roll: {r.student.roll_no}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(r.subjects).map(([sub, v]) => {
                const subPct = v.max > 0 ? Math.round((v.scored / v.max) * 1000) / 10 : 0;
                return (
                  <div key={sub} className="bg-ink-50/70 rounded-lg p-3">
                    <p className="text-xs font-semibold text-ink-500 uppercase">{sub}</p>
                    <p className="text-lg font-extrabold text-ink-900 mt-0.5">{v.scored}<span className="text-sm font-semibold text-ink-400">/{v.max}</span></p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 flex-1 rounded-full bg-ink-200 overflow-hidden"><div className={`h-full ${subPct >= 60 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: subPct + '%' }} /></div>
                      <span className="text-[11px] font-bold text-ink-600">{subPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-ink-100 flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                <span className="text-ink-500">Total: <b className="text-ink-800">{r.total}/{r.max}</b></span>
                <span className="text-ink-500">Percentage: <b className="text-ink-800">{r.pct}%</b></span>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={r.grade === 'F' ? 'danger' : 'success'}>{r.grade}</Badge>
                <span className="badge bg-brand-50 text-brand-700">Rank #{r.rank}</span>
              </div>
            </div>
          </div>
        ))}
      </div> : <div className="card py-16 text-center text-ink-400 text-sm">No data</div>}
    </div>
  );
}
