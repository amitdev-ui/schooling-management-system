import { useState } from 'react';
import { http } from '../api/client';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import { PageLoader } from '../components/Spinner';
import { useFetch } from '../utils/useFetch';
import { useAuth } from '../context/AuthContext';

export default function Fees() {
  const [tab, setTab] = useState('payments');

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'payments', label: 'Payments' },
    { id: 'dues', label: 'Dues / Ledger' },
    { id: 'structure', label: 'Fee Structure' },
  ];

  return (
    <div className="fade-in-up">
      <PageHeader title="Fees Management" subtitle="Track collections, dues and fee structure" />

      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${tab === t.id ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'summary' && <FeesSummary />}
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'dues' && <DuesTab />}
      {tab === 'structure' && <StructureTab />}
    </div>
  );
}

function FeesSummary() {
  const { data } = useFetch('/fees/summary');
  const { data: trend } = useFetch('/dashboard/fees-trend');
  if (!data) return <PageLoader />;
  const cards = [
    { label: 'Total Collected', value: 'Rs ' + fmt(data.total), icon: 'wallet', accent: 'emerald' },
    { label: 'This Month', value: 'Rs ' + fmt(data.month), icon: 'calendar', accent: 'brand' },
    { label: 'Collected Today', value: 'Rs ' + fmt(data.today), icon: 'checkCircle', accent: 'cyan' },
    { label: 'Students with Dues', value: data.dues, icon: 'warning', accent: 'amber' },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c) => <StatMini key={c.label} {...c} />)}
      </div>
      <div className="card p-5">
        <h3 className="font-bold text-ink-900 mb-1">Outstanding Fees</h3>
        <p className="text-2xl font-extrabold text-red-600 mt-2">Rs {fmt(data.outstanding)}</p>
        <p className="text-xs text-ink-400 mt-1">Total remaining across all active students</p>
      </div>
    </div>
  );
}

