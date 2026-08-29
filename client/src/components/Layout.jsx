import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationBell from './NotificationBell';

const adminNav = [
  { to: '/dashboard', label: 'Dashboard', sub: 'Overview', icon: I('grid') },
  { to: '/students', label: 'Students', sub: 'Enrollments', icon: I('users') },
  { to: '/classes', label: 'Classes', sub: 'Sections', icon: I('building') },
  { to: '/subjects', label: 'Subjects', sub: 'Curriculum', icon: I('book') },
  { to: '/teachers', label: 'Teachers', sub: 'Staff', icon: I('user') },
  { to: '/fees', label: 'Fees', sub: 'Finance', icon: I('wallet') },
  { to: '/attendance', label: 'Attendance', sub: 'Register', icon: I('check') },
  { to: '/marks', label: 'Marks', sub: 'Exams', icon: I('chart') },
  { to: '/announcements', label: 'Announcements', sub: 'Notices', icon: I('megaphone') },
];

const teacherNav = [
  { to: '/dashboard', label: 'Dashboard', sub: 'Overview', icon: I('grid') },
  { to: '/attendance', label: 'Attendance', sub: 'Register', icon: I('check') },
  { to: '/marks', label: 'Marks', sub: 'Exams', icon: I('chart') },
  { to: '/announcements', label: 'Announcements', sub: 'Notices', icon: I('megaphone') },
];

function I(name) {
  const paths = {
    grid: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    book: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    wallet: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
    check: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    megaphone: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15H18.5c1.934 0 3.5-1.57 3.5-3.5 0-1.93-1.566-3.5-3.5-3.5H11z",
    bell: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
    logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    graduation: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0"><path d={paths[name]} /></svg>;
}

export default function Layout() {
  const { user, teacher, isAdmin, logout } = useAuth();
  const { unread } = useNotifications();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const nav = isAdmin ? adminNav : teacherNav;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ===== MOBILE TOP BAR ===== */}
      <header className="lg:hidden sticky top-0 z-40 glass-bar flex items-center justify-between px-4 h-13" style={{ height: '52px' }}>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg glass-flat text-ink-600 hover:bg-white/80 transition-colors shadow-none"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <div className="flex items-center gap-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">{I('graduation')}</span>
            <span className="font-extrabold tracking-tight text-ink-900" style={{ fontSize: '15px' }}>EduCore</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell compact />
        </div>
      </header>

      {/* ===== MOBILE DRAWER ===== */}
      {drawerOpen && (
        <MobileDrawer nav={nav} isAdmin={isAdmin} user={user} unread={unread}
          onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />
      )}

      {/* ===== DESKTOP SIDEBAR (light glass) ===== */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col glass sticky top-0 h-screen border-r-0 p-3">
        <div className="px-2 py-2.5 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">{I('graduation')}</span>
          <div>
            <p className="font-extrabold text-ink-900 leading-none tracking-tight">EduCore</p>
            <p className="text-[10px] text-ink-400 font-medium mt-0.5 tracking-wide">School Management</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-1 py-2 space-y-0.5 mt-2">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${isActive ? 'glass-flat text-brand-700 shadow-none' : 'text-ink-500 hover:bg-white/50 hover:text-ink-800'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${isActive ? 'bg-brand-600 text-white' : 'bg-white/60 text-ink-400 group-hover:bg-white/80 group-hover:text-ink-600'}`}>{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.to === '/notifications' && unread > 0 && <BadgePill>{unread}</BadgePill>}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="px-1 py-2 border-t border-white/50 space-y-0.5">
          <NavLink to="/notifications" end
            className={({ isActive }) => `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${isActive ? 'glass-flat text-brand-700 shadow-none' : 'text-ink-500 hover:bg-white/50 hover:text-ink-800'}`}>
            {({ isActive }) => (
              <>
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${isActive ? 'bg-brand-600 text-white' : 'bg-white/60 text-ink-400 group-hover:bg-white/80 group-hover:text-ink-600'}`}>{I('bell')}</span>
                <span className="flex-1">Notifications</span>
                {unread > 0 && <BadgePill>{unread}</BadgePill>}
              </>
            )}
          </NavLink>
          <NavLink to="/profile" end
            className={({ isActive }) => `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${isActive ? 'glass-flat text-brand-700 shadow-none' : 'text-ink-500 hover:bg-white/50 hover:text-ink-800'}`}>
            {({ isActive }) => (
              <>
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${isActive ? 'bg-brand-600 text-white' : 'bg-white/60 text-ink-400 group-hover:bg-white/80 group-hover:text-ink-600'}`}>{I('user')}</span>
                <span className="flex-1">My Profile</span>
              </>
            )}
          </NavLink>
          <div className="flex items-center gap-2.5 px-2 pt-3 mt-1">
            <div className="h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">{avatar(user?.name)}</div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[13px] font-semibold text-ink-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-ink-400 uppercase tracking-wide font-semibold">{isAdmin ? 'Admin' : 'Teacher'}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2 py-2 text-[13px] font-semibold text-red-500 hover:bg-red-50 rounded-xl transition">
            {I('logout')} Sign out
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="hidden lg:flex h-14 items-center justify-between px-6 glass-bar sticky top-0 z-30 border-b-0">
          <div className="text-[13px] text-ink-400 font-medium">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="flex items-center gap-2 pl-3 border-l border-ink-100">
              <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">{avatar(user?.name)}</div>
              <div className="leading-tight hidden xl:block">
                <p className="text-[13px] font-semibold text-ink-800">{user?.name}</p>
                <p className="text-[10px] uppercase tracking-wide text-ink-400 font-semibold">{isAdmin ? 'Administrator' : 'Teacher'}</p>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 px-3 sm:px-5 lg:px-6 py-4 lg:py-5 pb-20 lg:pb-5 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <MobileBottomNav nav={nav} unread={unread} />
    </div>
  );
}

