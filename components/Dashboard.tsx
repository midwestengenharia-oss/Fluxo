import React, { useMemo, useState } from 'react';
import { TrendingUp, Wallet, Activity, Clock, Target, Flame, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, CheckCircle2, BarChart3, PiggyBank, Percent, TrendingDown, CreditCard } from 'lucide-react';
import { DailyBalance, Account, UserSettings, Transaction, CreditCard as CreditCardType } from '../types';
import { formatCurrency, groupDataByCategory, groupDailyToMonthly, getLocalDateString, getCardInvoices } from '../utils/financeUtils';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card, { CardHeader } from './ui/Card';

interface DashboardProps {
  timeline: DailyBalance[];
  accounts: Account[];
  settings: UserSettings;
  transactions: Transaction[];
  creditCards: CreditCardType[];
}

const CHART_COLORS = [
  '#10b981',
  '#06b6d4',
  '#6366f1',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#0ea5e9',
  '#84cc16',
  '#f97316',
  '#22c55e',
  '#3b82f6',
  '#e11d48',
];

const Dashboard: React.FC<DashboardProps> = ({ timeline, accounts, transactions, creditCards }) => {
  const [categoryMonth, setCategoryMonth] = useState(new Date());
  const [chartCursorKey, setChartCursorKey] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const monthKeyFromDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const categoryMonthKey = useMemo(() => monthKeyFromDate(categoryMonth), [categoryMonth]);
  // chartCursorKey é uma string (YYYY-MM) para evitar problemas de timezone

  const categoryMonthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
      .format(categoryMonth)
      .replace(' de ', ' ')
      .replace(/\b\w/, (c) => c.toUpperCase());
  }, [categoryMonth]);

  const changeCategoryMonth = (delta: number) => {
    setCategoryMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };
  const changeChartWindow = (delta: number) => {
    setChartCursorKey(prevKey => {
      if (monthlyData.length === 0) return prevKey;
      const currentIdx = monthlyData.findIndex(m => m.name === prevKey);
      const safeIdx = currentIdx >= 0 ? currentIdx : 0;
      const nextIdx = Math.min(Math.max(safeIdx + delta, 0), monthlyData.length - 1);
      return monthlyData[nextIdx].name;
    });
  };

  const todayStr = getLocalDateString();

  const calculateRealBalance = (account: Account) => {
    const accountTransactions = transactions.filter(t =>
      t.accountId === account.id &&
      t.date <= todayStr
    );

    const transactionsTotal = accountTransactions.reduce((sum, t) => {
      if (t.type === 'income') return sum + t.amount;
      if (t.type === 'expense' || t.type === 'daily' || t.type === 'economy') return sum - t.amount;
      return sum;
    }, 0);

    return account.initialBalance + transactionsTotal;
  };

  const cardDebts = transactions
    .filter(t => t.cardId && t.date <= todayStr)
    .reduce((sum, t) => {
      const sign = t.type === 'income' ? -1 : 1;
      return sum + sign * t.amount;
    }, 0);

  const todayIndex = timeline.findIndex(d => d.date === todayStr);
  const monthKeyToday = todayStr.slice(0, 7);
  const monthDays = timeline.filter(d => d.date.startsWith(monthKeyToday));

  const currentBalance = monthDays[0]?.startBalance ?? (timeline[0]?.startBalance || 0);
  const endOfMonth = monthDays[monthDays.length - 1]?.endBalance ?? (timeline[timeline.length - 1]?.endBalance ?? 0);

  const liquidBalance = accounts
    .filter(a => a.type !== 'investment')
    .reduce((acc, c) => acc + calculateRealBalance(c), 0) - cardDebts;
  const investBalance = accounts.filter(a => a.type === 'investment').reduce((acc, c) => acc + calculateRealBalance(c), 0);
  const totalNetWorth = liquidBalance + investBalance;
  const projectionDelta = endOfMonth - currentBalance;

  const totalIncome = monthDays.reduce((acc, t) => acc + t.totalIncome, 0);
  const totalExpense = monthDays.reduce((acc, t) => acc + t.totalExpense + t.totalDaily + t.totalEconomy, 0);
  const monthlyNet = totalIncome - totalExpense;
  const burnRate = totalIncome > 0 ? totalExpense / totalIncome : 0;
  const totalEconomyMonth = monthDays.reduce((acc, t) => acc + t.totalEconomy, 0);
  const savingsRate = totalIncome > 0 ? (totalEconomyMonth / totalIncome) * 100 : 0;

  const monthlyData = useMemo(() => {
    return groupDailyToMonthly(timeline).map(m => ({
      ...m,
      monthName: new Date(m.name + '-02').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
    }));
  }, [timeline]);

  const formatMonthKeyLabel = (key: string) => {
    const date = new Date(key + '-02');
    const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
      .format(date)
      .replace('.', '')
      .toUpperCase();
    const year = date.getFullYear().toString().slice(-2);
    return `${month} ${year}`;
  };

  const chartIndex = useMemo(() => {
    let idx = monthlyData.findIndex(m => m.name === chartCursorKey);
    if (idx === -1) {
      const greater = monthlyData.findIndex(m => m.name > chartCursorKey);
      idx = greater === -1 ? monthlyData.length - 1 : greater;
    }
    return Math.max(0, idx);
  }, [monthlyData, chartCursorKey]);

  // Janela de 6 meses que desliza um a um; cursor aponta para o mês à direita da janela
  const startIndex = Math.max(0, chartIndex - 5);
  const monthlyChartData = monthlyData.slice(startIndex, startIndex + 6);
  const rangeLabel = monthlyChartData.length
    ? `${formatMonthKeyLabel(monthlyChartData[0].name)} - ${formatMonthKeyLabel(monthlyChartData[monthlyChartData.length - 1].name)}`
    : 'Sem dados';

  const avgMonthlyExpense = monthlyChartData.reduce((acc, m) => acc + m.expense, 0) / (monthlyChartData.length || 1);

  // Reserva de Emergência: quantos meses o patrimônio (ou economias) cobre de despesas
  const emergencyReserveMonths = avgMonthlyExpense > 0 ? totalNetWorth / avgMonthlyExpense : 999;
  const emergencyReserveStatus = emergencyReserveMonths >= 6 ? 'safe' : emergencyReserveMonths >= 3 ? 'warning' : 'danger';

  const mergedTransactions = useMemo(() => {
    const seen = new Set<string>();
    const combined = [...transactions];
    combined.forEach(t => seen.add(t.id || `${t.date}-${t.amount}-${t.description}-${t.type}`));
    timeline.forEach(day => {
      day.transactions.forEach(tx => {
        const key = tx.id || `${tx.date}-${tx.amount}-${tx.description}-${tx.type}`;
        if (!seen.has(key)) {
          combined.push(tx);
          seen.add(key);
        }
      });
    });
    return combined;
  }, [transactions, timeline]);

  const cardInvoices = useMemo(() => {
    if (!creditCards || creditCards.length === 0) return [];
    const txs = mergedTransactions.filter(t => t.cardId);
    const invoices: Array<{ card: CreditCardType } & ReturnType<typeof getCardInvoices>[number]> = [];

    creditCards.forEach(card => {
      const cardTxs = txs.filter(t => t.cardId === card.id);
      const invs = getCardInvoices(card, cardTxs);
      invs.forEach(inv => invoices.push({ ...inv, card }));
    });

    return invoices.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [creditCards, mergedTransactions]);

  const formatShortDate = (dateStr: string | undefined) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y.slice(-2)}`;
  };

  const cardSummaries = useMemo(() => {
    if (!creditCards || creditCards.length === 0) return [];
    return creditCards.map(card => {
      const history = cardInvoices.filter(inv => inv.card.id === card.id);
      if (history.length === 0) return null;
      const upcoming = history.find(inv => inv.status !== 'closed' && inv.dueDate >= todayStr) ||
        history.find(inv => inv.status !== 'closed') ||
        history[history.length - 1];
      if (!upcoming) return null;

      const limitUsed = upcoming.amount;
      const limitPct = card.limit ? (limitUsed / card.limit) * 100 : 0;

      const futureInstallments = mergedTransactions.filter(t =>
        t.cardId === card.id &&
        t.installmentTotal && t.installmentCurrent &&
        t.installmentCurrent < t.installmentTotal &&
        t.date > upcoming.dueDate
      ).reduce((sum, t) => sum + t.amount, 0);

      const last3 = history.slice(-3);
      const avg3 = last3.length ? last3.reduce((s, i) => s + i.amount, 0) / last3.length : null;
      const deltaVsAvg = avg3 && avg3 > 0 ? ((upcoming.amount - avg3) / avg3) * 100 : null;

      const dueDate = new Date(upcoming.dueDate + 'T00:00:00');
      const now = new Date(todayStr + 'T00:00:00');
      const daysToDue = Math.max(0, Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      // Calcular dias decorridos baseado em purchaseDate real das transações
      const invoiceTxs = mergedTransactions.filter(t =>
        t.cardId === card.id &&
        t.date === upcoming.dueDate
      );

      let daysElapsed = 1;
      if (invoiceTxs.length > 0) {
        // Pegar a compra mais antiga (menor purchaseDate)
        const purchaseDates = invoiceTxs
          .map(t => t.purchaseDate || t.date)
          .filter(Boolean)
          .sort();

        if (purchaseDates.length > 0) {
          const oldestPurchase = new Date(purchaseDates[0] + 'T00:00:00');
          daysElapsed = Math.max(1, Math.ceil((now.getTime() - oldestPurchase.getTime()) / (1000 * 60 * 60 * 24)));
        }
      }

      const dailyPace = limitUsed / daysElapsed;
      const safeDaily = card.limit ? Math.max(0, (card.limit - limitUsed) / Math.max(1, daysToDue || 1)) : null;

      const alert =
        limitPct >= 90 ? 'Risco de estourar o limite neste ciclo' :
        (deltaVsAvg !== null && deltaVsAvg > 20 ? 'Fatura acima da média dos últimos meses' :
        (safeDaily !== null && dailyPace > safeDaily ? 'Ritmo de gastos acima do limite até o vencimento' : null));

      return {
        card,
        invoice: upcoming,
        limitUsed,
        limitPct,
        futureInstallments,
        deltaVsAvg,
        daysToDue,
        dailyPace,
        safeDaily,
        alert,
      };
    }).filter(Boolean) as Array<{
      card: CreditCardType;
      invoice: ReturnType<typeof getCardInvoices>[number];
      limitUsed: number;
      limitPct: number;
      futureInstallments: number;
      deltaVsAvg: number | null;
      daysToDue: number;
      dailyPace: number;
      safeDaily: number | null;
      alert: string | null;
    }>;
  }, [cardInvoices, creditCards, mergedTransactions, todayStr]);

  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const totalUpcomingAmount = useMemo(() => {
    return cardSummaries.reduce((sum, c) => sum + c.invoice.amount, 0);
  }, [cardSummaries]);

  const currentMonthExpenses = useMemo(() => {
    return mergedTransactions.filter(t => {
      if (!t.date?.startsWith(categoryMonthKey)) return false;
      return t.type === 'expense' || t.type === 'daily' || t.type === 'economy';
    });
  }, [mergedTransactions, categoryMonthKey]);
  const expenseByCategory = useMemo(() => groupDataByCategory(currentMonthExpenses, 'expense'), [currentMonthExpenses]);
  const topExpenseCategories = useMemo(() => expenseByCategory.slice(0, 10), [expenseByCategory]);

  const previousMonthKey = (() => {
    const d = new Date(todayStr + 'T00:00:00');
    d.setMonth(d.getMonth() - 1);
    return monthKeyFromDate(d);
  })();

  const isOutflow = (t: Transaction) => t.type === 'expense' || t.type === 'daily' || t.type === 'economy';

  const currentMonthTxs = mergedTransactions.filter(t => t.date?.startsWith(monthKeyToday));
  const plannedOut = currentMonthTxs.filter(isOutflow).reduce((sum, t) => sum + t.amount, 0);
  const executedOut = currentMonthTxs
    .filter(t => isOutflow(t) && !t.isProjected && t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);
  const executionRate = plannedOut > 0 ? (executedOut / plannedOut) * 100 : 0;

  // Calcular ritmo esperado baseado no dia do mês
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const expectedExecutionRate = (currentDay / daysInMonth) * 100;
  const executionPace = executionRate - expectedExecutionRate; // Positivo = acima do ritmo, Negativo = abaixo

  const currentMonthSummary = monthlyData.find(m => m.name === monthKeyToday);
  const previousMonthSummary = monthlyData.find(m => m.name === previousMonthKey);

  // Performance M/M: comparar saldo líquido (receita - despesa)
  const currentMonthNet = (currentMonthSummary?.income || 0) - (currentMonthSummary?.expense || 0);
  const previousMonthNet = (previousMonthSummary?.income || 0) - (previousMonthSummary?.expense || 0);
  const netDelta = currentMonthNet - previousMonthNet;
  const netDeltaPercent = previousMonthNet !== 0 ? (netDelta / Math.abs(previousMonthNet)) * 100 : null;

  // Insights e Alertas - Análises que NÃO repetem dados dos cards
  const insights: Array<{ type: 'success' | 'warning' | 'danger', message: string }> = [];

  // Análise de tendência: comparar últimos 3 meses
  const last3Months = monthlyData.slice(-3);
  if (last3Months.length === 3) {
    const trendBalances = last3Months.map(m => m.income - m.expense);
    const isImproving = trendBalances[2] > trendBalances[1] && trendBalances[1] > trendBalances[0];
    const isDeclining = trendBalances[2] < trendBalances[1] && trendBalances[1] < trendBalances[0];

    if (isImproving) {
      insights.push({ type: 'success', message: 'Tendência positiva! Seus resultados melhoraram nos últimos 3 meses consecutivos' });
    } else if (isDeclining) {
      insights.push({ type: 'danger', message: 'Alerta de tendência! Seus resultados pioraram nos últimos 3 meses consecutivos' });
    }
  }

  // Análise de volatilidade de gastos
  if (monthlyChartData.length >= 3) {
    const expenses = monthlyChartData.map(m => m.expense);
    const avgExpense = expenses.reduce((a, b) => a + b, 0) / expenses.length;
    const variance = expenses.reduce((sum, exp) => sum + Math.pow(exp - avgExpense, 2), 0) / expenses.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / avgExpense) * 100;

    if (coefficientOfVariation > 30) {
      insights.push({ type: 'warning', message: 'Seus gastos variam muito entre os meses. Considere criar um orçamento mais consistente' });
    } else if (coefficientOfVariation < 15) {
      insights.push({ type: 'success', message: 'Gastos estáveis! Você mantém boa previsibilidade no seu orçamento mensal' });
    }
  }

  // Análise de sustentabilidade: projeção se continuar no ritmo atual
  if (projectionDelta < 0 && liquidBalance > 0) {
    const monthsUntilZero = liquidBalance / Math.abs(projectionDelta);
    if (monthsUntilZero <= 3) {
      insights.push({ type: 'danger', message: `Atenção crítica! No ritmo atual, seu saldo zeraria em ${monthsUntilZero.toFixed(1)} meses` });
    } else if (monthsUntilZero <= 6) {
      insights.push({ type: 'warning', message: `Cuidado! No ritmo atual, você tem ${monthsUntilZero.toFixed(0)} meses de sustentabilidade` });
    }
  }

  // Análise comparativa: sua economia vs ideal
  const idealSavingsRate = 20;
  const savingsGap = idealSavingsRate - savingsRate;
  if (savingsGap > 15 && totalIncome > 0) {
    const missingAmount = (totalIncome * savingsGap) / 100;
    insights.push({ type: 'warning', message: `Para atingir taxa ideal de economia (20%), economize mais ${formatCurrency(missingAmount)}/mês` });
  }

  // Análise de eficiência: relação patrimônio/despesa mensal
  if (avgMonthlyExpense > 0) {
    const efficiencyRatio = totalNetWorth / avgMonthlyExpense;
    if (efficiencyRatio >= 24) {
      insights.push({ type: 'success', message: `Patrimônio sólido! Você tem ${(efficiencyRatio / 12).toFixed(1)} anos de despesas acumuladas` });
    }
  }

  // Análise de ritmo vs planejamento
  if (Math.abs(executionPace) > 20) {
    const daysRemaining = daysInMonth - currentDay;
    const projectedOverrun = (executionPace > 0) ? ((plannedOut - executedOut) * (1 - currentDay / daysInMonth)) : 0;
    if (executionPace > 20) {
      insights.push({ type: 'danger', message: `Risco de estouro! Você está gastando muito rápido. Ainda faltam ${daysRemaining} dias no mês` });
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Top level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Saldo Atual */}
        <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-emerald-600/20 shadow-[0_8px_30px_-8px_rgba(5,150,105,0.15)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(5,150,105,0.25)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent pointer-events-none"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl shadow-sm">
                <Wallet size={18} className="text-emerald-700" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/70">Saldo Atual</span>
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight font-mono text-slate-800 mb-1">{formatCurrency(liquidBalance)}</p>
            <p className="text-xs text-slate-400">Dinheiro disponível agora</p>
          </div>
        </div>

        {/* Patrimônio */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 rounded-2xl p-6 border border-white/10 shadow-[0_8px_30px_-8px_rgba(15,23,42,0.4)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(99,102,241,0.4)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl shadow-sm">
                <Activity size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Patrimônio</span>
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight font-mono text-white mb-1">{formatCurrency(totalNetWorth)}</p>
            <p className="text-xs text-white/50">Saldo + Investimentos</p>
          </div>
        </div>

        {/* Projeção */}
        <div className={`relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(37,99,235,0.25)] hover:-translate-y-1 ${
          projectionDelta >= 0 ? 'border-emerald-600/20 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.15)]' : 'border-rose-600/20 shadow-[0_8px_30px_-8px_rgba(244,63,94,0.15)]'
        }`}>
          <div className={`absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none ${
            projectionDelta >= 0 ? 'from-emerald-50/50' : 'from-rose-50/50'
          }`}></div>
          <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none ${
            projectionDelta >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
          }`}></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl shadow-sm ${
                projectionDelta >= 0 ? 'bg-emerald-100' : 'bg-rose-100'
              }`}>
                {projectionDelta >= 0 ? (
                  <TrendingUp size={18} className="text-emerald-700"/>
                ) : (
                  <TrendingDown size={18} className="text-rose-700"/>
                )}
              </div>
              <div className="flex-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  projectionDelta >= 0 ? 'text-emerald-700/70' : 'text-rose-700/70'
                }`}>Projeção 30 Dias</span>
              </div>
            </div>
            <p className={`text-3xl font-bold tracking-tight font-mono mb-1 ${
              projectionDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {formatCurrency(endOfMonth)}
            </p>
            <p className="text-xs text-slate-500">
              {projectionDelta >= 0 ? 'Tendência positiva este mês' : 'Tendência negativa este mês'}
              {' • Variação: '}{projectionDelta >= 0 ? '+' : ''}{formatCurrency(projectionDelta)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout: 2/3 Content + 1/3 Lateral Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: 2/3 width - Insights, Chart, Categories */}
        <div className="lg:col-span-2 space-y-6">

          {/* Insights */}
          {insights.length > 0 && (
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-indigo-100 rounded-xl shadow-sm flex-shrink-0">
                  <Activity size={20} className="text-indigo-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Insights e Alertas</h3>
                  <div className="space-y-2">
                    {insights.map((insight, idx) => (
                      <div key={idx} className={`flex items-start gap-2 text-sm p-2 rounded-lg ${
                        insight.type === 'success' ? 'bg-emerald-50 text-emerald-800' :
                        insight.type === 'warning' ? 'bg-amber-50 text-amber-800' :
                        'bg-rose-50 text-rose-800'
                      }`}>
                        <span className="flex-shrink-0 mt-0.5">
                          {insight.type === 'success' && '✓'}
                          {insight.type === 'warning' && '⚠'}
                          {insight.type === 'danger' && '⚠'}
                        </span>
                        <span className="flex-1 font-medium">{insight.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-indigo-600/10 shadow-[0_8px_30px_-8px_rgba(79,70,229,0.12)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.2)]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-transparent pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">Evolução Mensal</h3>
                  <p className="text-sm text-slate-500">Janela de 6 meses navegável</p>
                </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <button
                    onClick={() => changeChartWindow(-1)}
                    className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
                    aria-label="Retroceder um mês"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="tracking-wide">{rangeLabel}</span>
                  <button
                    onClick={() => changeChartWindow(1)}
                    className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
                    aria-label="Avançar um mês"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div className="flex gap-4 text-[11px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div>
                    <span className="text-slate-600">Entradas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-rose-500 rounded-full shadow-sm"></div>
                    <span className="text-slate-600">Saídas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-indigo-600 rounded-full shadow-sm"></div>
                    <span className="text-slate-600">Saldo</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-80 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyChartData} margin={{top: 10, right: 20, left: 0, bottom: 5}}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis
                    dataKey="monthName"
                    tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}}
                    axisLine={{stroke: '#e2e8f0'}}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 500}}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${val >= 0 ? '' : '-'}R$${Math.abs(val/1000).toFixed(0)}k`}
                    dx={-5}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      backgroundColor: 'rgba(255,255,255,0.98)',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)',
                      padding: '12px 16px'
                    }}
                    labelStyle={{fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px'}}
                    itemStyle={{fontSize: '13px', fontWeight: 600, padding: '2px 0'}}
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Bar dataKey="income" fill="url(#incomeGradient)" barSize={24} radius={[8,8,0,0]} />
                  <Bar dataKey="expense" fill="url(#expenseGradient)" barSize={24} radius={[8,8,0,0]} />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#4f46e5"
                    strokeWidth={3.5}
                    dot={{r: 5, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff'}}
                    activeDot={{r: 7, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff', filter: 'drop-shadow(0 4px 8px rgba(79,70,229,0.4))'}}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          </div>

          {/* Categories */}
          <Card variant="elevated">
            <CardHeader
              icon={<Target size={18} />}
              iconBg="bg-indigo-50 text-indigo-600"
              title="Categorias de Despesa"
              subtitle="Últimos meses"
            />
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-500">
                Mostrando despesas de <span className="font-semibold text-slate-700">{categoryMonthLabel}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => changeCategoryMonth(-1)}
                  className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => changeCategoryMonth(1)}
                  className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
                  aria-label="Próximo mês"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            {expenseByCategory.length === 0 ? (
              <p className="text-slate-400 text-sm">Sem dados suficientes.</p>
            ) : (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={topExpenseCategories} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                        {topExpenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {topExpenseCategories.map((cat, idx) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                        <p className="text-sm font-bold text-slate-700">{cat.name}</p>
                      </div>
                      <p className="font-mono text-sm font-bold text-slate-800">{formatCurrency(cat.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

        </div>

        {/* Right Column: 1/3 width - Lateral Cards */}
        <div className="flex flex-col gap-6">
          {/* Reserva de Emergência */}
          <div className={`relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border shadow-[0_8px_30px_-8px_rgba(245,158,11,0.15)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(245,158,11,0.25)] hover:-translate-y-1 ${
            emergencyReserveStatus === 'safe' ? 'border-emerald-600/20' :
            emergencyReserveStatus === 'warning' ? 'border-amber-600/20' :
            'border-rose-600/20'
          }`}>
            <div className={`absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none ${
              emergencyReserveStatus === 'safe' ? 'from-emerald-50/50' :
              emergencyReserveStatus === 'warning' ? 'from-amber-50/50' :
              'from-rose-50/50'
            }`}></div>
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
              emergencyReserveStatus === 'safe' ? 'bg-emerald-500/10' :
              emergencyReserveStatus === 'warning' ? 'bg-amber-500/10' :
              'bg-rose-500/10'
            }`}></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl shadow-sm ${
                  emergencyReserveStatus === 'safe' ? 'bg-emerald-100' :
                  emergencyReserveStatus === 'warning' ? 'bg-amber-100' :
                  'bg-rose-100'
                }`}>
                  <PiggyBank size={18} className={
                    emergencyReserveStatus === 'safe' ? 'text-emerald-700' :
                    emergencyReserveStatus === 'warning' ? 'text-amber-700' :
                    'text-rose-700'
                  }/>
                </div>
                <div className="flex-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    emergencyReserveStatus === 'safe' ? 'text-emerald-700/70' :
                    emergencyReserveStatus === 'warning' ? 'text-amber-700/70' :
                    'text-rose-700/70'
                  }`}>Reserva de Emergência</span>
                </div>
              </div>
              <p className={`text-3xl font-bold tracking-tight font-mono mb-1 ${
                emergencyReserveStatus === 'safe' ? 'text-emerald-700' :
                emergencyReserveStatus === 'warning' ? 'text-amber-700' :
                'text-rose-700'
              }`}>
                {emergencyReserveMonths > 24 ? '> 2 Anos' : `${emergencyReserveMonths.toFixed(1)} Meses`}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {emergencyReserveStatus === 'safe' && '✓ Reserva saudável (6+ meses)'}
                {emergencyReserveStatus === 'warning' && '⚠ Construa mais reserva (meta: 6 meses)'}
                {emergencyReserveStatus === 'danger' && '⚠ Atenção! Reserva baixa (<3 meses)'}
              </p>
            </div>
          </div>

          {/* Execução do Orçamento */}
          <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-sky-600/20 shadow-[0_8px_30px_-8px_rgba(14,165,233,0.15)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(14,165,233,0.25)] hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 to-transparent pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-sky-100 rounded-xl shadow-sm">
                  <CheckCircle2 size={18} className="text-sky-700"/>
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700/70">Execução do Orçamento</span>
                  <span className="text-[11px] font-semibold text-slate-400">Dia {currentDay}/{daysInMonth}</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-3xl font-bold tracking-tight font-mono text-slate-800">{executionRate.toFixed(1)}%</p>
                <span className={`text-sm font-bold ${Math.abs(executionPace) < 5 ? 'text-slate-400' : executionPace > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {executionPace > 0 ? `+${executionPace.toFixed(0)}%` : executionPace < 0 ? `${executionPace.toFixed(0)}%` : ''}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {Math.abs(executionPace) < 5
                  ? `No ritmo esperado (${expectedExecutionRate.toFixed(0)}%)`
                  : executionPace > 0
                    ? `Acima do ritmo esperado para o dia ${currentDay}`
                    : `Abaixo do ritmo esperado para o dia ${currentDay}`}
              </p>
            </div>
          </div>

          {/* Taxa de Economia */}
          <div className={`relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(16,185,129,0.25)] hover:-translate-y-1 ${
            savingsRate >= 20 ? 'border-emerald-600/20 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.15)]' :
            savingsRate >= 10 ? 'border-amber-600/20 shadow-[0_8px_30px_-8px_rgba(245,158,11,0.15)]' :
            'border-rose-600/20 shadow-[0_8px_30px_-8px_rgba(244,63,94,0.15)]'
          }`}>
            <div className={`absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none ${
              savingsRate >= 20 ? 'from-emerald-50/60' :
              savingsRate >= 10 ? 'from-amber-50/50' :
              'from-rose-50/50'
            }`}></div>
            <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
              savingsRate >= 20 ? 'bg-emerald-500/10' :
              savingsRate >= 10 ? 'bg-amber-500/10' :
              'bg-rose-500/10'
            }`}></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl shadow-sm ${
                  savingsRate >= 20 ? 'bg-emerald-100' :
                  savingsRate >= 10 ? 'bg-amber-100' :
                  'bg-rose-100'
                }`}>
                  <BarChart3 size={18} className={
                    savingsRate >= 20 ? 'text-emerald-700' :
                    savingsRate >= 10 ? 'text-amber-700' :
                    'text-rose-700'
                  }/>
                </div>
                <div className="flex-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    savingsRate >= 20 ? 'text-emerald-700/70' :
                    savingsRate >= 10 ? 'text-amber-700/70' :
                    'text-rose-700/70'
                  }`}>Taxa de Economia</span>
                </div>
              </div>
              <p className={`text-3xl font-bold tracking-tight font-mono mb-1 ${
                savingsRate >= 20 ? 'text-emerald-700' :
                savingsRate >= 10 ? 'text-amber-700' :
                'text-rose-700'
              }`}>{savingsRate.toFixed(1)}%</p>
              <p className="text-xs text-slate-500">
                {savingsRate >= 20 && '✓ Excelente! Acima de 20%'}
                {savingsRate >= 10 && savingsRate < 20 && '⚠ Razoável. Meta: 20%'}
                {savingsRate < 10 && '⚠ Baixa. Tente economizar mais'}
              </p>
            </div>
          </div>

          {/* Cartões e Faturas - visão geral com expansão por cartão */}
          {cardSummaries.length > 0 && (
            <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-indigo-600/20 shadow-[0_8px_30px_-8px_rgba(79,70,229,0.15)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.25)]">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent pointer-events-none"></div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 rounded-xl shadow-sm">
                      <CreditCard size={18} className="text-indigo-700"/>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700/70">Faturas de Cartão</span>
                      <p className="text-xs text-slate-500">Visão geral e por cartão</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-slate-500">Total aberto</p>
                    <p className="text-lg font-bold text-indigo-700">{formatCurrency(totalUpcomingAmount)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {cardSummaries.map(summary => (
                    <div
                      key={summary.card.id}
                      className="p-3 rounded-xl border border-slate-100 bg-white/90 hover:border-indigo-100 transition-colors"
                    >
                      <button
                        className="w-full flex items-center justify-between gap-3 text-left"
                        onClick={() => setExpandedCardId(prev => prev === summary.card.id ? null : summary.card.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{summary.card.name}</p>
                            <p className="text-[11px] text-slate-500">
                              Vence em {formatShortDate(summary.invoice.dueDate)} • {summary.daysToDue} dias • {summary.invoice.status === 'open' ? 'Aberta' : summary.invoice.status === 'future' ? 'Futura' : 'Fechada'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800">{formatCurrency(summary.invoice.amount)}</p>
                          <p className={`text-[11px] font-semibold ${
                            summary.limitPct >= 90 ? 'text-rose-600' :
                            summary.limitPct >= 75 ? 'text-amber-600' :
                            'text-emerald-600'
                          }`}>{summary.limitPct.toFixed(0)}% do limite</p>
                        </div>
                      </button>

                      {expandedCardId === summary.card.id && (
                        <div className="mt-3 space-y-3 text-sm text-slate-700">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                              <span>Limite usado</span>
                              <span>{formatCurrency(summary.limitUsed)} / {formatCurrency(summary.card.limit)}</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  summary.limitPct >= 90 ? 'bg-rose-500' :
                                  summary.limitPct >= 75 ? 'bg-amber-500' :
                                  'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(summary.limitPct, 110)}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <p className="text-[11px] uppercase font-bold text-slate-400 mb-1">Parcelado futuro</p>
                              <p className="font-mono font-bold text-slate-800">{formatCurrency(summary.futureInstallments)}</p>
                              <p className="text-[11px] text-slate-400">Impacto após esta fatura</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <p className="text-[11px] uppercase font-bold text-slate-400 mb-1">Variação vs 3m</p>
                              <p className={`font-mono font-bold ${
                                summary.deltaVsAvg === null ? 'text-slate-500' :
                                summary.deltaVsAvg > 10 ? 'text-rose-600' :
                                summary.deltaVsAvg < -5 ? 'text-emerald-600' : 'text-amber-600'
                              }`}>
                                {summary.deltaVsAvg === null ? 'Sem histórico' : `${summary.deltaVsAvg > 0 ? '+' : ''}${summary.deltaVsAvg.toFixed(1)}%`}
                              </p>
                              <p className="text-[11px] text-slate-400">Média últimas 3 faturas</p>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-sm text-indigo-900">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">Ritmo diário</span>
                              {summary.safeDaily !== null && (
                                <span className="text-[11px] font-semibold text-indigo-500">limite saudável: {formatCurrency(summary.safeDaily)}</span>
                              )}
                            </div>
                            <p className="font-mono font-bold text-indigo-800">{formatCurrency(summary.dailyPace)}</p>
                            <p className="text-[11px] text-indigo-700">Média estimada por dia até o vencimento</p>
                          </div>

                          {summary.alert && (
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-800">
                              <span className="text-lg leading-none">⚠️</span>
                              <span className="font-semibold">{summary.alert}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
