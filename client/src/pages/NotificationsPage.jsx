import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Icon from '../components/Icon';
import { useNotifications } from '../context/NotificationContext';

const icons = { info: 'info', success: 'checkCircle', warning: 'warning', error: 'ban', announcement: 'megaphone', fee: 'creditCard' };
const tones = { info: 'text-brand-600 bg-brand-50', success: 'text-emerald-600 bg-emerald-50', warning: 'text-amber-600 bg-amber-50', error: 'text-red-600 bg-red-50', announcement: 'text-purple-600 bg-purple-50', fee: 'text-cyan-600 bg-cyan-50' };

export default function NotificationsPage() {
  const { items, unread, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  function open(n) {
    if (!n.is_read) markRead(n.id);
    if (n.link) navigate(n.link);
  }

  return (
    <div className="fade-in-up">
      <PageHeader title="Notification Center" subtitle={`${items.length} total · ${unread} unread`}
        actions={<button className="btn-secondary" onClick={markAllRead} disabled={unread === 0}>Mark all read</button>} />

      <div className="card overflow-hidden">
        {items.length === 0 ? (
          <div className="py-16 text-center text-ink-400 text-sm">No notifications yet</div>
        ) : (
          <div className="divide-y divide-ink-100">
            {items.map((n) => (
              <button key={n.id} onClick={() => open(n)}
                className={`w-full text-left flex gap-4 px-4 sm:px-5 py-4 transition ${n.is_read ? '' : 'bg-brand-50/40'} hover:bg-ink-50`}>
                <span className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-md ${tones[n.type] || tones.info}`}>
                  <Icon name={icons[n.type] || 'info'} className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${n.is_read ? 'text-ink-600' : 'text-ink-900'}`}>{n.title}</p>
                    {!n.is_read && <span className="h-2 w-2 flex-none rounded-full bg-brand-500" />}
                  </div>
                  {n.message && <p className="text-sm text-ink-500 mt-0.5">{n.message}</p>}
                  <p className="text-[11px] text-ink-400 mt-1">{new Date(n.created_at.replace(' ', 'T') + 'Z').toLocaleString()}</p>
                </div>
                {n.link && <span className="text-brand-600 self-center">&rarr;</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