function MobileBottomNav({ nav, unread }) {
  const quick = nav.slice(0, 4);
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/70 backdrop-blur-2xl border-t border-white/60 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 gap-1 px-2 pt-2 pb-1">
        {quick.map((item, i) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 rounded-none relative ${isActive ? 'glass-flat bg-white/70 text-brand-700 shadow-none' : 'text-ink-400 hover:bg-white/50 hover:text-ink-600'}`}>
            <span className="text-[19px] leading-none">{item.icon}</span>
            <span className="text-[9px] font-bold tracking-wide">{labelShort(item.label)}</span>
          </NavLink>
        ))}
        <NavLink to="/notifications"
          className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 rounded-none relative ${isActive ? 'glass-flat bg-white/70 text-brand-700 shadow-none' : 'text-ink-400 hover:bg-white/50 hover:text-ink-600'}`}>
          <span className="text-[19px] leading-none relative">
            {I('bell')}
            {unread > 0 && <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white ring-2 ring-white">{unread > 9 ? '9+' : unread}</span>}
          </span>
          <span className="text-[9px] font-bold tracking-wide">Alerts</span>
        </NavLink>
      </div>
    </nav>
  );
}

function MobileDrawer({ nav, isAdmin, user, unread, onClose, onLogout }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-ink-900/45 backdrop-blur-[2px] overlay-in" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-[280px] max-w-[82vw] bg-white/80 backdrop-blur-2xl border-r border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_20px_50px_-20px_rgba(30,41,59,.3)] flex flex-col drawer-in">
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/60">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">{I('graduation')}</span>
            <div>
              <p className="font-extrabold text-ink-900 leading-none" style={{ fontSize: '15px' }}>EduCore</p>
              <p className="text-[10px] text-ink-400 font-medium tracking-wide uppercase">Menu</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* User chip */}
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2.5 rounded-lg glass-flat bg-white/60 px-3 py-2.5 shadow-none">
            <div className="h-9 w-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-[inset_0_1px_0_rgba(255,255,255,.3)]">{avatar(user?.name)}</div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[13px] font-bold text-ink-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-ink-500 uppercase tracking-wide font-semibold">{isAdmin ? 'Administrator' : 'Teacher'}</p>
            </div>
            <NotifyBadge unread={unread} />
          </div>
        </div>

        {/* Nav list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-400">Main</p>
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-none text-[13px] font-semibold transition-all ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500'}`}>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  <Chevron />
                </>
              )}
            </NavLink>
          ))}
          <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-400">Account</p>
          <NavLink to="/notifications" end onClick={onClose}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-none text-[13px] font-semibold transition-all ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}>
            {({ isActive }) => (
              <>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500'}`}>{I('bell')}</span>
                <span className="flex-1">Notifications</span>
                {unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>}
              </>
            )}
          </NavLink>
          <NavLink to="/profile" end onClick={onClose}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-none text-[13px] font-semibold transition-all ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}>
            {({ isActive }) => (
              <>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500'}`}>{I('user')}</span>
                <span className="flex-1">My Profile</span>
              </>
            )}
          </NavLink>
        </div>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-ink-100">
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500">{I('logout')}</span>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

function NotifyBadge({ unread }) {
  if (!unread) return null;
  return <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>;
}

function Chevron() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4 text-ink-300"><path d="M9 5l7 7-7 7" /></svg>;
}

function BadgePill({ children }) {
  return <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{children}</span>;
}

function labelShort(label) {
  if (label.includes('&') || label === 'Announcements') return 'Marks';
  if (label === 'Attendance') return 'Register';
  if (label === 'Dashboard') return 'Home';
  return label.split(' ')[0];
}

function avatar(name) {
  return name ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : 'U';
}
