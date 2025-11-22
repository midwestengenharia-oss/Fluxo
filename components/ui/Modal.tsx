import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  isSimulation?: boolean;
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'lg',
  showCloseButton = true,
  isSimulation = false,
}) => {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const simulationStyles = isSimulation
    ? 'border-purple-500 ring-4 ring-purple-500/20'
    : 'border-slate-100';

  const headerBg = isSimulation
    ? 'bg-purple-50 border-purple-100'
    : 'bg-white border-slate-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`
          relative bg-white rounded-2xl w-full ${sizeStyles[size]}
          shadow-2xl border flex flex-col max-h-[90vh]
          animate-in zoom-in-95 slide-in-from-bottom-4 duration-300
          ${simulationStyles}
        `}
      >
        {/* Header */}
        <div className={`flex justify-between items-center px-6 py-5 border-b rounded-t-2xl sticky top-0 z-10 ${headerBg}`}>
          <div>
            <h3 className={`text-xl font-bold ${isSimulation ? 'text-purple-900' : 'text-slate-800'}`}>
              {title}
            </h3>
            {subtitle && (
              <p className={`text-xs mt-0.5 ${isSimulation ? 'text-purple-600' : 'text-slate-400'}`}>
                {subtitle}
              </p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-slate-100 bg-white rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Confirm Dialog - Substitui window.confirm
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;

  const confirmVariant = variant === 'danger' ? 'danger' : variant === 'warning' ? 'secondary' : 'primary';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" showCloseButton={false}>
      <p className="text-slate-600">{description}</p>

      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={onClose} fullWidth disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} fullWidth loading={loading}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

export default Modal;
