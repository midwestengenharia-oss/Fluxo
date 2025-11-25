import React from 'react';
import { TransactionType } from '../../types';
import { transactionTypeColors } from '../../styles/tokens';

interface TransactionTypeSelectorProps {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
  label?: string;
  disabled?: boolean;
  layout?: 'grid' | 'inline';
}

const TransactionTypeSelector: React.FC<TransactionTypeSelectorProps> = ({
  value,
  onChange,
  label = 'Tipo de Movimentação',
  disabled = false,
  layout = 'grid'
}) => {
  const typeOptions = [
    { id: 'expense', label: 'Saída' },
    { id: 'income', label: 'Entrada' },
    { id: 'daily', label: 'Diário' },
    { id: 'economy', label: 'Economia' }
  ];

  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">
        {label}
      </label>
      <div className={layout === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-wrap gap-2'}>
        {typeOptions.map((opt) => {
          const colors = transactionTypeColors[opt.id as TransactionType];
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => !disabled && onChange(opt.id as TransactionType)}
              disabled={disabled}
              className={`px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive
                  ? `${colors.bg} ${colors.border} ${colors.textDark} shadow-sm scale-[1.02]`
                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionTypeSelector;
