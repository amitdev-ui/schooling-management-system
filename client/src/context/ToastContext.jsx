import { createContext, useCallback, useContext, useState, useRef } from 'react';
import Icon from '../components/Icon';

const ToastContext = createContext(null);
let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const value = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
    warning: (m) => show(m, 'warning'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[92vw] sm:max-w-sm">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }) {
  const styles = {
    success: 'border-emerald-200 text-emerald-800 bg-white',
    error: 'border-red-200 text-red-800 bg-white',
    info: 'border-white/20 text-white bg-ink-800',
    warning: 'border-amber-200 text-amber-800 bg-white',
  };
  const icons = {
    success: 'checkCircle',
    error: 'ban',
    info: 'info',
    warning: 'warning',
  };
  const iconColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-ink-500',
    warning: 'bg-amber-500',
  };
  return (
    <div className={`toast-in flex items-start gap-2.5 rounded-md border border-ink-100 p-3 shadow-pop ${styles[toast.type]}`}>
      <span className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-white ${iconColors[toast.type]}`}>
        <Icon name={icons[toast.type]} className="h-3.5 w-3.5" />
      </span>
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button onClick={onClose} aria-label="Dismiss" className="p-1 text-ink-400 hover:text-ink-700 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

export const useToast = () => useContext(ToastContext);
