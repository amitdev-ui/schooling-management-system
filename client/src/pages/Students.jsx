import { useState } from 'react';
import { http } from '../api/client';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { PageLoader } from '../components/Spinner';
import { useFetch } from '../utils/useFetch';

const empty = { roll_no: '', name: '', gender: 'Male', dob: '', class_id: '', guardian: '', guardian_phone: '', address: '', email: '', admission_date: '', status: 'active' };

export default function Students() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const { data: students, loading, reload } = useFetch(`/students?q=${encodeURIComponent(q)}&class_id=${classFilter}`);
  const { data: classes } = useFetch('/classes');

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  function openAdd() { setEditing(null); setForm({ ...empty }); setModal(true); }
  function openEdit(s) { setEditing(s); setForm({ ...empty, ...s }); setModal(true); }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await http.put('/students/' + editing.id, { ...form, class_id: form.class_id ? Number(form.class_id) : null });
        toast.success('Student updated successfully');
      } else {
        await http.post('/students', { ...form, class_id: form.class_id ? Number(form.class_id) : null });
        toast.success('Student added successfully');
      }
      setModal(false);
      reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }

  async function doDelete() {
    try { await http.del('/students/' + confirm.id); toast.success('Student deleted'); reload(); setConfirm(null); }
    catch (err) { toast.error(err.message); }
  }

  return (
    <div className="fade-in-up">
      <PageHeader title="Students" subtitle={`${students?.length || 0} records found`}
        actions={<button className="btn-primary" onClick={openAdd}>+ Add Student</button>} />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input className="input sm:col-span-2" placeholder="Search by name, roll # or guardian…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All classes</option>
            {(classes || []).map((c) => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
          </select>
        </div>
      </div>

      {loading ? <PageLoader label="Loading students…" /> : (
        !students || students.length === 0 ? <div className="card"><EmptyState title="No students found" message={q ? 'Try adjusting your search or filters.' : 'Add your first student to get started.'} action={<button className="btn-primary" onClick={openAdd}>+ Add Student</button>} /></div>
        : <div className="card overflow-hidden">
          <div className="table-responsive">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="th">Roll No</th>
                  <th className="th">Name</th>
                  <th className="th">Class</th>
                  <th className="th">Guardian</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-ink-50/70 transition">
                    <td className="td font-mono text-ink-500">{s.roll_no}</td>
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">{initials(s.name)}</div>
                        <div>
                          <p className="font-semibold text-ink-800">{s.name}</p>
                          <p className="text-xs text-ink-400">{s.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td"><span className="badge bg-brand-50 text-brand-700">{s.class_name} - {s.section}</span></td>
                    <td className="td text-ink-500">{s.guardian || '—'}</td>
                    <td className="td"><Badge tone={s.status === 'active' ? 'success' : 'neutral'}>{s.status}</Badge></td>
                    <td className="td text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500 hover:text-brand-600" title="Edit" onClick={() => openEdit(s)}>
                          <Pencil />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-50 text-ink-500 hover:text-red-600" title="Delete" onClick={() => setConfirm(s)}>
                          <Trash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Student' : 'Add Student'} size="lg" footer={
        <>
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add student'}</button>
        </>
      }>
        <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" required><input className="input" value={form.name} onChange={set('name')} placeholder="Student full name" required /></Field>
          <Field label="Roll number" required><input className="input" value={form.roll_no} onChange={set('roll_no')} placeholder="e.g. 0001" required /></Field>
          <Field label="Class">
            <select className="input" value={form.class_id} onChange={set('class_id')}>
              <option value="">Select class</option>
              {(classes || []).map((c) => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
            </select>
          </Field>
          <Field label="Gender">
            <select className="input" value={form.gender} onChange={set('gender')}>
              <option>Male</option><option>Female</option>
            </select>
          </Field>
          <Field label="Date of birth"><input className="input" type="date" value={form.dob} onChange={set('dob')} /></Field>
          <Field label="Admission date"><input className="input" type="date" value={form.admission_date} onChange={set('admission_date')} /></Field>
          <Field label="Guardian name"><input className="input" value={form.guardian} onChange={set('guardian')} /></Field>
          <Field label="Guardian phone"><input className="input" value={form.guardian_phone} onChange={set('guardian_phone')} /></Field>
          <Field label="Email"><input className="input" type="email" value={form.email} onChange={set('email')} /></Field>
          <Field label="Status">
            <select className="input" value={form.status} onChange={set('status')}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address"><textarea className="input" value={form.address} onChange={set('address')} rows="2" /></Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete}
        title="Delete student" message={`Are you sure you want to delete ${confirm?.name}? This cannot be undone.`} />
    </div>
  );
}

function Field({ label, children, required }) {
  return <div><label className="label">{label}{required && <span className="text-red-500"> *</span>}</label>{children}</div>;
}

function initials(name) { return name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?'; }

function Pencil() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>; }
function Trash() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>; }
