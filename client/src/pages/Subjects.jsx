import { useState } from 'react';
import { http } from '../api/client';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { PageLoader } from '../components/Spinner';
import { useFetch } from '../utils/useFetch';

const empty = { name: '', code: '' };

export default function Subjects() {
  const toast = useToast();
  const { data: subjects, loading, reload } = useFetch('/subjects');
  const { data: classes } = useFetch('/classes');
  const [modal, setModal] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...empty });
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function openAdd() { setEditing(null); setForm({ ...empty }); setModal(true); }
  function openEdit(s) { setEditing(s); setForm({ name: s.name, code: s.code || '' }); setModal(true); }

  async function openAssign(s) {
    setAssignModal(s);
    try { const cs = await http.get(`/subjects/${s.id}/classes`); setSelected(cs.map((c) => c.id)); } catch { setSelected([]); }
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await http.put('/subjects/' + editing.id, form); toast.success('Subject updated'); }
      else { await http.post('/subjects', form); toast.success('Subject added'); }
      setModal(false); reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }

  async function doDelete() {
    try { await http.del('/subjects/' + confirm.id); toast.success('Subject deleted'); reload(); setConfirm(null); }
    catch (err) { toast.error(err.message); }
  }

  async function saveAssign() {
    setSaving(true);
    try { await http.post(`/subjects/${assignModal.id}/assign`, { class_ids: selected }); toast.success('Classes updated for subject'); setAssignModal(null); reload(); }
    catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }

  function toggleClass(id) {
    setSelected((sel) => sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  }

  return (
    <div className="fade-in-up">
      <PageHeader title="Subjects" subtitle={`${subjects?.length || 0} subjects offered`}
        actions={<button className="btn-primary" onClick={openAdd}>+ Add Subject</button>} />

      {loading ? <PageLoader /> : !subjects || subjects.length === 0 ? <div className="card"><EmptyState title="No subjects" message="Add subjects to the curriculum." /></div> :
      <div className="card overflow-hidden">
        <div className="table-responsive">
          <table className="min-w-full">
            <thead><tr><th className="th">Subject</th><th className="th">Code</th><th className="th text-right">Actions</th></tr></thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id} className="hover:bg-ink-50/70">
                  <td className="td"><p className="font-semibold text-ink-800">{s.name}</p></td>
                  <td className="td"><span className="badge bg-ink-100 text-ink-600 font-mono">{s.code || '—'}</span></td>
                  <td className="td text-right">
                    <div className="flex justify-end gap-1">
                      <button className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 text-xs font-semibold" onClick={() => openAssign(s)}>Assign classes</button>
                      <button className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500" onClick={() => openEdit(s)}><Pencil /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-ink-500 hover:text-red-600" onClick={() => setConfirm(s)}><Trash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Subject' : 'Add Subject'} size="sm" footer={
        <>
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save' : 'Add'} </button>
        </>
      }>
        <form onSubmit={save} className="space-y-4">
          <div><label className="label">Subject name</label><input className="input" value={form.name} onChange={set('name')} required /></div>
          <div><label className="label">Code</label><input className="input" value={form.code} onChange={set('code')} placeholder="e.g. MATH" /></div>
        </form>
      </Modal>

      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title={`Assign classes — ${assignModal?.name || ''}`} size="lg" footer={
        <>
          <button className="btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button>
          <button className="btn-primary" onClick={saveAssign} disabled={saving}>{saving ? 'Saving…' : 'Save assignment'}</button>
        </>
      }>
        <p className="text-sm text-ink-500 mb-3">Select the classes where this subject is taught:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {(classes || []).map((c) => (
            <button key={c.id} type="button" onClick={() => toggleClass(c.id)}
              className={`p-3 rounded-md border text-left text-sm font-semibold transition-colors ${selected.includes(c.id) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-ink-700 border-ink-200 hover:border-brand-300'}`}>
              Class {c.name} <span className={selected.includes(c.id) ? 'text-brand-200' : 'text-brand-600'}>{c.section}</span>
            </button>
          ))}
        </div>
        <div className="mt-4"><span className="badge bg-brand-50 text-brand-700">{selected.length} class(es) selected</span></div>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete}
        title="Delete subject" message={`Delete subject ${confirm?.name}?`} />
    </div>
  );
}

function Pencil() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>; }
function Trash() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>; }
