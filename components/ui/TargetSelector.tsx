import React from 'react';
import { Account, CreditCard } from '../../types';
import { Wallet, Landmark, CreditCard as CreditCardIcon } from 'lucide-react';
import { getColorClasses } from '../../styles/tokens';
import SegmentedControl from './SegmentedControl';

interface TargetSelectorProps {
  targetType: 'account' | 'card';
  selectedId: string;
  accounts: Account[];
  creditCards: CreditCard[];
  onTargetTypeChange: (type: 'account' | 'card') => void;
  onSelectId: (id: string) => void;
  label?: string;
  disableCards?: boolean;
  disableCardsReason?: string;
}

const TargetSelector: React.FC<TargetSelectorProps> = ({
  targetType,
  selectedId,
  accounts,
  creditCards,
  onTargetTypeChange,
  onSelectId,
  label = 'Origem / Destino',
  disableCards = false,
  disableCardsReason
}) => {
  const targetOptions = [
    { id: 'account', label: 'Contas bancárias' },
    { id: 'card', label: 'Cartões de Crédito', disabled: disableCards }
  ];

  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">
        {label}
      </label>

      {/* Seletor de Tipo */}
      <SegmentedControl
        options={targetOptions}
        value={targetType}
        onChange={(val) => onTargetTypeChange(val as 'account' | 'card')}
      />

      {disableCards && disableCardsReason && (
        <p className="text-[10px] text-amber-600 mt-2 ml-1 font-medium">
          ⚠️ {disableCardsReason}
        </p>
      )}

      {/* Lista de Itens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
        {targetType === 'account' ? (
          accounts.length === 0 ? (
            <div className="col-span-2 text-center py-6">
              <p className="text-sm text-slate-400">Nenhuma conta cadastrada.</p>
            </div>
          ) : (
            accounts.map(acc => {
              const colorClasses = getColorClasses(acc.color);
              const isSelected = selectedId === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => onSelectId(acc.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-slate-800 bg-slate-800 text-white shadow-md'
                      : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : `${colorClasses.bg} ${colorClasses.text}`}`}>
                    {acc.type === 'cash' ? <Wallet size={18}/> : <Landmark size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{acc.name}</p>
                    <p className={`text-[10px] font-mono ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {acc.type === 'checking' ? 'Conta Corrente' : acc.type === 'savings' ? 'Poupança' : 'Dinheiro'}
                    </p>
                  </div>
                </button>
              );
            })
          )
        ) : (
          creditCards.length === 0 ? (
            <div className="col-span-2 text-center py-6">
              <p className="text-sm text-slate-400">Nenhum cartão cadastrado.</p>
            </div>
          ) : (
            creditCards.map(card => {
              const colorClasses = getColorClasses(card.color);
              const isSelected = selectedId === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onSelectId(card.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                      : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : `${colorClasses.bg} ${colorClasses.text}`}`}>
                    <CreditCardIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{card.name}</p>
                    <p className={`text-[10px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      Venc. dia {card.dueDay}
                    </p>
                  </div>
                </button>
              );
            })
          )
        )}
      </div>
    </div>
  );
};

export default TargetSelector;
