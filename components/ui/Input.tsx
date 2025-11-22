import React from 'react';

type InputVariant = 'default' | 'filled' | 'underline';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  inputSize?: InputSize;
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  prefix?: string;
  fullWidth?: boolean;
}

const variantStyles: Record<InputVariant, string> = {
  default: 'bg-white/80 backdrop-blur rounded-xl border-2 border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.5)]',
  filled: 'bg-slate-50/70 backdrop-blur rounded-xl border-2 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15',
  underline: 'bg-transparent border-b-2 border-slate-200 focus:border-slate-900 rounded-none px-0',
};

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-sm',
  lg: 'px-4 py-4 text-base',
};

const Input: React.FC<InputProps> = ({
  variant = 'filled',
  inputSize = 'md',
  label,
  error,
  icon,
  prefix,
  fullWidth = true,
  className = '',
  ...props
}) => {
  const baseStyles = 'outline-none font-medium text-slate-800 placeholder:text-slate-400 transition-all duration-200';

  const inputClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[inputSize],
    icon ? 'pl-10' : '',
    prefix ? 'pl-10' : '',
    fullWidth ? 'w-full' : '',
    error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        {prefix && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 text-2xl font-light">
            {prefix}
          </span>
        )}
        <input className={inputClassName} {...props} />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
      )}
    </div>
  );
};

// Textarea variant
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  fullWidth = true,
  className = '',
  ...props
}) => {
  const baseClassName = [
    'bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-xl',
    'px-4 py-3 text-sm outline-none font-medium text-slate-800 placeholder:text-slate-400',
    'transition-all duration-200 resize-none',
    fullWidth ? 'w-full' : '',
    error ? 'border-rose-500 focus:border-rose-500' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">
          {label}
        </label>
      )}
      <textarea className={baseClassName} {...props} />
      {error && (
        <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
      )}
    </div>
  );
};

export default Input;
