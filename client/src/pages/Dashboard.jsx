import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { http } from '../api/client';
import StatCard from '../components/StatCard';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import { PageLoader } from '../components/Spinner';
import { useNotifications } from '../context/NotificationContext';

const PIE_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6', '#a855f7', '#22c55e'];

export default function Dashboard() {
  const { isAdmin, user, teacher } = useAuth();
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [pie, setPie] = useState([]);
  const [attTrend, setAttTrend] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const s = await http.get('/dashboard/stats');
        setStats(s);
      } catch {}
      if (isAdmin) {
        try {
          setTrend(await http.get('/dashboard/fees-trend'));
          setPie(await http.get('/dashboard/students-per-class'));
          setAttTrend(await http.get('/dashboard/attendance-trend'));
        } catch {}
      }
    })();
  }, [isAdmin]);

  if (!stats) return <PageLoader label="Loading dashboard…" />;

  return isAdmin ? <AdminDash stats={stats} trend={trend} pie={pie} attTrend={attTrend} /> : <TeacherDash stats={stats} teacher={teacher} user={user} />;
}

function AdminDash({ stats, trend, pie, attTrend }) {
  const data = [
    { label: 'Total Students', value: stats.students, icon: 'users', accent: 'brand', sub: 'active enrollments' },
    { label: 'Teachers', value: stats.teachers, icon: 'user', accent: 'purple', sub: 'teaching staff' },
    { label: 'Classes', value: stats.classes, icon: 'building', accent: 'cyan', sub: `across ${stats.subjects} subjects` },
    { label: 'Fees Collected', value: 'Rs ' + fmt(stats.fees), icon: 'wallet', accent: 'emerald', sub: `Rs ${fmt(stats.feesMonth)} this month` },
  ];
  const attPct = stats.attendanceToday?.total ? Math.round((stats.attendanceToday.present / stats.attendanceToday.total) * 100) : 0;

  return (
    <div className="space-y-6 fade-in-up">
      <PageHeader title="Administrator Dashboard" subtitle="Overview of your school's performance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {data.map((d) => <StatCard key={d.label} {...d} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Fees trend */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold text-ink-900 mb-1">Fee Collection Trend</h3>
          <p className="text-xs text-ink-400 mb-4">Monthly payments collected (last 6 months)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} />
                <Tooltip formatter={(v) => ['Rs ' + fmt(v), 'Collected']} />
                <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance today */}
        <div className="card p-5">
          <h3 className="font-bold text-ink-900 mb-1">Today's Attendance</h3>
          <p className="text-xs text-ink-400 mb-4">Whole school summary</p>
          <div className="flex items-center justify-center">
            <Ring pct={attPct} label="Present" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="bg-emerald-50 rounded-lg py-2.5">
              <p className="text-xl font-extrabold text-emerald-600">{stats.attendanceToday?.present || 0}</p>
              <p className="text-[11px] font-semibold text-emerald-700">Present</p>
            </div>
            <div className="bg-red-50 rounded-lg py-2.5">
              <p className="text-xl font-extrabold text-red-600">{stats.attendanceToday?.absent || 0}</p>
              <p className="text-[11px] font-semibold text-red-700">Absent</p>
            </div>
          </div>
          <Link to="/attendance" className="btn-secondary w-full mt-4 justify-center text-xs">View attendance</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Students per class */}
        <div className="card p-5">
          <h3 className="font-bold text-ink-900 mb-1">Students per Class</h3>
          <p className="text-xs text-ink-400 mb-2">Distribution across classes</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                  {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance trend */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold text-ink-900 mb-1">Attendance Trend</h3>
          <p className="text-xs text-ink-400 mb-4">Daily attendance percentage (last 10 days)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => v + '%'} />
                <Tooltip formatter={(v) => [v + '%', 'Attendance']} />
                <Line type="monotone" dataKey="pct" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeacherDash({ stats, teacher, user }) {
  return (
    <div className="space-y-6 fade-in-up">
      <PageHeader title={`Welcome, ${user?.name?.split(' ')[0]} 👋`} subtitle="Here's what's happening with your classes" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="My Classes" value={stats.myClasses} icon="building" accent="brand" sub="assigned to you" />
        <StatCard label="My Students" value={stats.myStudents} icon="users" accent="purple" sub="across your classes" />
        <StatCard label="Exams Managed" value={stats.exams} icon="chart" accent="cyan" sub="mid-term" />
        <StatCard label="Unread Alerts" value={stats.unread} icon="bell" accent="amber" sub="notifications" />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-ink-900">Quick Actions</h3>
            <p className="text-xs text-ink-400">Frequently used tools</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction to="/attendance" icon="checkList" title="Mark Attendance" desc="Daily register" />
          <QuickAction to="/marks" icon="chart" title="Enter Marks" desc="Update grades" />
          <QuickAction to="/announcements" icon="megaphone" title="Announcements" desc="View notices" />
          <QuickAction to="/profile" icon="user" title="My Profile" desc="Account details" />
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-ink-900 mb-3">Today's Attendance — My Classes</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-emerald-50 rounded-xl py-4">
            <p className="text-2xl font-extrabold text-emerald-600">{stats.todayAtt?.present || 0}</p>
            <p className="text-xs font-semibold text-emerald-700 mt-0.5">Present</p>
          </div>
          <div className="bg-ink-50 rounded-xl py-4">
            <p className="text-2xl font-extrabold text-ink-600">{stats.todayAtt?.total || 0}</p>
            <p className="text-xs font-semibold text-ink-500 mt-0.5">Total</p>
          </div>
          <div className="bg-purple-50 rounded-xl py-4">
            <p className="text-2xl font-extrabold text-purple-600">{stats.todayAtt?.total ? Math.round((stats.todayAtt.present / stats.todayAtt.total) * 100) : 0}%</p>
            <p className="text-xs font-semibold text-purple-700 mt-0.5">Rate</p>
          </div>
        </div>
        <Link to="/attendance" className="btn-primary w-full mt-4 justify-center">Open attendance</Link>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, title, desc }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-lg glass-flat bg-white/55 p-3.5 transition-colors hover:bg-white/75">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-ink-100 text-ink-500 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-[13px] text-ink-900">{title}</p>
        <p className="text-[11px] text-ink-400">{desc}</p>
      </div>
    </Link>
  );
}

function Ring({ pct, label }) {
  const r = 60;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 150 150" className="h-full w-full -rotate-90">
        <circle cx="75" cy="75" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle cx="75" cy="75" r={r} fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-extrabold text-ink-900">{pct}%</p>
        <p className="text-xs font-semibold text-ink-400">{label}</p>
      </div>
    </div>
  );
}

function fmt(n) {
  return Number(n || 0).toLocaleString();
}
