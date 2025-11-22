
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, Account, CreditCard, UserSettings, DEFAULT_CATEGORIES } from '../types';
import { X, Trash2, Wallet, CreditCard as CreditCardIcon, Check, AlertTriangle, Landmark, Hash } from 'lucide-react';
import { formatCurrency } from '../utils/financeUtils';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import SegmentedControl from './ui/SegmentedControl';
import { transactionTypeColors, getColorClasses } from '../styles/tokens';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (t: Partial<Transaction>, installments: number, targetId: string, targetType: 'account' | 'card') => void;
  onDelete?: (id: string) => void;
  initialDate?: string;
  transactionToEdit?: Transaction;
  accounts: Account[];
  creditCards: CreditCard[];
  isSimulationMode: boolean;
  customCategories: UserSettings['customCategories'];
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen, onClose, onSave, onDelete,
  initialDate, transactionToEdit,
  accounts, creditCards, isSimulationMode,
  customCategories
}) => {
  const spendableAccounts = useMemo(() => {
    const allowed = new Set<Account['type']>(['checking', 'savings', 'cash']);
    return accounts.filter(a => allowed.has(a.type));
  }, [accounts]);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'pending' | 'paid'>('pending');
  const [installments, setInstallments] = useState('1');

  // Selection State
  const [targetType, setTargetType] = useState<'account' | 'card'>('account');
  const [selectedId, setSelectedId] = useState<string>('');

  const activeCategories = useMemo(() => {
    const defaults = DEFAULT_CATEGORIES[type] || [];
    const custom = customCategories[type] || [];
    return Array.from(new Set([...defaults, ...custom]));
  }, [type, customCategories]);

  // Resetar formulário apenas quando o modal ABRE (isOpen muda de false para true)
  // ou quando muda a transação sendo editada
  const prevIsOpenRef = React.useRef(false);
  const prevTransactionIdRef = React.useRef<string | undefined>(undefined);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const transactionChanged = transactionToEdit?.id !== prevTransactionIdRef.current;

    prevIsOpenRef.current = isOpen;
    prevTransactionIdRef.current = transactionToEdit?.id;

    // Só reseta se o modal acabou de abrir OU se a transação mudou
    if (!isOpen || (!justOpened && !transactionChanged)) return;

    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      setDescription(transactionToEdit.description);
      setCategory(transactionToEdit.category);
      setDate(transactionToEdit.date);
      setStatus(transactionToEdit.status as 'pending' | 'paid');
      setInstallments((transactionToEdit.installmentTotal || 1).toString());

      if (transactionToEdit.cardId) {
        setTargetType('card');
        setSelectedId(transactionToEdit.cardId);
      } else {
        setTargetType('account');
        setSelectedId(transactionToEdit.accountId || '');
      }
    } else {
      // Defaults
      setType('expense');
      setAmount('');
      setDescription('');
      setCategory('');
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setStatus('pending');
      setInstallments('1');
      setTargetType('account');
      if (spendableAccounts.length > 0) setSelectedId(spendableAccounts[0].id);
    }
  }, [isOpen, transactionToEdit, initialDate, spendableAccounts]);

  // Default category when type changes
  useEffect(() => {
    if (isOpen && !transactionToEdit) {
      setCategory(activeCategories[0] || 'Outros');
    }
  }, [type, isOpen, transactionToEdit]);

  // Enforce: Income cannot be on Card
  useEffect(() => {
    if (type === 'income') {
      setTargetType('account');
      if (creditCards.some(c => c.id === selectedId)) {
        if (spendableAccounts.length > 0) setSelectedId(spendableAccounts[0].id);
        else setSelectedId('');
      }
    }
  }, [type, creditCards, spendableAccounts, selectedId]);

  // Ensure selection stays in allowed accounts when targeting account
  useEffect(() => {
    if (targetType === 'account' && !spendableAccounts.find(a => a.id === selectedId)) {
      setSelectedId(spendableAccounts[0]?.id || '');
    }
  }, [targetType, spendableAccounts, selectedId]);

  // Enforce: Daily expense cannot have installments
  useEffect(() => {
    if (type === 'daily') {
      setInstallments('1');
    }
  }, [type]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) {
      alert("Selecione uma Conta ou Cartão.");
      return;
    }

    const finalInstallments = type === 'daily' ? 1 : parseInt(installments) || 1;

    onSave({
      id: transactionToEdit?.id,
      type,
      amount: parseFloat(amount),
      description,
      category: category || 'Outros',
      date,
      status: targetType === 'card' ? 'pending' : status,
    }, finalInstallments, selectedId, targetType);

    onClose();
  };

  const handleDelete = () => {
    if (transactionToEdit && onDelete) {
      if (window.confirm("Tem certeza que deseja excluir este lançamento?")) {
        onDelete(transactionToEdit.id);
        onClose();
      }
    }
  };

  const getStatusLabels = () => {
    switch (type) {
      case 'income': return { pending: 'Pendente', paid: 'Recebido' };
      case 'daily': return { pending: 'Previsto', paid: 'Realizado' };
      case 'economy': return { pending: 'Planejado', paid: 'Investido' };
      default: return { pending: 'Pendente', paid: 'Pago' };
    }
  };

  const statusLabels = getStatusLabels();

    const typeOptions = [
    { id: 'expense', label: 'Saída' },
    { id: 'income', label: 'Entrada' },
    { id: 'daily', label: 'Diário' },
    { id: 'economy', label: 'Economia' }
  ];

  const targetOptions = [
    { id: 'account', label: 'Contas bancárias' },
    { id: 'card', label: 'Cartões de Crédito', disabled: type === 'income' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? 'Editar Lançamento' : 'Novo Lançamento'}
      subtitle={isSimulationMode ? 'Modo Simulação Ativo' : undefined}
      isSimulation={isSimulationMode}
      footer={
        <div className="flex justify-between items-center">
          <div>
            {transactionToEdit && onDelete && (
              <Button
                variant="ghost"
                icon={<Trash2 size={16} />}
                onClick={handleDelete}
                className="text-rose-600 hover:bg-rose-50"
              >
                Excluir
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              variant={isSimulationMode ? 'secondary' : 'primary'}
              onClick={handleSubmit}
              className={isSimulationMode ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              {transactionToEdit ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-8">

        {/* 1. Value & Type */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Valor</label>
            <div className="relative group">
              <span className="absolute left-0 top-2 text-slate-300 text-2xl font-light group-focus-within:text-slate-800 transition-colors">R$</span>
              <input
                type="number"
                step="0.01"
                required
                autoFocus={!transactionToEdit}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 bg-transparent border-b-2 border-slate-200 focus:border-slate-900 outline-none text-4xl font-bold text-slate-800 placeholder:text-slate-200 transition-colors"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Tipo de Movimentação</label>
            <div className="grid grid-cols-2 gap-3">
              {typeOptions.map((opt) => {
                const colors = transactionTypeColors[opt.id as TransactionType];
                const isActive = type === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setType(opt.id as TransactionType)}
                    className={`px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
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
        </div>

        {/* 2. Description & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Descrição"
            type="text"
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ex: Supermercado, Salário..."
          />
          <Input
            label="Data"
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {/* 3. Origin: Account or Card */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Origem / Destino</label>

          {/* Step 1: Type Selector */}
          <SegmentedControl
            options={targetOptions}
            value={targetType}
            onChange={(val) => setTargetType(val as 'account' | 'card')}
          />

          {/* Step 2: Item Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {targetType === 'account' ? (
              spendableAccounts.length === 0 ? (
                <p className="text-sm text-slate-400 p-2">Nenhuma conta cadastrada.</p>
              ) : (
                spendableAccounts.map(acc => {
                  const colorClasses = getColorClasses(acc.color);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedId(acc.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedId === acc.id
                          ? 'border-slate-800 bg-slate-800 text-white shadow-md'
                          : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selectedId === acc.id ? 'bg-white/20' : `${colorClasses.bg} ${colorClasses.text}`}`}>
                        {acc.type === 'cash' ? <Wallet size={18}/> : <Landmark size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{acc.name}</p>
                        <p className={`text-[10px] font-mono ${selectedId === acc.id ? 'text-slate-300' : 'text-slate-400'}`}>Saldo</p>
                      </div>
                    </button>
                  );
                })
              )
            ) : (
              creditCards.length === 0 ? (
                <p className="text-sm text-slate-400 p-2">Nenhum cartão cadastrado.</p>
              ) : (
                creditCards.map(card => {
                  const colorClasses = getColorClasses(card.color);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedId(card.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedId === card.id
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                          : 'border-slate-100 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selectedId === card.id ? 'bg-white/20' : `${colorClasses.bg} ${colorClasses.text}`}`}>
                        <CreditCardIcon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{card.name}</p>
                        <p className={`text-[10px] font-mono ${selectedId === card.id ? 'text-indigo-200' : 'text-slate-400'}`}>Fatura</p>
                      </div>
                    </button>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* 4. Categories Pills */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {activeCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  category === cat
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-white hover:border-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Extra Options (Status or Installments) */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          {targetType === 'card' ? (
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><CreditCardIcon size={20}/></div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-purple-700 uppercase mb-1">Parcelamento (x)</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="number"
                    min="1"
                    max="48"
                    disabled={type === 'daily'}
                    value={installments}
                    onChange={e => setInstallments(e.target.value)}
                    className={`block w-full pl-10 pr-4 py-2 border-b-2 bg-transparent focus:border-purple-600 outline-none font-bold text-slate-800 ${type === 'daily' ? 'opacity-50 cursor-not-allowed' : 'border-slate-200'}`}
                    placeholder="1"
                  />
                </div>
                {type === 'daily' && <p className="text-[10px] text-rose-500 mt-1 font-medium">Gastos diários não podem ser parcelados.</p>}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                <Check size={20}/>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
                <SegmentedControl
                  options={[
                    { id: 'pending', label: statusLabels.pending },
                    { id: 'paid', label: statusLabels.paid }
                  ]}
                  value={status}
                  onChange={(val) => setStatus(val as 'pending' | 'paid')}
                />
              </div>
            </div>
          )}
        </div>

      </form>
    </Modal>
  );
};

export default TransactionModal;
