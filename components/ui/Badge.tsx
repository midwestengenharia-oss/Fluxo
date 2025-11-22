import React from 'react';
import { transactionTypeColors, getColorClasses } from '../../styles/tokens';
import { TransactionType } from '../../types';

type BadgeVariant = 'default' | 'outline' | 'solid';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: string;
  className?: string;
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  color = 'slate',
  className = '',
}) => {
  const colorClasses = getColorClasses(color);

  const variantStyles: Record<BadgeVariant, string> = {
    default: `${colorClasses.bgLight} ${colorClasses.textDark}`,
    outline: `bg-transparent border ${colorClasses.border} ${colorClasses.text}`,
    solid: `${colorClasses.bgSolid} text-white`,
  };

  const baseStyles = 'inline-flex items-center font-bold rounded-full uppercase tracking-wide';

  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={combinedClassName}>
      {children}
    </span>
  );
};

// Transaction Type Badge - específico para tipos de transação
interface TransactionBadgeProps {
  type: TransactionType;
  size?: BadgeSize;
}

export const TransactionBadge: React.FC<TransactionBadgeProps> = ({ type, size = 'md' }) => {
  const colors = transactionTypeColors[type];

  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center font-bold rounded uppercase tracking-wide ${colors.bgLight} ${colors.textDark} ${sizeClass}`}>
      {colors.label}
    </span>
  );
};

// Status Badge
interface StatusBadgeProps {
  status: 'pending' | 'paid' | 'active' | 'inactive';
  size?: BadgeSize;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const statusStyles = {
    pending: 'bg-slate-100 text-slate-600',
    paid: 'bg-emerald-100 text-emerald-700',
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-500',
  };

  const statusLabels = {
    pending: 'Pendente',
    paid: 'Efetivado',
    active: 'Ativo',
    inactive: 'Inativo',
  };

  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-bold rounded uppercase tracking-wide ${statusStyles[status]} ${sizeClass}`}>
      {statusLabels[status]}
    </span>
  );
};

// Simulation Badge
export const SimulationBadge: React.FC = () => (
  <span className="bg-purple-100 text-purple-600 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase">
    SIM
  </span>
);

export default Badge;
