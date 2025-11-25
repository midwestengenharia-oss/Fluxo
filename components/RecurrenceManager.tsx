
import React, { useState, useMemo } from 'react';
import { Recurrence, UserSettings, Account, CreditCard } from '../types';
import { formatCurrency } from '../utils/financeUtils';
import { Plus, Trash2, Edit2, RefreshCw, Sparkles, Calendar, ArrowUpRight, ArrowDownRight, Repeat, TrendingUp } from 'lucide-react';
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

  // Calcular totais mensais por tipo
  const monthlyTotals = useMemo(() => {
    return activeRecurrences.reduce((acc, rec) => {
      const monthly = rec.frequency === 'daily' ? rec.amount * 30 : rec.amount;

      switch(rec.type) {
        case 'income':
          acc.income += monthly;
          break;
        case 'expense':
          acc.expense += monthly;
          break;
        case 'daily':
          acc.daily += monthly;
          break;
        case 'economy':
          acc.economy += monthly;
          break;
      }
      return acc;
    }, { income: 0, expense: 0, daily: 0, economy: 0 });
  }, [activeRecurrences]);

  const totalInflow = monthlyTotals.income;
  const totalOutflow = monthlyTotals.expense + monthlyTotals.daily + monthlyTotals.economy;
  const netMonthly = totalInflow - totalOutflow;
  const totalRules = activeRecurrences.length;

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto animate-in fade-in duration-500">

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total de Regras */}
        <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-indigo-600/20 shadow-[0_8px_30px_-8px_rgba(79,70,229,0.15)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.25)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent pointer-events-none"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-100 rounded-xl shadow-sm">
                <Repeat size={18} className="text-indigo-700" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700/70">Regras Ativas</span>
            </div>
            <p className="text-3xl font-bold tracking-tight font-mono text-slate-800 mb-1">{totalRules}</p>
            <p className="text-xs text-slate-400">Automatizações configuradas</p>
          </div>
        </div>

        {/* Entradas Mensais */}
        <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-emerald-600/20 shadow-[0_8px_30px_-8px_rgba(5,150,105,0.15)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(5,150,105,0.25)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent pointer-events-none"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl shadow-sm">
                <ArrowUpRight size={18} className="text-emerald-700" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/70">Entradas/Mês</span>
            </div>
            <p className="text-3xl font-bold tracking-tight font-mono text-emerald-600 mb-1">{formatCurrency(totalInflow)}</p>
            <p className="text-xs text-slate-400">Receitas automáticas</p>
          </div>
        </div>

        {/* Saídas Mensais */}
        <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-rose-600/20 shadow-[0_8px_30px_-8px_rgba(244,63,94,0.15)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(244,63,94,0.25)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent pointer-events-none"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-100 rounded-xl shadow-sm">
                <ArrowDownRight size={18} className="text-rose-700" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700/70">Saídas/Mês</span>
            </div>
            <p className="text-3xl font-bold tracking-tight font-mono text-rose-600 mb-1">{formatCurrency(totalOutflow)}</p>
            <p className="text-xs text-slate-400">Despesas automáticas</p>
          </div>
        </div>

        {/* Impacto Líquido */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 rounded-2xl p-6 border border-white/10 shadow-[0_8px_30px_-8px_rgba(15,23,42,0.4)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(99,102,241,0.4)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl shadow-sm">
                <TrendingUp size={18} className="text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Impacto Mensal</span>
            </div>
            <p className={`text-3xl font-bold tracking-tight font-mono mb-1 ${netMonthly >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(netMonthly)}
            </p>
            <p className="text-xs text-white/50">{netMonthly >= 0 ? 'Positivo' : 'Negativo'} no fluxo de caixa</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Regras Configuradas</h3>
          <p className="text-slate-500 text-sm">Gerencie suas automatizações financeiras</p>
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
        onDelete={onDeleteRecurrence}
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
