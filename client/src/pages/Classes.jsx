import { useState } from 'react';
import { http } from '../api/client';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { PageLoader } from '../components/Spinner';
import { useFetch } from '../utils/useFetch';

const empty = { name: '', section: 'A', class_teacher_id: '' };

export default function Classes() {
  const toast = useToast();
  const { data: classes, loading, reload } = useFetch('/classes');
  const { data: teachers } = useFetch('/teachers');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function openAdd() { setEditing(null); setForm({ ...empty }); setModal(true); }
  function openEdit(c) { setEditing(c); setForm({ name: c.name, section: c.section, class_teacher_id: c.class_teacher_id || '' }); setModal(true); }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, class_teacher_id: form.class_teacher_id ? Number(form.class_teacher_id) : null };
      if (editing) { await http.put('/classes/' + editing.id, body); toast.success('Class updated'); }
      else { await http.post('/classes', body); toast.success('Class added'); }
      setModal(false); reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }

  async function doDelete() {
    try { await http.del('/classes/' + confirm.id); toast.success('Class deleted'); reload(); setConfirm(null); }
    catch (err) { toast.error(err.message); }
  }

  return (
    <div className="fade-in-up">
      <PageHeader title="Classes & Sections" subtitle="Manage academic structure"
        actions={<button className="btn-primary" onClick={openAdd}>+ Add Class</button>} />

      {loading ? <PageLoader /> : !classes || classes.length === 0 ? <div className="card"><EmptyState title="No classes yet" message="Add classes and sections to begin." /></div> :
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-extrabold text-ink-900">Class {c.name}<span className="text-brand-600"> {c.section}</span></p>
                <p className="text-xs text-ink-400 mt-0.5">Class teacher: {c.class_teacher_name || 'Not assigned'}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500"><Pencil /></button>
                <button onClick={() => setConfirm(c)} className="p-2 rounded-lg hover:bg-red-50 text-ink-500 hover:text-red-600"><Trash /></button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-ink-100 flex items-center justify-between">
              <span className="badge bg-emerald-50 text-emerald-700">{c.student_count} students</span>
              <span className="badge bg-ink-100 text-ink-600">ID: {c.id}</span>
            </div>
          </div>
        ))}
      </div>}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Class' : 'Add Class'} size="sm" footer={
        <>
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add class'}</button>
        </>
      }>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Class name</label>
            <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. 5" required />
          </div>
          <div>
            <label className="label">Section</label>
            <select className="input" value={form.section} onChange={set('section')}>
              {['A', 'B', 'C', 'D'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Class teacher</label>
            <select className="input" value={form.class_teacher_id} onChange={set('class_teacher_id')}>
              <option value="">Not assigned</option>
              {(teachers || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete}
        title="Delete class" message={`Delete class ${confirm?.name} - ${confirm?.section}?`} />
    </div>
  );
}

function Pencil() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>; }
function Trash() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>; }
