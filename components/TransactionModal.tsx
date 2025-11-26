import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, Account, CreditCard, UserSettings } from '../types';
import { getLocalDateString } from '../utils/financeUtils';
import { Trash2, Check, Hash } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import SegmentedControl from './ui/SegmentedControl';
import CurrencyInput from './ui/CurrencyInput';
import TransactionTypeSelector from './ui/TransactionTypeSelector';
import TargetSelector from './ui/TargetSelector';
import ConfirmDialog from './ui/ConfirmDialog';
import { DEFAULT_CATEGORIES } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    t: Partial<Transaction>,
    installments: number,
    targetId: string,
    targetType: 'account' | 'card',
    recurrenceScope?: 'single' | 'from_here' | 'all'
  ) => void;
  onDelete?: (id: string, opts?: { recurrenceScope?: 'single' | 'from_here' | 'all' }) => void;
  initialDate?: string;
  transactionToEdit?: Transaction;
  accounts: Account[];
  creditCards: CreditCard[];
  isSimulationMode: boolean;
  customCategories: UserSettings['customCategories'];
  onAddCategory: (type: TransactionType, label: string) => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen, onClose, onSave, onDelete,
  initialDate, transactionToEdit,
  accounts, creditCards, isSimulationMode,
  customCategories, onAddCategory
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
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Selection State
  const [targetType, setTargetType] = useState<'account' | 'card'>('account');
  const [selectedId, setSelectedId] = useState<string>('');
  const isProjected = transactionToEdit?.id?.startsWith('proj-') || false;
  const [recurrenceScope, setRecurrenceScope] = useState<'single' | 'from_here' | 'all'>('single');

  const activeCategories = useMemo(() => {
    const defaults = DEFAULT_CATEGORIES[type] || [];
    const custom = customCategories[type] || [];
    return Array.from(new Set([...defaults, ...custom]));
  }, [type, customCategories]);

  // Resetar formulário apenas quando o modal ABRE ou quando muda a transação sendo editada
  const prevIsOpenRef = React.useRef(false);
  const prevTransactionIdRef = React.useRef<string | undefined>(undefined);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const transactionChanged = transactionToEdit?.id !== prevTransactionIdRef.current;

    prevIsOpenRef.current = isOpen;
    prevTransactionIdRef.current = transactionToEdit?.id;

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
      if (transactionToEdit.id?.startsWith('proj-')) {
        setRecurrenceScope('single');
      }
      setShowAddCategory(false);
      setNewCategory('');
    } else {
      // Defaults
      setType('expense');
      setAmount('');
      setDescription('');
      setCategory('');
      setDate(initialDate || getLocalDateString());
      setStatus('pending');
      setInstallments('1');
      setTargetType('account');
      if (spendableAccounts.length > 0) setSelectedId(spendableAccounts[0].id);
      setRecurrenceScope('single');
      setShowAddCategory(false);
      setNewCategory('');
    }
  }, [isOpen, transactionToEdit, initialDate, spendableAccounts]);

  // Default category when type changes
  useEffect(() => {
    if (isOpen && !transactionToEdit) {
      setCategory(activeCategories[0] || 'Outros');
    }
  }, [type, isOpen, transactionToEdit, activeCategories]);

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
      return;
    }

    if (parseFloat(amount) <= 0) {
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
    }, finalInstallments, selectedId, targetType, isProjected ? recurrenceScope : undefined);

    onClose();
  };

  const handleDeleteConfirm = () => {
    if (transactionToEdit && onDelete) {
      onDelete(transactionToEdit.id, isProjected ? { recurrenceScope } : undefined);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    onAddCategory(type, trimmed);
    setCategory(trimmed);
    setNewCategory('');
    setShowAddCategory(false);
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

  return (
    <>
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
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-rose-600 hover:bg-rose-50"
                >
                  Excluir
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                className={isSimulationMode ? '!bg-purple-600 hover:!bg-purple-700 !text-white !border-purple-600 !shadow-purple-500/30' : ''}
              >
                {transactionToEdit ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">

          {isProjected && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Escopo da alteração</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'single', label: 'Só esta' },
                  { id: 'from_here', label: 'Esta e próximas' },
                  { id: 'all', label: 'Toda a regra' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRecurrenceScope(opt.id as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      recurrenceScope === opt.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Aplique a mudança só nesta ocorrência, desta data em diante ou na regra inteira.
              </p>
            </div>
          )}

          {/* Valor e Tipo */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <CurrencyInput
                label="Valor"
                value={amount}
                onChange={setAmount}
                required
                autoFocus={!transactionToEdit}
                size="large"
              />
            </div>

            <div className="flex-1">
              <TransactionTypeSelector
                value={type}
                onChange={setType}
              />
            </div>
          </div>

          {/* Descrição e Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Seletor de Destino */}
          <TargetSelector
            targetType={targetType}
            selectedId={selectedId}
            accounts={spendableAccounts}
            creditCards={creditCards}
            onTargetTypeChange={setTargetType}
            onSelectId={setSelectedId}
            disableCards={type === 'income'}
            disableCardsReason="Receitas não podem ser lançadas em cartões de crédito"
          />

          {/* Categorias */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Categoria</label>
            <div className="flex flex-wrap gap-2 items-center">
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
              <button
                type="button"
                onClick={() => setShowAddCategory(prev => !prev)}
                className="px-2.5 py-1.5 rounded-full text-xs font-bold border border-slate-300 text-slate-600 hover:border-slate-500 hover:text-slate-800 transition-colors"
              >
                +
              </button>
            </div>
            {showAddCategory && (
              <div className="mt-2 flex gap-2 items-center">
                <input
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="Nova categoria"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                />
                <Button type="button" variant="primary" onClick={handleAddCategory}>Salvar</Button>
                <Button type="button" variant="ghost" onClick={() => { setShowAddCategory(false); setNewCategory(''); }}>Cancelar</Button>
              </div>
            )}
          </div>

          {/* Status ou Parcelamento */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            {targetType === 'card' ? (
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Hash size={20}/>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-purple-700 uppercase mb-2">Parcelamento</label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    disabled={type === 'daily'}
                    value={installments}
                    onChange={e => setInstallments(e.target.value)}
                    className={`block w-full px-4 py-2 border-2 bg-white rounded-lg focus:border-purple-600 outline-none font-bold text-slate-800 ${type === 'daily' ? 'opacity-50 cursor-not-allowed border-slate-200' : 'border-slate-200'}`}
                    placeholder="1"
                  />
                  {type === 'daily' && <p className="text-[10px] text-rose-500 mt-1 font-medium">Gastos diários não podem ser parcelados.</p>}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                  <Check size={20}/>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Status</label>
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

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Lançamento?"
        message={isProjected
          ? `Esta ação irá excluir o lançamento de acordo com o escopo selecionado (${recurrenceScope === 'single' ? 'apenas esta ocorrência' : recurrenceScope === 'from_here' ? 'esta e próximas' : 'toda a regra'}).`
          : "Esta ação não pode ser desfeita. O lançamento será removido permanentemente."
        }
        confirmText="Excluir"
        variant="danger"
      />
    </>
  );
};

export default TransactionModal;
