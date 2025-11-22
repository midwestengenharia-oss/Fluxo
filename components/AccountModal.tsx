import React, { useState, useEffect } from 'react';
import { Account, CreditCard as CreditCardType } from '../types';
import { CreditCard, Landmark, DollarSign, Calendar, Briefcase } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import { getColorClasses, ColorName } from '../styles/tokens';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAccount: (account: Account) => void;
  onSaveCard: (card: CreditCardType) => void;
  accountToEdit?: Account;
  cardToEdit?: CreditCardType;
}

const COLORS: { name: string; value: ColorName }[] = [
  { name: 'Blue', value: 'blue' },
  { name: 'Indigo', value: 'indigo' },
  { name: 'Purple', value: 'purple' },
  { name: 'Emerald', value: 'emerald' },
  { name: 'Rose', value: 'rose' },
  { name: 'Amber', value: 'amber' },
  { name: 'Slate', value: 'slate' },
];

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onSaveAccount, onSaveCard, accountToEdit, cardToEdit }) => {
  const [name, setName] = useState('');
  const [isCredit, setIsCredit] = useState(false);

  // Account fields
  const [initialBalance, setInitialBalance] = useState('');
  const [accountType, setAccountType] = useState<Account['type']>('checking');

  // Card fields
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState(1);
  const [dueDay, setDueDay] = useState(10);

  const [color, setColor] = useState<ColorName>('blue');

  useEffect(() => {
    if (isOpen) {
      if (cardToEdit) {
        setIsCredit(true);
        setName(cardToEdit.name);
        setLimit(cardToEdit.limit.toString());
        setClosingDay(cardToEdit.closingDay);
        setDueDay(cardToEdit.dueDay);
        setColor(cardToEdit.color as ColorName);
      } else if (accountToEdit) {
        setIsCredit(false);
        setName(accountToEdit.name);
        setAccountType(accountToEdit.type);
        setInitialBalance(accountToEdit.initialBalance.toString());
        setColor(accountToEdit.color as ColorName);
      } else {
        setName('');
        setIsCredit(false);
        setAccountType('checking');
        setInitialBalance('');
        setLimit('');
        setClosingDay(1);
        setDueDay(10);
        setColor('blue');
      }
    }
  }, [isOpen, accountToEdit, cardToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCredit) {
      const newCard: CreditCardType = {
        id: cardToEdit?.id || Math.random().toString(36).substr(2, 9),
        name,
        limit: parseFloat(limit) || 0,
        closingDay,
        dueDay,
        color
      };
      onSaveCard(newCard);
    } else {
      const newAccount: Account = {
        id: accountToEdit?.id || Math.random().toString(36).substr(2, 9),
        name,
        type: accountType,
        initialBalance: parseFloat(initialBalance) || 0,
        color
      };
      onSaveAccount(newAccount);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cardToEdit ? 'Editar Cartão' : accountToEdit ? 'Editar Conta / Carteira' : 'Nova Conta / Cartão'}
      size="md"
      footer={
        <Button variant="primary" fullWidth onClick={handleSubmit}>
          Salvar
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsCredit(false)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${!isCredit ? 'border-emerald-400/80 bg-emerald-50 text-emerald-700 shadow-[0_16px_40px_-28px_rgba(16,185,129,0.9)]' : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            <Landmark size={24} className="mb-2" />
            <span className="text-xs font-bold uppercase text-center leading-tight">Conta Bancária</span>
            <span className="text-[10px] text-slate-500 mt-1">Usada para caixa e despesas diárias</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCredit(true)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${isCredit ? 'border-cyan-400/80 bg-cyan-50 text-cyan-700 shadow-[0_16px_40px_-28px_rgba(6,182,212,0.9)]' : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            <CreditCard size={24} className="mb-2" />
            <span className="text-xs font-bold uppercase">Cartão de Crédito</span>
          </button>
        </div>

        {/* Name */}
        <Input
          label="Nome"
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={isCredit ? "Ex: Nubank, Visa Black..." : "Ex: Banco do Brasil, Carteira..."}
        />

        {/* Conditional Fields */}
        {isCredit ? (
          <>
            <Input
              label="Limite do Cartão"
              type="number"
              required
              value={limit}
              onChange={e => setLimit(e.target.value)}
              placeholder="0,00"
              icon={<DollarSign size={18} />}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Dia Fechamento</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <select
                    value={closingDay}
                    onChange={e => setClosingDay(Number(e.target.value))}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-xl outline-none text-slate-800 appearance-none"
                  >
                    {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Dia Vencimento</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <select
                    value={dueDay}
                    onChange={e => setDueDay(Number(e.target.value))}
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-xl outline-none text-slate-800 appearance-none"
                  >
                    {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Tipo de Conta</label>
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAccountType('checking')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${accountType === 'checking' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
                >
                  Corrente
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('investment')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${accountType === 'investment' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                >
                  <Briefcase size={12} />
                  Investimento (carteira)
                </button>
              </div>
            </div>

            <Input
              label="Saldo Inicial Atual"
              type="number"
              required
              value={initialBalance}
              onChange={e => setInitialBalance(e.target.value)}
              placeholder="0,00"
              icon={<DollarSign size={18} />}
            />
          </>
        )}

        {/* Color Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Cor de Identificação</label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {COLORS.map(c => {
              const colorClasses = getColorClasses(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-10 h-10 rounded-full ${colorClasses.bgSolid} flex items-center justify-center transition-all ${color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-70 hover:opacity-100'}`}
                >
                  {color === c.value && <div className="w-3 h-3 bg-white rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AccountModal;
