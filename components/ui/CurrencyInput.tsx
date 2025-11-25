import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  placeholder?: string;
  size?: 'normal' | 'large';
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  label,
  required = false,
  autoFocus = false,
  disabled = false,
  placeholder = '0,00',
  size = 'normal'
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Formata o valor para exibição
  const formatCurrency = (val: string): string => {
    if (!val || val === '0') return '';

    // Remove tudo que não é número
    const numbers = val.replace(/\D/g, '');
    if (!numbers) return '';

    // Converte para número com centavos
    const cents = parseInt(numbers, 10);
    const formatted = (cents / 100).toFixed(2).replace('.', ',');

    return formatted;
  };

  // Converte display para valor numérico
  const parseToNumeric = (val: string): string => {
    if (!val) return '0';
    const numbers = val.replace(/\D/g, '');
    if (!numbers) return '0';
    return (parseInt(numbers, 10) / 100).toString();
  };

  // Atualiza display quando o valor externo muda
  useEffect(() => {
    if (value === '0' || value === '') {
      setDisplayValue('');
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setDisplayValue(numValue.toFixed(2).replace('.', ','));
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Permite apenas números
    const numbers = input.replace(/\D/g, '');

    if (!numbers) {
      setDisplayValue('');
      onChange('0');
      return;
    }

    const formatted = formatCurrency(numbers);
    setDisplayValue(formatted);
    onChange(parseToNumeric(formatted));
  };

  const handleBlur = () => {
    // Se vazio ao perder foco, mantém vazio
    if (!displayValue) {
      onChange('0');
    }
  };

  const sizeClasses = size === 'large'
    ? 'text-4xl pl-10 py-2'
    : 'text-lg pl-9 py-3';

  const labelClasses = size === 'large'
    ? 'left-0 top-2 text-2xl'
    : 'left-3 top-3 text-lg';

  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">
          {label}
        </label>
      )}
      <div className="relative group">
        <span className={`absolute ${labelClasses} text-slate-300 font-light group-focus-within:text-slate-800 transition-colors`}>
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          required={required}
          autoFocus={autoFocus}
          disabled={disabled}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`block w-full ${sizeClasses} pr-4 ${
            size === 'large'
              ? 'bg-transparent border-b-2 border-slate-200 focus:border-slate-900'
              : 'bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-xl'
          } outline-none font-bold text-slate-800 placeholder:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default CurrencyInput;
