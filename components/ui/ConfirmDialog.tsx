import React from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false
}) => {
  const config = {
    danger: {
      icon: Trash2,
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white'
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  };

  const { icon: Icon, iconBg, iconColor, buttonClass } = config[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
    >
      <div className="text-center">
        <div className={`w-14 h-14 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Icon className={iconColor} size={28} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="min-w-[120px]"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`min-w-[120px] ${buttonClass}`}
          >
            {loading ? 'Processando...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
