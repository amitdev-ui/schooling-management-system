import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import Icon from './Icon';

const icons = {
  info: 'info',
  success: 'checkCircle',
  warning: 'warning',
  error: 'ban',
  announcement: 'megaphone',
  fee: 'creditCard',
};

const tones = {
  info: 'text-brand-600 bg-brand-50',
  success: 'text-emerald-600 bg-emerald-50',
  warning: 'text-amber-600 bg-amber-50',
  error: 'text-red-600 bg-red-50',
  announcement: 'text-purple-600 bg-purple-50',
  fee: 'text-cyan-600 bg-cyan-50',
};

export default function NotificationBell({ compact }) {
  const { items, unread, open, setOpen, markRead, markAllRead, refresh } = useNotifications();
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setOpen]);

  function handleItem(n) {
    if (!n.is_read) markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); refresh(); }}
        className={`relative flex items-center justify-center rounded-xl text-ink-600 hover:bg-ink-100 transition ${compact ? 'h-9 w-9' : 'h-9 w-9'}`}
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[19px] w-[19px]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="dropdown fixed sm:absolute sm:right-0 sm:mt-2 left-3 right-3 sm:left-auto sm:w-[400px] top-14 sm:top-auto flex max-h-[80vh] sm:max-h-[75vh] flex-col overflow-hidden rounded-2xl glass-strong bg-white/80 shadow-2xl shadow-ink-900/15 border border-white/70 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/60 glass-flat bg-white/60 shadow-none">
            <div className="flex items-center gap-2.5">
              <h4 className="font-bold text-ink-800" style={{ fontSize: '15px' }}>Notifications</h4>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="badge bg-brand-600 text-white">{unread} unread</span>
              <button onClick={markAllRead} className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 px-2 py-1 rounded hover:bg-brand-50">Mark all read</button>
            </div>
          </div>

          {/* List — shows everything */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/70 bg-white/20">
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/60 text-ink-400"><Icon name="bell" className="h-5 w-5" /></span>
                <p className="text-sm font-semibold text-ink-500">All caught up</p>
                <p className="text-xs text-ink-400">New notifications will appear here instantly.</p>
              </div>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => handleItem(n)}
                className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-white/70 transition ${n.is_read ? 'bg-transparent' : 'bg-white/60'}`}
              >
                <span className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md ${tones[n.type] || tones.info}`}>
                  <Icon name={icons[n.type] || 'info'} className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold ${n.is_read ? 'text-ink-500' : 'text-ink-900'}`}>{n.title}</p>
                  {n.message && <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{n.message}</p>}
                  <p className="text-[11px] text-ink-400 mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="mt-2 h-2 w-2 flex-none rounded-full bg-brand-500" />}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-ink-100 p-2">
            <button onClick={() => { setOpen(false); navigate('/notifications'); }}
              className="w-full text-center text-[13px] font-semibold text-brand-600 hover:bg-brand-50 py-2 rounded-lg transition">
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr.replace(' ', 'T') + 'Z').getTime();
    if (!d) return '';
    const diff = Date.now() - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(d).toLocaleDateString();
  } catch {
    return '';
  }
}
