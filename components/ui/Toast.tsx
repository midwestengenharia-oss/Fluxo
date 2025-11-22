import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: Toast = { id, type, message, duration };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string) => addToast('success', message), [addToast]);
  const error = useCallback((message: string) => addToast('error', message), [addToast]);
  const warning = useCallback((message: string) => addToast('warning', message), [addToast]);
  const info = useCallback((message: string) => addToast('info', message), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast Container
interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

// Individual Toast
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const toastStyles: Record<ToastType, { bg: string; icon: React.ReactNode; iconBg: string }> = {
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    icon: <CheckCircle size={18} />,
    iconBg: 'text-emerald-600',
  },
  error: {
    bg: 'bg-rose-50 border-rose-200',
    icon: <AlertCircle size={18} />,
    iconBg: 'text-rose-600',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: <AlertTriangle size={18} />,
    iconBg: 'text-amber-600',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: <Info size={18} />,
    iconBg: 'text-blue-600',
  },
};

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const styles = toastStyles[toast.type];

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg
        animate-in slide-in-from-right-full fade-in duration-300
        ${styles.bg}
      `}
    >
      <span className={styles.iconBg}>{styles.icon}</span>
      <p className="flex-1 text-sm font-medium text-slate-700">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastProvider;
