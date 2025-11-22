import React from 'react';

interface Option {
  id: string;
  label: string;
  disabled?: boolean;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs',
  };

  return (
    <div className={`flex p-1 bg-slate-100 rounded-lg ${fullWidth ? 'w-full' : 'w-fit'}`}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => !option.disabled && onChange(option.id)}
          disabled={option.disabled}
          className={`
            ${sizeStyles[size]} rounded-md font-bold transition-all
            ${fullWidth ? 'flex-1' : ''}
            ${value === option.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }
            ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default SegmentedControl;
