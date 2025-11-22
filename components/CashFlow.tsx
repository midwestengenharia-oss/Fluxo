import React, { useState, useMemo } from 'react';
import { DailyBalance, Transaction, CreditCard, Account } from '../types';
import { formatCurrency } from '../utils/financeUtils';
import { ChevronLeft, ChevronRight, ArrowDownRight, ArrowUpRight, Wallet, Plus, Calendar, Sparkles, CreditCard as CreditCardIcon, Building2, Circle, ExternalLink } from 'lucide-react';
import { ComposedChart, Area, XAxis, Tooltip, ResponsiveContainer, Bar, CartesianGrid } from 'recharts';
import Card from './ui/Card';
import Button from './ui/Button';
import { StatusBadge, SimulationBadge } from './ui/Badge';
import EmptyState from './ui/EmptyState';
import { transactionTypeColors, colorMap, ColorName } from '../styles/tokens';

interface CashFlowProps {
  timeline: DailyBalance[];
  creditCards: CreditCard[];
  accounts: Account[];
  onSelectDay: (date: string) => void;
  onEditTransaction: (t: Transaction) => void;
  onViewCard: (cardId: string) => void;
}

const formatMonthYear = (date: Date) => {
  const raw = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
  return raw.replace(' de ', ' ').replace(' De ', ' ').replace(/\b\w/, (c) => c.toUpperCase());
};

// Ordem de prioridade dos tipos de transação
const typeOrder: Record<string, number> = {
  income: 0,
  economy: 1,
  expense: 2,
  daily: 3,
};

