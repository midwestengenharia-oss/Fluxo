import React from 'react';

type CardVariant = 'default' | 'elevated' | 'bordered' | 'dark' | 'gradient';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white/70 backdrop-blur-xl border border-slate-100 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.55)]',
  elevated: 'bg-white border border-slate-100 shadow-[0_22px_55px_-30px_rgba(15,23,42,0.4)]',
  bordered: 'bg-white border-2 border-slate-200',
  dark: 'bg-slate-900/80 backdrop-blur-lg border border-slate-700 text-white shadow-[0_18px_50px_-30px_rgba(0,0,0,0.45)]',
  gradient: 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white shadow-[0_24px_60px_-32px_rgba(37,99,235,0.35)] border border-white/10',
};

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  hover = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-200';
  const hoverStyles = hover ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' : '';

  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    paddingStyles[padding],
    hoverStyles,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  );
};

// Card Header Component
interface CardHeaderProps {
  icon?: React.ReactNode;
  iconBg?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  icon,
  iconBg = 'bg-slate-100 text-slate-600',
  title,
  subtitle,
  action,
}) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      {icon && (
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          {icon}
        </div>
      )}
      <div>
        <h3 className="font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

// Card Stat Component (for KPIs)
interface CardStatProps {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  valueColor?: string;
}

export const CardStat: React.FC<CardStatProps> = ({
  label,
  value,
  sublabel,
  valueColor = 'text-slate-800',
}) => (
  <div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
    <p className={`text-3xl font-bold font-mono tracking-tight ${valueColor}`}>{value}</p>
    {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
  </div>
);

export default Card;
