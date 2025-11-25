import React, { useState, useEffect, useMemo } from 'react';
import { Recurrence, DEFAULT_CATEGORIES, TransactionType, RecurrenceFrequency, UserSettings, Account, CreditCard } from '../types';
import { Calendar, Trash2 } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import SegmentedControl from './ui/SegmentedControl';
import CurrencyInput from './ui/CurrencyInput';
import TransactionTypeSelector from './ui/TransactionTypeSelector';
import TargetSelector from './ui/TargetSelector';
import ConfirmDialog from './ui/ConfirmDialog';

interface RecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (r: Recurrence) => void;
  onDelete?: (id: string) => void;
  recurrenceToEdit?: Recurrence;
  customCategories: UserSettings['customCategories'];
  onAddCategory: (type: TransactionType, label: string) => void;
  accounts: Account[];
  creditCards: CreditCard[];
}

const RecurrenceModal: React.FC<RecurrenceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  recurrenceToEdit,
  customCategories,
  onAddCategory,
  accounts,
  creditCards
}) => {
  const spendableAccounts = useMemo(() => {
    const allowed = new Set<Account['type']>(['checking', 'savings', 'cash']);
    return accounts.filter(a => allowed.has(a.type));
  }, [accounts]);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState(5);
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('Outros');
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [startFrom, setStartFrom] = useState('');
  const [occurrenceCount, setOccurrenceCount] = useState<string>('');
  const [targetType, setTargetType] = useState<'account' | 'card'>('account');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const activeCategories = useMemo(() => {
    const defaults = DEFAULT_CATEGORIES[type] || [];
    const custom = customCategories[type] || [];
    return Array.from(new Set([...defaults, ...custom]));
  }, [type, customCategories]);

  // Resetar formulário apenas quando o modal ABRE ou quando muda a recorrência sendo editada
  const prevIsOpenRef = React.useRef(false);
  const prevRecurrenceIdRef = React.useRef<string | undefined>(undefined);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const recurrenceChanged = recurrenceToEdit?.id !== prevRecurrenceIdRef.current;

    prevIsOpenRef.current = isOpen;
    prevRecurrenceIdRef.current = recurrenceToEdit?.id;

    if (!isOpen || (!justOpened && !recurrenceChanged)) return;

    if (recurrenceToEdit) {
      setDescription(recurrenceToEdit.description);
      setAmount(recurrenceToEdit.amount.toString());
      setFrequency(recurrenceToEdit.frequency);
      setDayOfMonth(recurrenceToEdit.dayOfMonth);
      setType(recurrenceToEdit.type);
      setCategory(recurrenceToEdit.category);
      setStartFrom(recurrenceToEdit.startFrom);
      setOccurrenceCount(recurrenceToEdit.occurrenceCount ? recurrenceToEdit.occurrenceCount.toString() : '');

      if (recurrenceToEdit.targetCardId) {
        setTargetType('card');
        setSelectedTargetId(recurrenceToEdit.targetCardId);
      } else if (recurrenceToEdit.targetAccountId) {
        setTargetType('account');
        setSelectedTargetId(recurrenceToEdit.targetAccountId);
      } else {
        setTargetType('account');
        setSelectedTargetId(spendableAccounts[0]?.id || '');
      }
    } else {
      const now = new Date();
      const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setDescription('');
      setAmount('');
      setFrequency('monthly');
      setDayOfMonth(1);
      setType('expense');
      setCategory('Outros');
      setStartFrom(defaultStart);
      setOccurrenceCount('');
      setTargetType('account');
      setSelectedTargetId(spendableAccounts[0]?.id || '');
      setShowAddCategory(false);
      setNewCategory('');
    }
  }, [isOpen, recurrenceToEdit, spendableAccounts]);

  useEffect(() => {
    if (!recurrenceToEdit) {
      setCategory(activeCategories[0] || 'Outros');
    }
  }, [type, recurrenceToEdit, activeCategories]);

  useEffect(() => {
    if (startFrom) {
      const d = new Date(startFrom + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setDayOfMonth(d.getDate());
      }
    }
  }, [startFrom]);

  // Impedir que Entrada seja vinculada a Cartão
  useEffect(() => {
    if (type === 'income') {
      setTargetType('account');
      if (creditCards.some(c => c.id === selectedTargetId)) {
        setSelectedTargetId(spendableAccounts[0]?.id || '');
      }
    }
  }, [type, creditCards, spendableAccounts, selectedTargetId]);

  // Garantir seleção de conta válida
  useEffect(() => {
    if (targetType === 'account' && !spendableAccounts.find(a => a.id === selectedTargetId)) {
      setSelectedTargetId(spendableAccounts[0]?.id || '');
    }
  }, [targetType, spendableAccounts, selectedTargetId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTargetId) {
      return;
    }

    if (parseFloat(amount) <= 0) {
      return;
    }

    onSave({
      id: recurrenceToEdit?.id || Math.random().toString(36).substr(2, 9),
      description,
      amount: parseFloat(amount),
      dayOfMonth,
      type,
      category,
      active: true,
      frequency,
      startFrom: startFrom,
      endDate: undefined,
      occurrenceCount: occurrenceCount ? parseInt(occurrenceCount) || undefined : undefined,
      targetAccountId: targetType === 'account' ? selectedTargetId : undefined,
      targetCardId: targetType === 'card' ? selectedTargetId : undefined
    });
    onClose();
  };

  const handleDeleteConfirm = () => {
    if (recurrenceToEdit && onDelete) {
      onDelete(recurrenceToEdit.id);
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

  const frequencyOptions = [
    { id: 'monthly', label: 'Mensal' },
    { id: 'daily', label: 'Diária' }
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={recurrenceToEdit ? 'Editar Regra' : 'Nova Regra Recorrente'}
        size="md"
        footer={
          <div className="flex justify-between items-center">
            <div>
              {recurrenceToEdit && onDelete && (
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
                {recurrenceToEdit ? 'Salvar' : 'Criar Regra'}
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Frequência e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Frequência</label>
              <SegmentedControl
                options={frequencyOptions}
                value={frequency}
                onChange={(val) => setFrequency(val as RecurrenceFrequency)}
                fullWidth
              />
            </div>
            <div className="flex-1">
              <TransactionTypeSelector
                value={type}
                onChange={setType}
                label="Tipo"
                layout="inline"
              />
            </div>
          </div>

          {/* Valor */}
          <CurrencyInput
            label="Valor"
            value={amount}
            onChange={setAmount}
            required
            autoFocus={!recurrenceToEdit}
            size="normal"
          />

          {/* Descrição */}
          <Input
            label="Descrição"
            type="text"
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ex: Aluguel, Investimento mensal..."
          />

          {/* Data de Início */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Data de Início</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-3.5 text-slate-400"/>
              <input
                type="date"
                required
                value={startFrom}
                onChange={e => setStartFrom(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-xl outline-none text-sm font-medium"
              />
            </div>
            {frequency === 'monthly' && (
              <p className="text-[10px] text-slate-400 mt-1 ml-1">
                A regra será aplicada todo dia <strong className="text-slate-600">{dayOfMonth}</strong>.
              </p>
            )}
          </div>

          {/* Número de ocorrências */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">
              Encerrar após (opcional)
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  value={occurrenceCount}
                  onChange={e => setOccurrenceCount(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-xl outline-none text-sm font-bold text-center"
                  placeholder="∞"
                />
              </div>
              <span className="text-sm font-medium text-slate-500">
                {occurrenceCount ? (parseInt(occurrenceCount) === 1 ? 'ocorrência' : 'ocorrências') : 'ocorrências'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 ml-1">
              {occurrenceCount
                ? `A regra será aplicada ${occurrenceCount}x e depois desativada.`
                : 'Deixe vazio para repetir indefinidamente.'
              }
            </p>
          </div>

          {/* Seletor de Destino */}
          <TargetSelector
            targetType={targetType}
            selectedId={selectedTargetId}
            accounts={spendableAccounts}
            creditCards={creditCards}
            onTargetTypeChange={setTargetType}
            onSelectId={setSelectedTargetId}
            label="Destino"
            disableCards={type === 'income'}
            disableCardsReason="Receitas não podem ser lançadas em cartões de crédito"
          />

          {/* Categorias */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Categoria</label>
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
        </form>
      </Modal>

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Regra?"
        message="Esta ação não pode ser desfeita. A regra recorrente será removida permanentemente e não gerará mais transações futuras."
        confirmText="Excluir"
        variant="danger"
      />
    </>
  );
};

export default RecurrenceModal;