const CashFlow: React.FC<CashFlowProps> = ({ timeline, creditCards, accounts, onSelectDay, onEditTransaction, onViewCard }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Helpers para obter nomes
  const getCardName = (cardId: string) => creditCards.find(c => c.id === cardId)?.name || 'Cartão';
  const getCardColor = (cardId: string) => creditCards.find(c => c.id === cardId)?.color || 'slate';
  const getAccountName = (accountId: string) => accounts.find(a => a.id === accountId)?.name || 'Conta';
  const getAccountColor = (accountId: string) => accounts.find(a => a.id === accountId)?.color || 'slate';

  // Ordenar transações: income → economy → expense → daily, cartões por último
  const sortTransactions = (transactions: Transaction[]) => {
    return [...transactions].sort((a, b) => {
      // Cartões sempre por último
      if (a.cardId && !b.cardId) return 1;
      if (!a.cardId && b.cardId) return -1;

      // Se ambos são cartão, agrupa por cartão
      if (a.cardId && b.cardId) {
        if (a.cardId !== b.cardId) return a.cardId.localeCompare(b.cardId);
        return (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99);
      }

      // Ordenar por tipo
      return (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99);
    });
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
    setExpandedDay(null);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
    setExpandedDay(null);
  };

  const currentMonthName = formatMonthYear(currentDate);

  const displayedDays = useMemo(() => {
    return timeline.filter(day => {
      const d = new Date(day.date + 'T00:00:00');
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  }, [timeline, currentDate]);

  const chartData = useMemo(() => {
    return displayedDays.map(day => ({
      day: parseInt(day.date.split('-')[2]),
      balance: day.endBalance,
      income: day.totalIncome,
      outflow: day.totalExpense + day.totalDaily,
      economy: day.totalEconomy,
    }));
  }, [displayedDays]);

  const monthlyTotals = useMemo(() => {
    return displayedDays.reduce((acc, day) => ({
      income: acc.income + day.totalIncome,
      expense: acc.expense + day.totalExpense + day.totalDaily,
      economy: acc.economy + day.totalEconomy,
    }), { income: 0, expense: 0, economy: 0 });
  }, [displayedDays]);

  const monthEndBalance = displayedDays.length > 0 ? displayedDays[displayedDays.length - 1].endBalance : 0;

  const toggleDay = (date: string) => {
    setExpandedDay(expandedDay === date ? null : date);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Agrupa transações de cartão por cardId para mostrar separador
  const getCardTransactionGroups = (transactions: Transaction[]) => {
    const cardIds = new Set(transactions.filter(t => t.cardId).map(t => t.cardId!));
    return Array.from(cardIds);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">

      {/* Monthly Summary Header */}
      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-50">
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <button onClick={handlePrevMonth} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ChevronLeft/></button>
              <button onClick={handleNextMonth} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ChevronRight/></button>
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <Sparkles size={14}/> Timeline
              </div>
              <h2 className="text-2xl font-bold text-slate-800 capitalize mt-2">{currentMonthName}</h2>
              <p className="text-sm text-slate-400 font-medium">Visão consolidada do período</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm flex-wrap justify-end">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Entradas</p>
              <p className="text-emerald-600 font-bold">{formatCurrency(monthlyTotals.income)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Saídas</p>
              <p className="text-rose-600 font-bold">-{formatCurrency(monthlyTotals.expense)}</p>
            </div>
            <div className="pl-6 border-l border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Saldo Final</p>
              <p className={`font-bold font-mono ${monthEndBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>{formatCurrency(monthEndBalance)}</p>
            </div>
          </div>
        </div>

        {/* Projection Chart */}
        <div className="h-44 bg-slate-50/70 relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="day" hide />
              <Tooltip
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)'}}
                formatter={(val: number, name: string) => [formatCurrency(val), name === 'balance' ? 'Saldo' : name === 'income' ? 'Entradas' : 'Saídas']}
                labelFormatter={(label) => `Dia ${label}`}
              />
              <Bar dataKey="income" fill="#10b981" radius={[6,6,0,0]} barSize={10} />
              <Bar dataKey="outflow" fill="#f97316" radius={[6,6,0,0]} barSize={10} />
              <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#balanceGradient)" />
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
          <div className="absolute bottom-2 left-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Projeção de Saldo Diário</div>
        </div>
      </Card>

      {/* Timeline */}
      <Card variant="default" padding="none" className="overflow-hidden">
        {displayedDays.length === 0 ? (
          <EmptyState
            icon={<Calendar size={32} />}
            title="Nenhum dado neste mês"
            description="Não há lançamentos para exibir neste período."
          />
        ) : (
          displayedDays.map((day) => {
            const isExpanded = expandedDay === day.date;
            const isToday = day.date === todayStr;
            const dateObj = new Date(day.date + 'T00:00:00');
            const sortedTransactions = sortTransactions(day.transactions);
            const hasTransactions = day.transactions.length > 0;
            const cardIds = getCardTransactionGroups(day.transactions);

            // Agrupa totais por cartão
            const cardTotals = cardIds.reduce((acc, cardId) => {
              acc[cardId] = sortedTransactions
                .filter(t => t.cardId === cardId)
                .reduce((sum, t) => sum + t.amount, 0);
              return acc;
            }, {} as Record<string, number>);

            return (
              <div key={day.date} className="border-b border-slate-100 last:border-0">
                {/* Linha compacta do dia */}
                <div
                  onClick={() => toggleDay(day.date)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                    isToday ? 'bg-emerald-50/50 hover:bg-emerald-50' :
                    isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* Data */}
                  <div className="flex items-center gap-3 min-w-[100px]">
                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold ${isToday ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <span className="text-base leading-none">{dateObj.getDate()}</span>
                      <span className="text-[9px] uppercase">{dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.','')}</span>
                    </div>
                  </div>

                  {/* Resumo: Entradas | Saídas | Diário */}
                  <div className="flex items-center gap-4 text-xs">
                    {day.totalIncome > 0 && (
                      <div className="text-center">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Entrada</p>
                        <p className="text-emerald-600 font-mono font-bold">+{formatCurrency(day.totalIncome)}</p>
                      </div>
                    )}
                    {day.totalExpense > 0 && (
                      <div className="text-center">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Saída</p>
                        <p className="text-rose-600 font-mono font-bold">-{formatCurrency(day.totalExpense)}</p>
                      </div>
                    )}
                    {day.totalDaily > 0 && (
                      <div className="text-center">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Diário</p>
                        <p className="text-amber-600 font-mono font-bold">-{formatCurrency(day.totalDaily)}</p>
                      </div>
                    )}
                    {day.totalEconomy > 0 && (
                      <div className="text-center">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Economia</p>
                        <p className="text-blue-600 font-mono font-bold">-{formatCurrency(day.totalEconomy)}</p>
                      </div>
                    )}
                    {!hasTransactions && <span className="text-slate-300 text-xs">—</span>}
                  </div>

                  {/* Saldo */}
                  <div className="text-right min-w-[90px]">
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Saldo</p>
                    <p className={`font-mono font-bold text-sm ${day.endBalance < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {formatCurrency(day.endBalance)}
                    </p>
                  </div>
                </div>

                {/* Lista de transações expandida */}
                {isExpanded && (
                  <div className="bg-white border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-end px-4 py-2 border-b border-slate-50">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Plus size={14} />}
                        onClick={(e) => { e.stopPropagation(); onSelectDay(day.date); }}
                      >
                        Adicionar
                      </Button>
                    </div>

                    {/* Transações ordenadas */}
                    <div className="divide-y divide-slate-50/80">
                      {sortedTransactions.map((t, idx) => {
                        const typeColors = transactionTypeColors[t.type];
                        const prevTransaction = idx > 0 ? sortedTransactions[idx - 1] : null;
                        const isFirstOfCard = t.cardId && (!prevTransaction || prevTransaction.cardId !== t.cardId);
                        const cardColor = t.cardId ? getCardColor(t.cardId) : null;
                        const cardColorClasses = cardColor ? colorMap[cardColor as ColorName] || colorMap.slate : null;

                        return (
                          <React.Fragment key={t.id}>
                            {/* Separador de cartão com link para fatura */}
                            {isFirstOfCard && t.cardId && (
                              <div className={`flex items-center justify-between px-4 py-2 ${cardColorClasses?.bg || 'bg-slate-50'}`}>
                                <div className="flex items-center gap-2">
                                  <CreditCardIcon size={14} className={cardColorClasses?.text || 'text-slate-500'} />
                                  <span className={`text-xs font-bold ${cardColorClasses?.textDark || 'text-slate-600'}`}>
                                    {getCardName(t.cardId)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {sortedTransactions.filter(st => st.cardId === t.cardId).length} itens
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onViewCard(t.cardId!); }}
                                  className={`flex items-center gap-1 text-[10px] font-bold ${cardColorClasses?.text || 'text-slate-500'} hover:underline`}
                                >
                                  Ver fatura <ExternalLink size={10} />
                                </button>
                              </div>
                            )}

                            {/* Linha da transação - Layout denso */}
                            <div
                              onClick={(e) => { e.stopPropagation(); onEditTransaction(t); }}
                              className={`grid grid-cols-[auto,1fr,auto,auto,auto,auto] items-center gap-3 px-4 py-2 hover:bg-slate-50/80 cursor-pointer transition-all group ${
                                t.cardId ? 'pl-8' : ''
                              }`}
                            >
                              {/* Indicador de tipo (borda colorida) */}
                              <div className={`w-1 h-6 rounded-full ${typeColors.bgSolid}`} />

                              {/* Descrição + ícone pequeno */}
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${typeColors.bg} ${typeColors.text} flex-shrink-0`}>
                                  {t.type === 'income' ? <ArrowUpRight size={12} strokeWidth={2.5} /> :
                                    t.type === 'economy' ? <Wallet size={12} strokeWidth={2.5} /> :
                                    <ArrowDownRight size={12} strokeWidth={2.5} />}
                                </div>
                                <span className="font-semibold text-slate-700 text-sm truncate">{t.description}</span>
                                {t.installmentCurrent && t.installmentTotal && (
                                  <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">
                                    {t.installmentCurrent}/{t.installmentTotal}
                                  </span>
                                )}
                              </div>

                              {/* Categoria */}
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate max-w-[80px]">
                                {t.category}
                              </span>

                              {/* Origem (Conta ou Cartão) */}
                              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                {t.cardId ? (
                                  <>
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: cardColorClasses?.bgSolid ? undefined : '#64748b' }}
                                    />
                                  </>
                                ) : t.accountId ? (
                                  <>
                                    <Building2 size={10} className="text-slate-400" />
                                    <span className="font-medium truncate max-w-[60px]">{getAccountName(t.accountId)}</span>
                                  </>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </div>

                              {/* Status */}
                              <div className="flex items-center gap-1">
                                <Circle
                                  size={6}
                                  fill={t.status === 'paid' ? '#10b981' : '#f59e0b'}
                                  className={t.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}
                                />
                                {t.isSimulation && (
                                  <Sparkles size={10} className="text-violet-500" />
                                )}
                              </div>

                              {/* Valor */}
                              <p className={`font-mono font-bold text-sm text-right min-w-[90px] ${
                                t.type === 'income' ? 'text-emerald-600' :
                                t.type === 'economy' ? 'text-blue-600' :
                                typeColors.text
                              }`}>
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                              </p>
                            </div>
                          </React.Fragment>
                        );
                      })}

                      {!hasTransactions && (
                        <div className="py-6 text-center text-slate-400 text-sm">Nenhum lançamento neste dia.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
};

export default CashFlow;
