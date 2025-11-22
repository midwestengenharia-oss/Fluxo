
import React, { useState, useEffect, useMemo } from 'react';
import { Recurrence, DEFAULT_CATEGORIES, TransactionType, RecurrenceFrequency, UserSettings, Account, CreditCard } from '../types';
import { Calendar, Landmark, Wallet, CreditCard as CreditCardIcon } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import SegmentedControl from './ui/SegmentedControl';
import { getColorClasses } from '../styles/tokens';

interface RecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (r: Recurrence) => void;
  recurrenceToEdit?: Recurrence;
  customCategories: UserSettings['customCategories'];
  accounts: Account[];
  creditCards: CreditCard[];
}

const RecurrenceModal: React.FC<RecurrenceModalProps> = ({ isOpen, onClose, onSave, recurrenceToEdit, customCategories, accounts, creditCards }) => {
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
  const [startFrom, setStartFrom] = useState('');
  const [occurrenceCount, setOccurrenceCount] = useState<string>('');
  const [targetType, setTargetType] = useState<'account' | 'card'>('account');
  const [selectedTargetId, setSelectedTargetId] = useState('');

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

    // Só reseta se o modal acabou de abrir OU se a recorrência mudou
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
      // Carregar destino
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
    }
  }, [isOpen, recurrenceToEdit, spendableAccounts]);

  useEffect(() => {
    if (!recurrenceToEdit) {
      setCategory(activeCategories[0] || 'Outros');
    }
  }, [type]);

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

  // Garantir seleção de conta válida (excluir carteiras/investimento)
  useEffect(() => {
    if (targetType === 'account' && !spendableAccounts.find(a => a.id === selectedTargetId)) {
      setSelectedTargetId(spendableAccounts[0]?.id || '');
    }
  }, [targetType, spendableAccounts, selectedTargetId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTargetId) {
      alert("Selecione uma conta ou cartão de destino.");
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

  // Quando muda o tipo de destino, seleciona o primeiro item disponível
  const handleTargetTypeChange = (newType: 'account' | 'card') => {
    setTargetType(newType);
    if (newType === 'account') {
      setSelectedTargetId(spendableAccounts[0]?.id || '');
    } else {
      setSelectedTargetId(creditCards[0]?.id || '');
    }
  };

  const frequencyOptions = [
    { id: 'monthly', label: 'Mensal' },
    { id: 'daily', label: 'Diária' }
  ];

  const typeOptions = [
    { id: 'income', label: 'Entrada' },
    { id: 'expense', label: 'Saída' },
    { id: 'daily', label: 'Diário' },
    { id: 'economy', label: 'Economia' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={recurrenceToEdit ? 'Editar Regra' : 'Nova Regra Recorrente'}
      size="md"
      footer={
        <Button variant="primary" fullWidth onClick={handleSubmit}>
          Salvar Regra
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Frequency & Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Frequência</label>
            <SegmentedControl
              options={frequencyOptions}
              value={frequency}
              onChange={(val) => setFrequency(val as RecurrenceFrequency)}
              fullWidth
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Tipo</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as TransactionType)}
              className="block w-full px-4 py-2.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-xl outline-none text-sm font-medium"
            >
              {typeOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Value */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Valor</label>
          <div className="relative group">
            <span className="absolute left-3 top-3 text-slate-400 font-semibold group-focus-within:text-slate-800 transition-colors">R$</span>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-slate-900 rounded-xl outline-none font-bold text-slate-800 transition-colors"
              placeholder="0,00"
            />
          </div>
        </div>

        {/* Description */}
        <Input
          label="Descrição"
          type="text"
          required
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Ex: Aluguel, Investimento mensal..."
        />

        {/* Start Date */}
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

        {/* Destino: Conta ou Cartão */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Destino</label>

          {/* Tabs Conta/Cartão */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => handleTargetTypeChange('account')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                targetType === 'account'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Conta
            </button>
            <button
              type="button"
              onClick={() => handleTargetTypeChange('card')}
              disabled={type === 'income'}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                type === 'income'
                  ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100'
                  : targetType === 'card'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Cartão
            </button>
          </div>

          {/* Lista de Contas */}
          {targetType === 'account' && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {spendableAccounts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-2">Nenhuma conta cadastrada</p>
              ) : (
                spendableAccounts.map(acc => {
                  const colors = getColorClasses(acc.color);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedTargetId(acc.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        selectedTargetId === acc.id
                          ? `${colors.bg} ${colors.border}`
                          : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${colors.bgSolid} flex items-center justify-center`}>
                        {acc.type === 'checking' ? <Landmark size={16} className="text-white" /> : <Wallet size={16} className="text-white" />}
                      </div>
                      <span className="font-bold text-slate-700 text-sm">{acc.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Lista de Cartões */}
          {targetType === 'card' && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {creditCards.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-2">Nenhum cartão cadastrado</p>
              ) : (
                creditCards.map(card => {
                  const colors = getColorClasses(card.color);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedTargetId(card.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        selectedTargetId === card.id
                          ? `${colors.bg} ${colors.border}`
                          : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${colors.bgSolid} flex items-center justify-center`}>
                        <CreditCardIcon size={16} className="text-white" />
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-slate-700 text-sm block">{card.name}</span>
                        <span className="text-[10px] text-slate-400">Venc. dia {card.dueDay}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Categoria</label>
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
      </form>
    </Modal>
  );
};

export default RecurrenceModal;