function StatMini({ label, value, icon, accent }) {
  const accents = { brand: 'bg-brand-50 text-brand-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600', cyan: 'bg-cyan-50 text-cyan-600' };
  return (
    <div className="stat-card">
      <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</p><p className="mt-1 text-lg sm:text-xl font-extrabold text-ink-900 leading-none truncate">{value}</p></div>
      <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-md ${accents[accent]}`}>
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
    </div>
  );
}

function PaymentsTab() {
  const toast = useToast();
  const { data: payments, loading, reload } = useFetch('/fees/payments');
  const { data: students } = useFetch('/students');
  const { data: structure } = useFetch('/fees/structure');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ student_id: '', fee_structure_id: '', amount: '', method: 'cash', note: '', date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function pickStudent(id) {
    const fee = (structure || []).find((s) => s.class_id === (students || []).find((x) => x.id === Number(id))?.class_id);
    setForm((f) => ({ ...f, student_id: id, amount: fee ? fee.amount : '', fee_structure_id: fee ? fee.id : '' }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const rec = await http.post('/fees/payments', { ...form, student_id: Number(form.student_id), fee_structure_id: form.fee_structure_id ? Number(form.fee_structure_id) : null, amount: Number(form.amount) });
      setModal(false);
      reload();
      toast.success('Payment recorded');
      setReceipt(rec);
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }

  async function doDelete() {
    try { await http.del('/fees/payments/' + confirm.id); toast.success('Payment deleted'); reload(); setConfirm(null); } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="fade-in-up">
      <div className="flex justify-end mb-4"><button className="btn-primary" onClick={() => { setForm({ student_id: '', fee_structure_id: '', amount: '', method: 'cash', note: '', date: new Date().toISOString().slice(0, 10) }); setModal(true); }}>+ Record Payment</button></div>

      {loading ? <PageLoader /> : !payments || payments.length === 0 ? <div className="card"><EmptyState title="No payments yet" message="Record your first fee payment." /></div> :
      <div className="card overflow-hidden">
        <div className="table-responsive">
          <table className="min-w-full">
            <thead><tr><th className="th">Receipt #</th><th className="th">Student</th><th className="th">Fee Type</th><th className="th">Amount</th><th className="th">Method</th><th className="th">Date</th><th className="th text-right">Actions</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-ink-50/70">
                  <td className="td font-mono">INV-{String(p.id).padStart(4, '0')}</td>
                  <td className="td"><p className="font-semibold text-ink-800">{p.student_name}</p><p className="text-xs text-ink-400">Class {p.class_name} - {p.section}</p></td>
                  <td className="td text-ink-500">{p.fee_name || '—'}</td>
                  <td className="td font-bold text-emerald-600">Rs {fmt(p.amount)}</td>
                  <td className="td"><Badge tone={p.method === 'cash' ? 'neutral' : 'info'}>{p.method}</Badge></td>
                  <td className="td text-ink-500">{p.date}</td>
                  <td className="td text-right">
                    <div className="flex justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500" title="Receipt" onClick={() => setReceipt(p)}><ReceiptIcon /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-ink-500 hover:text-red-600" onClick={() => setConfirm(p)}><Trash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}

      <Modal open={modal} onClose={() => setModal(false)} title="Record Payment" size="md" footer={
        <>
          <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Record payment'}</button>
        </>
      }>
        <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Student</label>
            <select className="input" value={form.student_id} onChange={(e) => pickStudent(e.target.value)} required>
              <option value="">Select student</option>
              {(students || []).map((s) => <option key={s.id} value={s.id}>{s.name} (Class {s.class_name})</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><label className="label">Fee type</label>
            <select className="input" value={form.fee_structure_id} onChange={set('fee_structure_id')}>
              <option value="">General / custom</option>
              {(structure || []).map((s) => <option key={s.id} value={s.id}>{s.name} — Rs {fmt(s.amount)} (Class {s.class_name} {s.section})</option>)}
            </select>
          </div>
          <div><label className="label">Amount *</label><input className="input" type="number" value={form.amount} onChange={set('amount')} required /></div>
          <div><label className="label">Method</label>
            <select className="input" value={form.method} onChange={set('method')}><option>cash</option><option>bank</option><option>online</option></select>
          </div>
          <div><label className="label">Date</label><input className="input" type="date" value={form.date} onChange={set('date')} /></div>
          <div><label className="label">Note</label><input className="input" value={form.note} onChange={set('note')} /></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete} title="Delete payment" message="Remove this payment record?" />

      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Payment Receipt" size="sm">
        {receipt && <ReceiptView r={receipt} />}
      </Modal>
    </div>
  );
}

function ReceiptView({ r }) {
  const { user } = useAuth();
  return (
    <div className="print-area">
      <div className="text-center mb-4">
        <p className="text-2xl font-extrabold text-brand-700">EduCore School</p>
        <p className="text-xs text-ink-400">123 Education Lane, Lahore · +92 300 0000000</p>
      </div>
      <div className="border-t-2 border-dashed border-ink-200 pt-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-ink-500">Receipt No</span><span className="font-bold font-mono">INV-{String(r.id).padStart(4, '0')}</span></div>
        <div className="flex justify-between"><span className="text-ink-500">Date</span><span className="font-semibold">{r.date}</span></div>
        <div className="flex justify-between"><span className="text-ink-500">Student</span><span className="font-semibold">{r.student_name}</span></div>
        <div className="flex justify-between"><span className="text-ink-500">Roll No</span><span className="font-mono">{r.roll_no}</span></div>
        <div className="flex justify-between"><span className="text-ink-500">Fee type</span><span className="font-semibold">{r.fee_name || 'General'}</span></div>
        <div className="flex justify-between"><span className="text-ink-500">Method</span><span className="font-semibold capitalize">{r.method}</span></div>
        <div className="flex justify-between items-baseline bg-emerald-50 -mx-4 px-4 py-3 rounded-lg mt-1"><span className="font-semibold text-emerald-700">Amount Paid</span><span className="text-xl font-extrabold text-emerald-600">Rs {fmt(r.amount)}</span></div>
        <div className="flex justify-between"><span className="text-ink-500">Collected by</span><span className="font-semibold">{user?.name}</span></div>
        <div className="pt-3 text-center text-ink-400 text-xs">Thank you for your payment!</div>
      </div>
    </div>
  );
}

function DuesTab() {
  const { data: dues, loading } = useFetch('/fees/dues');
  const [classFilter, setClassFilter] = useState('');
  const { data: classes } = useFetch('/classes');
  const processed = (dues || []).filter((d) => !classFilter || d.class_id === Number(classFilter));
  return (
    <div className="fade-in-up">
      <div className="card p-4 mb-4">
        <select className="input max-w-xs" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All classes</option>
          {(classes || []).map((c) => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
        </select>
      </div>
      {loading ? <PageLoader /> : <div className="card overflow-hidden">
        <div className="table-responsive">
          <table className="min-w-full">
            <thead><tr><th className="th">Student</th><th className="th">Class</th><th className="th">Expected</th><th className="th">Paid</th><th className="th">Due</th><th className="th">Status</th></tr></thead>
            <tbody>
              {processed.map((d) => (
                <tr key={d.student_id} className="hover:bg-ink-50/70">
                  <td className="td"><p className="font-semibold text-ink-800">{d.student_name}</p><p className="text-xs text-ink-400 font-mono">Roll {d.roll_no}</p></td>
                  <td className="td text-ink-500">Class {d.class_name} - {d.section}</td>
                  <td className="td">Rs {fmt(d.expected)}</td>
                  <td className="td text-emerald-600 font-semibold">Rs {fmt(d.paid)}</td>
                  <td className="td font-bold text-red-600">Rs {fmt(d.due)}</td>
                  <td className="td">{d.due > 0 ? <Badge tone="danger">Outstanding</Badge> : <Badge tone="success">Cleared</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {processed.length === 0 && <EmptyState title="No records" message="No students match the filter." />}
      </div>}
    </div>
  );
}

function StructureTab() {
  const toast = useToast();
  const { data: structure, loading, reload } = useFetch('/fees/structure');
  const { data: classes } = useFetch('/classes');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ class_id: '', name: '', amount: '' });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { class_id: Number(form.class_id), name: form.name, amount: Number(form.amount) };
      if (editing) { await http.put('/fees/structure/' + editing.id, body); toast.success('Fee updated'); }
      else { await http.post('/fees/structure', body); toast.success('Fee added'); }
      setModal(false); reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  }
  async function doDelete() {
    try { await http.del('/fees/structure/' + confirm.id); toast.success('Deleted'); reload(); setConfirm(null); } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="fade-in-up">
      <div className="flex justify-end mb-4"><button className="btn-primary" onClick={() => { setEditing(null); setForm({ class_id: '', name: '', amount: '' }); setModal(true); }}>+ Add Fee Type</button></div>
      {loading ? <PageLoader /> : <div className="card overflow-hidden">
        <div className="table-responsive">
          <table className="min-w-full">
            <thead><tr><th className="th">Fee Name</th><th className="th">Class</th><th className="th">Amount</th><th className="th text-right">Actions</th></tr></thead>
            <tbody>
              {(structure || []).map((s) => (
                <tr key={s.id} className="hover:bg-ink-50/70">
                  <td className="td font-semibold text-ink-800">{s.name}</td>
                  <td className="td text-ink-500">Class {s.class_name} - {s.section}</td>
                  <td className="td font-bold">Rs {fmt(s.amount)}</td>
                  <td className="td text-right">
                    <div className="flex justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500" onClick={() => { setEditing(s); setForm({ class_id: s.class_id, name: s.name, amount: s.amount }); setModal(true); }}><Pencil /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-ink-500 hover:text-red-600" onClick={() => setConfirm(s)}><Trash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(structure || []).length === 0 && <EmptyState title="No fee structure" message="Define fee types for each class." />}
      </div>}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Fee' : 'Add Fee Type'} size="sm" footer={
        <><button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>
      }>
        <form onSubmit={save} className="space-y-4">
          <div><label className="label">Class</label><select className="input" value={form.class_id} onChange={set('class_id')} required><option value="">Select</option>{(classes || []).map((c) => <option key={c.id} value={c.id}>Class {c.name} - {c.section}</option>)}</select></div>
          <div><label className="label">Fee name</label><input className="input" value={form.name} onChange={set('name')} required placeholder="Tuition / Transport" /></div>
          <div><label className="label">Amount</label><input className="input" type="number" value={form.amount} onChange={set('amount')} required /></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete} title="Delete fee" message="Remove this fee type?" />
    </div>
  );
}

function ReceiptIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3-2 2 2 2-2 2 2 2-2 3 2z"/></svg>; }
function Pencil() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>; }
function Trash() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>; }
function fmt(n) { return Number(n || 0).toLocaleString(); }
