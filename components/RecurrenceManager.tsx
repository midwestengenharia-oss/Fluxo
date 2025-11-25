
import React, { useState } from 'react';
import { Recurrence, UserSettings, Account, CreditCard } from '../types';
import { formatCurrency } from '../utils/financeUtils';
import { Plus, Trash2, Edit2, RefreshCw, Sparkles, Calendar } from 'lucide-react';
import RecurrenceModal from './RecurrenceModal';
import Card from './ui/Card';
import Button from './ui/Button';
import { ActionIcon } from './ui/IconButton';
import { TransactionBadge, SimulationBadge } from './ui/Badge';
import EmptyState from './ui/EmptyState';

interface RecurrenceManagerProps {
  recurrences: Recurrence[];
  onAddRecurrence: (r: Recurrence) => void;
  onDeleteRecurrence: (id: string) => void;
  customCategories: UserSettings['customCategories'];
  onAddCategory: (type: Recurrence['type'], label: string) => void;
  accounts: Account[];
  creditCards: CreditCard[];
}

const RecurrenceManager: React.FC<RecurrenceManagerProps> = ({
  recurrences,
  onAddRecurrence,
  onDeleteRecurrence,
  customCategories,
  onAddCategory,
  accounts,
  creditCards
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recurrenceToEdit, setRecurrenceToEdit] = useState<Recurrence | undefined>(undefined);

  const handleSave = (r: Recurrence) => {
    // Sempre usa onAddRecurrence - o App.tsx faz UPDATE se o ID já existe
    onAddRecurrence(r);
    setRecurrenceToEdit(undefined);
  };

  const handleEdit = (r: Recurrence) => {
    setRecurrenceToEdit(r);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setRecurrenceToEdit(undefined);
    setIsModalOpen(true);
  };

  const activeRecurrences = recurrences.filter(r => r.active !== false);
  const sortedRecurrences = [...activeRecurrences].sort((a, b) => {
    if (a.frequency === 'daily' && b.frequency !== 'daily') return -1;
    if (a.frequency !== 'daily' && b.frequency === 'daily') return 1;
    return a.dayOfMonth - b.dayOfMonth;
  });

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto animate-in fade-in duration-500">

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Regras Recorrentes</h3>
          <p className="text-slate-500 text-sm">Automatize entradas, saídas e investimentos.</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={handleAddNew}
        >
          Nova Regra
        </Button>
      </div>

      <Card variant="default" padding="none" className="overflow-hidden">
        {sortedRecurrences.length === 0 ? (
          <EmptyState
            icon={<Calendar size={32} />}
            title="Nenhuma regra cadastrada"
            description="Crie regras recorrentes para automatizar seus lançamentos."
            action={{
              label: 'Nova Regra',
              onClick: handleAddNew,
              icon: <Plus size={16} />
            }}
          />
        ) : (
          <table className="w-full text-left border-collapse compact-table">
            <thead>
              <tr>
                <th>Freq. / Dia</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th className="text-right">Valor</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecurrences.map(rec => {
                const isSimulated = rec.id.startsWith('sim-');
                return (
                  <tr key={rec.id} className={isSimulated ? 'bg-purple-50/50' : ''}>
                    <td className="font-mono text-slate-600">
                      {rec.frequency === 'daily'
                        ? <span className="inline-flex items-center gap-1 text-indigo-600 font-bold"><RefreshCw size={12}/> Todo dia</span>
                        : `Dia ${rec.dayOfMonth}`}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <TransactionBadge type={rec.type} size="sm" />
                        {isSimulated && <SimulationBadge />}
                      </div>
                    </td>
                    <td className="font-medium text-slate-800">{rec.description}</td>
                    <td className="text-slate-500 text-sm">{rec.category}</td>
                    <td className="text-right font-mono font-bold text-slate-700">
                      {formatCurrency(rec.amount)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionIcon
                          icon={<Edit2 size={16} />}
                          onClick={() => handleEdit(rec)}
                          color="primary"
                        />
                        <ActionIcon
                          icon={<Trash2 size={16} />}
                          onClick={() => {
                            if (window.confirm('Deseja remover esta recorrência? Isso para projeções futuras, mas mantém o histórico.')) {
                              onDeleteRecurrence(rec.id);
                            }
                          }}
                          color="danger"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <RecurrenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        recurrenceToEdit={recurrenceToEdit}
        customCategories={customCategories}
        onAddCategory={onAddCategory}
        accounts={accounts}
        creditCards={creditCards}
      />
    </div>
  );
};

export default RecurrenceManager;
