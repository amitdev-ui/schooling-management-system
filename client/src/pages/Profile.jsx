import { useState } from 'react';
import { http } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

export default function Profile() {
  const { user, teacher, isAdmin } = useAuth();
  const toast = useToast();
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function changePassword(e) {
    e.preventDefault();
    if (pw.next !== pw.confirm) return toast.error('New passwords do not match');
    setSaving(true);
    try {
      await http.post('/auth/change-password', { current: pw.current, next: pw.next });
      toast.success('Password changed successfully');
      setPw({ current: '', next: '', confirm: '' });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }

  const info = [
    ['Full name', user?.name],
    ['Email', user?.email],
    ['Role', isAdmin ? 'Administrator' : 'Teacher'],
    ...(teacher ? [
      ['Subject', teacher.subject_name || '—'],
      ['Phone', teacher.phone || '—'],
      ['Qualification', teacher.qualification || '—'],
      ['Joined', teacher.joined_at || '—'],
    ] : teacher ? [] : []),
  ];

  return (
    <div className="max-w-2xl fade-in-up">
      <PageHeader title="My Profile" subtitle="Your account details" />

      <div className="card p-6">
        <div className="flex items-center gap-4 pb-5 border-b border-ink-100">
          <div className="h-16 w-16 rounded-full bg-brand-600 text-white flex items-center justify-center text-2xl font-bold">
            {user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-ink-900">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge tone={isAdmin ? 'info' : 'success'}>{isAdmin ? 'Administrator' : 'Teacher'}</Badge>
              {teacher?.subject_name && <Badge tone="neutral">{teacher.subject_name}</Badge>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 py-5">
          {info.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
              <p className="text-sm font-medium text-ink-800 mt-0.5">{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6 mt-5">
        <h3 className="font-bold text-ink-900 mb-1">Change Password</h3>
        <p className="text-xs text-ink-400 mb-4">Update your account password</p>
        <form onSubmit={changePassword} className="space-y-4 max-w-md">
          <div><label className="label">Current password</label><input className="input" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></div>
          <div><label className="label">New password</label><input className="input" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required minLength={4} /></div>
          <div><label className="label">Confirm new password</label><input className="input" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required /></div>
          <div className="flex items-center gap-3">
            <button className="btn-primary" disabled={saving}>{saving ? 'Updating…' : 'Update password'}</button>
            {saved && <span className="text-sm font-semibold text-emerald-600">✓ Password saved</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
