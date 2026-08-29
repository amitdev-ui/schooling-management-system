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

const empty = { name: '', email: '', phone: '', subject_id: '', qualification: '', joined_at: '' };

export default function Teachers() {
  const toast = useToast();
  const { data: teachers, loading, reload } = useFetch('/teachers');
  const { data: subjects } = useFetch('/subjects');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function openAdd() { setEditing(null); setForm({ ...empty }); setModal(true); }
  function openEdit(t) { setEditing(t); setForm({ name: t.name, email: t.email || '', phone: t.phone || '', subject_id: t.subject_id || '', qualification: t.qualification || '', joined_at: t.joined_at || '' }); setModal(true); }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, subject_id: form.subject_id ? Number(form.subject_id) : null };
      if (editing) { await http.put('/teachers/' + editing.id, body); toast.success('Teacher updated'); }
      else { await http.post('/teachers', body); toast.success('Teacher added'); }
      setModal(false); reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }

  async function doDelete() {
    try { await http.del('/teachers/' + confirm.id); toast.success('Teacher deleted'); reload(); setConfirm(null); }
    catch (err) { toast.error(err.message); }
  }

  return (
    <div className="fade-in-up">
      <PageHeader title="Teachers" subtitle={`${teachers?.length || 0} staff members`}
        actions={<button className="btn-primary" onClick={openAdd}>+ Add Teacher</button>} />

      {loading ? <PageLoader /> : !teachers || teachers.length === 0 ? <div className="card"><EmptyState title="No teachers" message="Add your teaching staff." /></div> :
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map((t) => (
          <div key={t.id} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base">{initials(t.name)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink-900 truncate">{t.name}</p>
                <p className="text-xs text-ink-400 truncate">{t.email || 'No email'}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500"><Pencil /></button>
                <button onClick={() => setConfirm(t)} className="p-1.5 rounded-lg hover:bg-red-50 text-ink-500 hover:text-red-600"><Trash /></button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-ink-100 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-ink-500">Subject</span><span className="font-semibold text-ink-800">{t.subject_name || 'Not set'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-ink-500">Qualification</span><span className="font-semibold text-ink-800">{t.qualification || '—'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-ink-500">Phone</span><span className="font-mono text-ink-800">{t.phone || '—'}</span></div>
              {t.class_teacher_for > 0 && <div><Badge tone="brand">Class teacher of {t.class_teacher_for} class(es)</Badge></div>}
            </div>
          </div>
        ))}
      </div>}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Teacher' : 'Add Teacher'} size="md" footer={
        <>
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save' : 'Add'}</button>
        </>
      }>
        <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Full name *</label><input className="input" value={form.name} onChange={set('name')} required /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
          <div><label className="label">Subject</label>
            <select className="input" value={form.subject_id} onChange={set('subject_id')}>
              <option value="">Select subject</option>
              {(subjects || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="label">Qualification</label><input className="input" value={form.qualification} onChange={set('qualification')} placeholder="e.g. Masters / B.Ed" /></div>
          <div><label className="label">Joined date</label><input className="input" type="date" value={form.joined_at} onChange={set('joined_at')} /></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete}
        title="Delete teacher" message={`Remove ${confirm?.name} from the school?`} />
    </div>
  );
}

function initials(name) { return name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?'; }
function Pencil() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>; }
function Trash() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>; }
