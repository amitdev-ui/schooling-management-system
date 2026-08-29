import { useState } from 'react';
import { http } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import { PageLoader } from '../components/Spinner';
import { useFetch } from '../utils/useFetch';

export default function Announcements() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const { data: items, loading, reload } = useFetch('/announcements');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all' });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await http.post('/announcements', form);
      toast.success('Announcement published');
      setModal(false); setForm({ title: '', body: '', audience: 'all' }); reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }

  async function doDelete() {
    try { await http.del('/announcements/' + confirm.id); toast.success('Announcement deleted'); reload(); setConfirm(null); } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="fade-in-up">
      <PageHeader title="Announcements" subtitle="School notices and updates"
        actions={isAdmin && <button className="btn-primary" onClick={() => setModal(true)}>+ New Announcement</button>} />

      {loading ? <PageLoader /> : !items || items.length === 0 ? <div className="card"><EmptyState title="No announcements" message={isAdmin ? 'Publish your first announcement.' : 'No notices from the admin yet.'} /></div> :
      <div className="space-y-4">
        {items.map((a) => (
          <div key={a.id} className="card p-5 fade-in-up">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-md bg-brand-50 text-brand-600">
                  <Icon name="megaphone" className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h3 className="font-bold text-ink-900">{a.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-ink-400">
                    <span className="font-medium">By {a.author}</span>
                    <span>·</span>
                    <span>{fmtDate(a.created_at)}</span>
                    <BadgeMini audience={a.audience} />
                  </div>
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => setConfirm(a)} className="p-2 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-600"><Trash /></button>
              )}
            </div>
            {a.body && <p className="mt-3 text-sm text-ink-600 leading-relaxed">{a.body}</p>}
          </div>
        ))}
      </div>}

      <Modal open={modal} onClose={() => setModal(false)} title="New Announcement" size="md" footer={
        <>
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Publishing…' : 'Publish'}</button>
        </>
      }>
        <form onSubmit={save} className="space-y-4">
          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={set('title')} required placeholder="Announcement title" /></div>
          <div><label className="label">Audience</label>
            <select className="input" value={form.audience} onChange={set('audience')}>
              <option value="all">All</option>
              <option value="teachers">Teachers only</option>
              <option value="students">Students</option>
            </select>
          </div>
          <div><label className="label">Message</label><textarea className="input" rows="4" value={form.body} onChange={set('body')} placeholder="Write the announcement…" /></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete} title="Delete announcement" message="Remove this announcement? Notifications stay in history." />
    </div>
  );
}

function BadgeMini({ audience }) {
  return <span className="badge bg-purple-50 text-purple-700 capitalize">{audience}</span>;
}
function fmtDate(s) { try { return new Date(s.replace(' ', 'T') + 'Z').toLocaleString(); } catch { return s; } }
function Trash() { return <Icon name="trash" className="h-4 w-4" />; }
