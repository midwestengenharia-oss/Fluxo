import React from 'react';
import { getColorClasses } from '../../styles/tokens';

type IconButtonVariant = 'default' | 'ghost' | 'colored';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  color?: string;
  label?: string;
}

const sizeStyles: Record<IconButtonSize, { button: string; icon: number }> = {
  sm: { button: 'w-8 h-8', icon: 16 },
  md: { button: 'w-10 h-10', icon: 18 },
  lg: { button: 'w-12 h-12', icon: 20 },
};

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'ghost',
  size = 'md',
  color = 'slate',
  label,
  className = '',
  ...props
}) => {
  const colorClasses = getColorClasses(color);

  const variantStyles: Record<IconButtonVariant, string> = {
    default: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    ghost: 'bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600',
    colored: `${colorClasses.bg} ${colorClasses.text} hover:opacity-80`,
  };

  const baseStyles = 'inline-flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95';

  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size].button,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={combinedClassName}
      aria-label={label}
      {...props}
    >
      {icon}
    </button>
  );
};

// Action Icon - para ações como editar/excluir em listas
interface ActionIconProps {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  color?: 'default' | 'danger' | 'primary';
  label?: string;
}

export const ActionIcon: React.FC<ActionIconProps> = ({
  icon,
  onClick,
  color = 'default',
  label,
}) => {
  const colorStyles = {
    default: 'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
    danger: 'text-slate-400 hover:text-rose-600 hover:bg-rose-50',
    primary: 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50',
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`p-2 rounded-lg transition-colors ${colorStyles[color]}`}
      aria-label={label}
    >
      {icon}
    </button>
  );
};

export default IconButton;
