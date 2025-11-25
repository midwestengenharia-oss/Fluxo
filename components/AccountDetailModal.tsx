import React, { useMemo, useState } from 'react';
import { Account, Transaction, Recurrence } from '../types';
import { formatCurrency, formatDate } from '../utils/financeUtils';
import { X, TrendingUp, TrendingDown, Wallet, Landmark, RefreshCw } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { getColorClasses } from '../styles/tokens';
import EmptyState from './ui/EmptyState';

interface AccountDetailModalProps {
  account: Account | null;
  transactions: Transaction[];
  projectedTransactions?: Transaction[];
  recurrences: Recurrence[];
  onClose: () => void;
}

const AccountDetailModal: React.FC<AccountDetailModalProps> = ({ account, transactions, projectedTransactions = [], recurrences, onClose }) => {
  if (!account) return null;

  const [activeTab, setActiveTab] = useState<'statement' | 'recurrences'>('statement');
  const colorClasses = getColorClasses(account.color);
  const accTransactions = useMemo(() => {
    // Mostrar apenas movimentos confirmados, desconsiderando projeções/simulações para evitar itens excluídos ou desatualizados.
    const merged = [
      ...transactions.filter(t => !t.isSimulation && !t.isProjected),
      ...projectedTransactions.filter(t => !t.isSimulation && !t.isProjected),
    ];

    const byId = new Map<string, Transaction>();
    merged.forEach(t => {
      const key = t.id || `${t.date}-${t.amount}-${t.description}`;
      // Se houver colisão, mantém o primeiro confirmado (não simulation/projected)
      if (!byId.has(key)) {
        byId.set(key, t);
      }
    });

    const allowedStatuses = ['paid', 'recebido', 'realizado', 'investido'];

    return Array.from(byId.values())
      .filter(t => t.accountId === account.id)
      .filter(t => allowedStatuses.includes((t.status || '').toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, projectedTransactions, account.id]);
  const accRecurrences = useMemo(
    () => recurrences.filter(r => r.targetAccountId === account.id && r.active !== false),
    [recurrences, account.id]
  );

  // Calculate simple balance history
  const balanceHistory = [...accTransactions].reverse().reduce((acc: any[], t) => {
    const lastBal = acc.length > 0 ? acc[acc.length - 1].balance : account.initialBalance;
    const change = t.type === 'income' ? t.amount : -t.amount;
    acc.push({ date: t.date, balance: lastBal + change });
    return acc;
  }, []);

  const totalIn = accTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalOut = accTransactions.filter(t => t.type !== 'income').reduce((acc, t) => acc + t.amount, 0);
  const currentBalance = account.initialBalance + totalIn - totalOut;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white/80 backdrop-blur-2xl rounded-3xl w-full max-w-2xl shadow-[0_40px_100px_-60px_rgba(15,23,42,0.8)] overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header with Chart */}
        <div className={`${colorClasses.bg} p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/5 pointer-events-none" />
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/70 hover:bg-white rounded-full z-20 transition-colors shadow-sm">
            <X size={18} />
          </button>

          <div className="relative z-10 flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl bg-white ${colorClasses.text} flex items-center justify-center shadow-sm`}>
              {account.type === 'checking' ? <Landmark size={24} /> : <Wallet size={24} />}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-xl">{account.name}</h3>
              <p className="text-slate-500 text-sm capitalize">{account.type === 'checking' ? 'Conta Corrente' : 'Carteira'}</p>
            </div>
          </div>

          <div className="flex items-end justify-between mb-4 relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Saldo Projetado</p>
              <p className={`text-3xl font-bold font-mono ${colorClasses.textDark}`}>{formatCurrency(currentBalance)}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1"><TrendingUp size={10} /> Entradas</p>
                <p className="font-bold text-slate-700">{formatCurrency(totalIn)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-rose-600 uppercase flex items-center gap-1"><TrendingDown size={10} /> Saídas</p>
                <p className="font-bold text-slate-700">{formatCurrency(totalOut)}</p>
              </div>
            </div>
          </div>

          {/* Mini Chart */}
          <div className="h-24 -mx-6 -mb-6 opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceHistory}>
                <defs>
                  <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="balance" stroke="#475569" fill="url(#colorBal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions / Recurrences */}
        <div className="flex-1 bg-white/90 p-6 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="flex items-center gap-4 mb-4 border-b border-slate-100">
            <button
              onClick={() => setActiveTab('statement')}
              className={`py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'statement' ? `${colorClasses.border} ${colorClasses.text}` : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Extrato
            </button>
            <button
              onClick={() => setActiveTab('recurrences')}
              className={`py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'recurrences' ? `${colorClasses.border} ${colorClasses.text}` : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Recorrências
            </button>
          </div>

          {activeTab === 'statement' && (
            <div className="space-y-3">
              {accTransactions.length === 0 ? (
                <EmptyState
                  icon={<Wallet size={32} />}
                  title="Nenhuma movimentação"
                  description="Ainda não há lançamentos registrados nesta conta."
                />
              ) : (
                accTransactions.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      <div>
                        <p className="font-bold text-slate-700 text-sm">{t.description}</p>
                        <p className="text-xs text-slate-400">{formatDate(t.date)} • {t.category}</p>
                      </div>
                    </div>
                    <span className={`font-mono font-bold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'recurrences' && (
            <div className="space-y-3">
              {accRecurrences.length === 0 ? (
                <EmptyState
                  icon={<RefreshCw size={32} />}
                  title="Nenhuma recorrência"
                  description="Não há regras recorrentes vinculadas a esta conta."
                />
              ) : (
                accRecurrences
                  .sort((a, b) => {
                    if (a.frequency === 'daily' && b.frequency !== 'daily') return -1;
                    if (b.frequency === 'daily' && a.frequency !== 'daily') return 1;
                    return (a.dayOfMonth ?? 31) - (b.dayOfMonth ?? 31);
                  })
                  .map(r => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <RefreshCw size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 text-sm">{r.description}</p>
                          <p className="text-[11px] text-slate-500">
                            {r.frequency === 'daily' ? 'Todo dia' : r.dayOfMonth ? `Todo mês no dia ${r.dayOfMonth}` : 'Mensal'} • {r.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-slate-800">{formatCurrency(r.amount)}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{r.type}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AccountDetailModal;
