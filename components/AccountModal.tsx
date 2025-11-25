import React, { useState, useEffect } from 'react';
import { Account, CreditCard as CreditCardType } from '../types';
import { CreditCard, Landmark, Calendar, Briefcase, Trash2, Wallet } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import CurrencyInput from './ui/CurrencyInput';
import SegmentedControl from './ui/SegmentedControl';
import ConfirmDialog from './ui/ConfirmDialog';
import { getColorClasses, ColorName } from '../styles/tokens';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAccount: (account: Account) => void;
  onSaveCard: (card: CreditCardType) => void;
  onDeleteAccount?: (id: string) => void;
  onDeleteCard?: (id: string) => void;
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

const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSaveAccount,
  onSaveCard,
  onDeleteAccount,
  onDeleteCard,
  accountToEdit,
  cardToEdit
}) => {
  const [name, setName] = useState('');
  const [isCredit, setIsCredit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Account fields
  const [initialBalance, setInitialBalance] = useState('');
  const [accountType, setAccountType] = useState<Account['type']>('checking');

  // Card fields
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('1');
  const [dueDay, setDueDay] = useState('10');

  const [color, setColor] = useState<ColorName>('blue');

  useEffect(() => {
    if (isOpen) {
      if (cardToEdit) {
        setIsCredit(true);
        setName(cardToEdit.name);
        setLimit(cardToEdit.limit.toString());
        setClosingDay(cardToEdit.closingDay.toString());
        setDueDay(cardToEdit.dueDay.toString());
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
        setClosingDay('1');
        setDueDay('10');
        setColor('blue');
      }
    }
  }, [isOpen, accountToEdit, cardToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCredit) {
      if (parseFloat(limit) <= 0) return;

      const newCard: CreditCardType = {
        id: cardToEdit?.id || Math.random().toString(36).substr(2, 9),
        name,
        limit: parseFloat(limit),
        closingDay: parseInt(closingDay),
        dueDay: parseInt(dueDay),
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

  const handleDeleteConfirm = () => {
    if (isCredit && cardToEdit && onDeleteCard) {
      onDeleteCard(cardToEdit.id);
    } else if (!isCredit && accountToEdit && onDeleteAccount) {
      onDeleteAccount(accountToEdit.id);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  const accountTypeOptions = [
    { id: 'checking', label: 'Corrente', icon: <Landmark size={14} /> },
    { id: 'savings', label: 'Poupança', icon: <Briefcase size={14} /> },
    { id: 'cash', label: 'Dinheiro', icon: <Wallet size={14} /> },
    { id: 'investment', label: 'Investimento', icon: <Briefcase size={14} /> }
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          cardToEdit ? 'Editar Cartão' :
          accountToEdit ? 'Editar Conta' :
          'Nova Conta ou Cartão'
        }
        size="md"
        footer={
          <div className="flex justify-between items-center">
            <div>
              {(accountToEdit || cardToEdit) && (onDeleteAccount || onDeleteCard) && (
                <Button
                  variant="ghost"
                  icon={<Trash2 size={16} />}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-rose-600 hover:bg-rose-50"
                >
                  Excluir
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button variant="primary" onClick={handleSubmit}>
                {accountToEdit || cardToEdit ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Seletor de Tipo: Conta ou Cartão */}
          {!accountToEdit && !cardToEdit && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">
                O que deseja cadastrar?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsCredit(false)}
                  className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all ${
                    !isCredit
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-100'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-3 rounded-xl mb-2 ${!isCredit ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                    <Landmark size={24} className={!isCredit ? 'text-emerald-600' : 'text-slate-400'} />
                  </div>
                  <span className="text-sm font-bold">Conta Bancária</span>
                  <span className="text-[10px] text-slate-500 mt-1 text-center">Corrente, Poupança ou Dinheiro</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCredit(true)}
                  className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all ${
                    isCredit
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-100'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-3 rounded-xl mb-2 ${isCredit ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                    <CreditCard size={24} className={isCredit ? 'text-indigo-600' : 'text-slate-400'} />
                  </div>
                  <span className="text-sm font-bold">Cartão de Crédito</span>
                  <span className="text-[10px] text-slate-500 mt-1 text-center">Com limite e fatura</span>
                </button>
              </div>
            </div>
          )}

          {/* Nome */}
          <Input
            label={isCredit ? 'Nome do Cartão' : 'Nome da Conta'}
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={isCredit ? "Ex: Nubank Platinum, Visa Black..." : "Ex: Banco do Brasil, Carteira..."}
            autoFocus
          />

          {/* Campos Condicionais */}
          {isCredit ? (
            <>
              {/* Limite do Cartão */}
              <CurrencyInput
                label="Limite do Cartão"
                value={limit}
                onChange={setLimit}
                required
                size="normal"
              />

              {/* Datas de Fechamento e Vencimento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">
                    Dia de Fechamento
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={closingDay}
                      onChange={e => setClosingDay(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-xl outline-none text-sm font-bold text-slate-800"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">
                    Quando a fatura fecha
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">
                    Dia de Vencimento
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={dueDay}
                      onChange={e => setDueDay(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-xl outline-none text-sm font-bold text-slate-800"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">
                    Quando vence a fatura
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Tipo de Conta */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">
                  Tipo de Conta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {accountTypeOptions.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAccountType(opt.id as Account['type'])}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                        accountType === opt.id
                          ? 'border-slate-800 bg-slate-800 text-white shadow-md'
                          : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
                {accountType === 'investment' && (
                  <p className="text-[10px] text-amber-600 mt-2 ml-1 font-medium">
                    ⚠️ Contas de investimento não podem receber transações
                  </p>
                )}
              </div>

              {/* Saldo Inicial */}
              <CurrencyInput
                label="Saldo Inicial"
                value={initialBalance}
                onChange={setInitialBalance}
                size="normal"
              />
              <p className="text-[10px] text-slate-500 -mt-3 ml-1">
                O saldo atual da conta. Pode ser 0 (zero) ou negativo.
              </p>
            </>
          )}

          {/* Seletor de Cor */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">
              Cor de Identificação
            </label>
            <div className="grid grid-cols-7 gap-3">
              {COLORS.map(c => {
                const colorClasses = getColorClasses(c.value);
                const isSelected = color === c.value;
                return (
                  <div key={c.value} className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`relative w-14 h-14 rounded-2xl ${colorClasses.bgSolid} flex items-center justify-center transition-all shadow-md ${
                        isSelected
                          ? 'ring-4 ring-offset-2 ring-slate-400 scale-110 shadow-xl'
                          : 'hover:scale-105 hover:shadow-lg'
                      }`}
                      title={c.name}
                    >
                      {isSelected && (
                        <div className="w-5 h-5 bg-white rounded-full shadow-lg border-2 border-white/50" />
                      )}
                    </button>
                    <span className={`text-[10px] font-medium transition-all ${
                      isSelected ? 'text-slate-800' : 'text-slate-400'
                    }`}>
                      {c.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview Card */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pré-visualização</p>
            <div className={`p-4 rounded-xl ${getColorClasses(color).bg} border-2 ${getColorClasses(color).border}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getColorClasses(color).bgSolid}`}>
                  {isCredit ? (
                    <CreditCard size={20} className="text-white" />
                  ) : accountType === 'cash' ? (
                    <Wallet size={20} className="text-white" />
                  ) : (
                    <Landmark size={20} className="text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{name || 'Nome da conta/cartão'}</p>
                  <p className="text-xs text-slate-500">
                    {isCredit ? `Limite R$ ${parseFloat(limit || '0').toFixed(2)}` : `Saldo R$ ${parseFloat(initialBalance || '0').toFixed(2)}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </form>
      </Modal>

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title={isCredit ? 'Excluir Cartão?' : 'Excluir Conta?'}
        message={
          isCredit
            ? 'Esta ação não pode ser desfeita. O cartão será removido permanentemente, mas as transações associadas serão mantidas no histórico.'
            : 'Esta ação não pode ser desfeita. A conta será removida permanentemente, mas as transações associadas serão mantidas no histórico.'
        }
        confirmText="Excluir"
        variant="danger"
      />
    </>
  );
};

export default AccountModal;
