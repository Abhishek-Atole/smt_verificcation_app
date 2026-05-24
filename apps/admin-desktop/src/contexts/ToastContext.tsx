import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => undefined });

function iconFor(variant: ToastVariant) {
  switch (variant) {
    case 'success': return CheckCircle2;
    case 'error': return AlertCircle;
    case 'warning': return TriangleAlert;
    default: return Info;
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, variant: ToastVariant = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, message, variant }].slice(-3));
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4000);
  };

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = iconFor(toast.variant);
          return (
            <div key={toast.id} className={clsx('toast', `toast-${toast.variant}`, 'fade-in')}>
              <Icon size={18} />
              <div className="toast-message">{toast.message}</div>
              <button className="toast-close" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} aria-label="Dismiss toast"><X size={14} /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
