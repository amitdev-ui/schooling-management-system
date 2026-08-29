import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const seenRef = useRef(new Set());
  const firstRunRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const list = await api('/notifications');
      setItems(list);
      const unreadCount = list.reduce((a, n) => a + (n.is_read ? 0 : 1), 0);
      // On first load, seed seen set without toasting (avoid spam on login)
      if (firstRunRef.current) {
        firstRunRef.current = false;
        list.forEach((n) => seenRef.current.add(n.id));
      } else {
        const fresh = list.filter((n) => !n.is_read && !seenRef.current.has(n.id));
        for (const n of fresh) {
          seenRef.current.add(n.id);
          const style = { success: 'success', warning: 'warning', error: 'error', announcement: 'info', info: 'info' }[n.type] || 'info';
          toast.show(n.title + (n.message ? ` — ${n.message}` : ''), style, 4500);
          if (n.link) window.dispatchEvent(new CustomEvent('sms:navigate', { detail: n.link }));
        }
      }
      setUnread(unreadCount);
    } catch {}
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;
    refresh();
    const iv = setInterval(refresh, 3000);
    return () => clearInterval(iv);
  }, [user, refresh]);

  const markRead = useCallback(async (id) => {
    setItems((list) => list.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try { await api(`/notifications/${id}/read`, { method: 'POST' }); } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((list) => list.map((n) => ({ ...n, is_read: 1 })));
    setUnread(0);
    try { await api('/notifications/mark-all-read', { method: 'POST' }); } catch {}
  }, []);

  return (
    <NotificationContext.Provider value={{ items, unread, open, setOpen, refresh, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
