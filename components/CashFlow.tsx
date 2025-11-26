import React, { useState, useMemo, useEffect } from 'react';
import { DailyBalance, Transaction, CreditCard, Account, HealthLevel } from '../types';
import { formatCurrency, getLocalDateString } from '../utils/financeUtils';
import { parseLocaleNumber, normalizeBoundary } from '../utils/numberUtils';
import { ChevronLeft, ChevronRight, ArrowDownRight, ArrowUpRight, Wallet, Plus, Calendar, Sparkles, CreditCard as CreditCardIcon, Building2, ExternalLink, Clock, Check, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import { SimulationBadge } from './ui/Badge';
import EmptyState from './ui/EmptyState';
import { transactionTypeColors, colorMap, ColorName } from '../styles/tokens';
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip, defs } from 'recharts';

interface CashFlowProps {
  timeline: DailyBalance[];
  creditCards: CreditCard[];
  accounts: Account[];
  healthLevels: HealthLevel[];
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

// Mapeamento de cores Tailwind para valores hex (para gradientes CSS)
// Inclui todas as cores disponíveis em Settings para garantir compatibilidade
const healthColorMap: Record<string, { bg: string; text: string; hex: string }> = {
  rose: { bg: 'bg-rose-100', text: 'text-rose-600', hex: '#e11d48' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', hex: '#ea580c' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', hex: '#d97706' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', hex: '#ca8a04' },
  lime: { bg: 'bg-lime-100', text: 'text-lime-600', hex: '#65a30d' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', hex: '#059669' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-600', hex: '#0d9488' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', hex: '#0891b2' },
  sky: { bg: 'bg-sky-100', text: 'text-sky-600', hex: '#0284c7' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', hex: '#2563eb' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', hex: '#4f46e5' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-600', hex: '#7c3aed' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', hex: '#9333ea' },
  fuchsia: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-600', hex: '#c026d3' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600', hex: '#db2777' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', hex: '#475569' },
};

const CashFlow: React.FC<CashFlowProps> = ({ timeline, creditCards, accounts, healthLevels, onSelectDay, onEditTransaction, onViewCard }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const getNormalizedLevels = () => {
    const normalized = healthLevels.map(level => ({
      ...level,
      min: normalizeBoundary(level.min, -Infinity),
      max: normalizeBoundary(level.max, Infinity),
    }));

    return normalized.sort((a, b) => {
      if (a.min === b.min) {
        return (a.max ?? Infinity) - (b.max ?? Infinity);
      }
      return a.min - b.min;
    });
  };

  // Helper para obter nível de saúde baseado no saldo
  const getHealthLevel = (balance: number) => {
    const balanceNum = Number(balance);
    if (!Number.isFinite(balanceNum)) {
      return { id: 'fallback', label: 'N/A', color: 'slate', min: -Infinity, max: Infinity };
    }

    const sorted = getNormalizedLevels();

    for (const level of sorted) {
      const withinRange = balanceNum >= level.min && balanceNum <= level.max;
      if (withinRange) {
        if (balanceNum === todayBalance) {
        }
        return level;
      }
    }

    // Se não encontrou nenhum (lacunas entre faixas), escolhe a faixa anterior mais próxima
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (balanceNum > prev.max && balanceNum < curr.min) {
        const chosen = prev;
        return chosen;
      }
    }

    // Fora dos limites: menor que o menor min => menor nível; maior que o maior max => maior nível
    const lowest = sorted[0] || { id: 'fallback', label: 'N/A', color: 'slate', min: -Infinity, max: Infinity };
    const highest = sorted[sorted.length - 1] || lowest;
    const fallbackLevel = balanceNum < lowest.min ? lowest : highest;
    return fallbackLevel;
  };

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

  // Dados do mês anterior para comparação
  const previousMonthDays = useMemo(() => {
    const prevDate = new Date(currentDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    return timeline.filter(day => {
      const d = new Date(day.date + 'T00:00:00');
      return d.getMonth() === prevDate.getMonth() && d.getFullYear() === prevDate.getFullYear();
    });
  }, [timeline, currentDate]);

  const previousMonthTotals = useMemo(() => {
    return previousMonthDays.reduce((acc, day) => ({
      income: acc.income + day.totalIncome,
      expense: acc.expense + day.totalExpense,
      daily: acc.daily + day.totalDaily,
      economy: acc.economy + day.totalEconomy,
    }), { income: 0, expense: 0, daily: 0, economy: 0 });
  }, [previousMonthDays]);

  const monthlyTotals = useMemo(() => {
    return displayedDays.reduce((acc, day) => ({
      income: acc.income + day.totalIncome,
      expense: acc.expense + day.totalExpense,
      daily: acc.daily + day.totalDaily,
      economy: acc.economy + day.totalEconomy,
    }), { income: 0, expense: 0, daily: 0, economy: 0 });
  }, [displayedDays]);

  // Desembolso total = saídas + diário + economia
  const totalOutflow = monthlyTotals.expense + monthlyTotals.daily + monthlyTotals.economy;
  const prevTotalOutflow = previousMonthTotals.expense + previousMonthTotals.daily + previousMonthTotals.economy;
  // Performance = entradas - desembolso total
  const performance = monthlyTotals.income - totalOutflow;
  const prevPerformance = previousMonthTotals.income - prevTotalOutflow;

  // Saldo do dia atual (hoje)
  const todayBalance = useMemo(() => {
    const today = getLocalDateString();
    const todayData = displayedDays.find(d => d.date === today);
    return todayData?.endBalance ?? null;
  }, [displayedDays]);

  const monthEndBalance = displayedDays.length > 0 ? displayedDays[displayedDays.length - 1].endBalance : 0;
  const currentHealthLevel = getHealthLevel(monthEndBalance);
  const currentHealthColor = healthColorMap[currentHealthLevel.color] || healthColorMap.slate;

  // Calcula variação percentual
  const calcVariation = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : (current < 0 ? -100 : 0);
    return Math.round(((current - previous) / Math.abs(previous)) * 100);
  };

  const variations = {
    income: calcVariation(monthlyTotals.income, previousMonthTotals.income),
    expense: calcVariation(monthlyTotals.expense, previousMonthTotals.expense),
    daily: calcVariation(monthlyTotals.daily, previousMonthTotals.daily),
    economy: calcVariation(monthlyTotals.economy, previousMonthTotals.economy),
    outflow: calcVariation(totalOutflow, prevTotalOutflow),
    performance: calcVariation(performance, prevPerformance),
  };

  // Dados para barra de saúde - cada dia com sua cor baseada no saldo
  const healthBarData = useMemo(() => {
    return displayedDays.map(day => {
      const level = getHealthLevel(day.endBalance);
      const colorInfo = healthColorMap[level.color] || healthColorMap.slate;
      return {
        date: day.date,
        day: parseInt(day.date.split('-')[2]),
        balance: day.endBalance,
        level: level.label,
        color: level.color,
        hex: colorInfo.hex,
      };
    });
  }, [displayedDays, healthLevels]);

  // Dados para o gráfico de área com gradientes
  const areaChartData = useMemo(() => {
    return displayedDays.map(day => {
      const level = getHealthLevel(day.endBalance);
      const colorInfo = healthColorMap[level.color] || healthColorMap.slate;
      return {
        date: day.date,
        day: parseInt(day.date.split('-')[2]),
        balance: day.endBalance,
        level: level.label,
        color: colorInfo.hex,
      };
    });
  }, [displayedDays, healthLevels]);

  // Calcular min/max para o eixo Y centralizado em zero
  const { yMin, yMax } = useMemo(() => {
    if (areaChartData.length === 0) return { yMin: -1000, yMax: 1000 };
    const balances = areaChartData.map(d => d.balance);
    const maxAbs = Math.max(Math.abs(Math.min(...balances)), Math.abs(Math.max(...balances)));
    const padding = maxAbs * 0.1 || 1000;
    return { yMin: -maxAbs - padding, yMax: maxAbs + padding };
  }, [areaChartData]);

  // Gerar gradiente SVG baseado nos níveis de saúde
  const gradientStops = useMemo(() => {
    // Ordenar níveis de saúde do mais alto para o mais baixo
    const sortedLevels = [...healthLevels].sort((a, b) => (b.min ?? -Infinity) - (a.min ?? -Infinity));
    const range = yMax - yMin;

    return sortedLevels.map(level => {
      const colorInfo = healthColorMap[level.color] || healthColorMap.slate;
      // Calcular posição percentual do nível no eixo Y
      const levelMin = level.min ?? yMin;
      const levelMax = level.max ?? yMax;
      const midPoint = (levelMin + levelMax) / 2;
      // Converter para porcentagem (invertido porque SVG gradient vai de cima para baixo)
      const percentage = ((yMax - midPoint) / range) * 100;
      return {
        offset: `${Math.max(0, Math.min(100, percentage))}%`,
        color: colorInfo.hex,
      };
    });
  }, [healthLevels, yMin, yMax]);

  // Encontra dias com alertas (transição para níveis piores)
  const alertDays = useMemo(() => {
    const alerts: { day: number; from: string; to: string }[] = [];
    for (let i = 1; i < healthBarData.length; i++) {
      const prev = healthBarData[i - 1];
      const curr = healthBarData[i];
      const prevIdx = healthLevels.findIndex(h => h.color === prev.color);
      const currIdx = healthLevels.findIndex(h => h.color === curr.color);
      // Se o índice diminuiu, a saúde piorou
      if (currIdx < prevIdx && currIdx <= 1) { // Entrou em crítico ou urgente
        alerts.push({ day: curr.day, from: prev.level, to: curr.level });
      }
    }
    return alerts;
  }, [healthBarData, healthLevels]);

  const toggleDay = (date: string) => {
    setExpandedDay(expandedDay === date ? null : date);
  };

  // DEBUG: loga configurações de saúde e classificação corrente
  useEffect(() => {
    const normalized = getNormalizedLevels();
    if (todayBalance !== null) {
    }
    if (typeof window !== 'undefined') {
      (window as any).__fluxoHealthDebug = {
        raw: healthLevels,
        normalized,
        normalizedSummary: normalized.map(l => ({ id: l.id, label: l.label, min: l.min, max: l.max, color: l.color })),
        todayBalance,
        todayLevel: todayBalance !== null ? getHealthLevel(todayBalance) : null,
      };
    }
  }, [healthLevels, todayBalance, healthBarData]);

  const todayStr = getLocalDateString();

  // Agrupa transações de cartão por cardId para mostrar separador
  const getCardTransactionGroups = (transactions: Transaction[]) => {
    const cardIds = new Set(transactions.filter(t => t.cardId).map(t => t.cardId!));
    return Array.from(cardIds);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">

      {/* Monthly Summary Header */}
      <Card variant="default" padding="none" className="overflow-hidden">
        {/* Header com navegação e mês */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <button onClick={handlePrevMonth} className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><ChevronLeft size={16}/></button>
              <button onClick={handleNextMonth} className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><ChevronRight size={16}/></button>
            </div>
            <h2 className="text-lg font-bold text-slate-800 capitalize whitespace-nowrap">{currentMonthName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-emerald-500" />
            <span className="text-xs font-medium text-slate-500">Resumo Financeiro</span>
          </div>
        </div>

        {/* Grid de Métricas com Indicadores */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-slate-100">
          {/* Entradas */}
          <div className="bg-white p-3 hover:bg-emerald-50/30 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center">
                  <ArrowUpRight size={12} className="text-emerald-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Entradas</span>
              </div>
              {variations.income !== 0 && previousMonthTotals.income > 0 && (
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${variations.income > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {variations.income > 0 ? <TrendingUp size={9}/> : <TrendingDown size={9}/>}
                  {Math.abs(variations.income)}%
                </div>
              )}
            </div>
            <p className="text-base font-bold text-emerald-600 font-mono">+{formatCurrency(monthlyTotals.income)}</p>
            {previousMonthTotals.income > 0 && (
              <p className="text-[9px] text-slate-400 mt-0.5">vs {formatCurrency(previousMonthTotals.income)}</p>
            )}
          </div>

          {/* Saídas */}
          <div className="bg-white p-3 hover:bg-rose-50/30 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-rose-100 flex items-center justify-center">
                  <ArrowDownRight size={12} className="text-rose-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Saídas</span>
              </div>
              {variations.expense !== 0 && previousMonthTotals.expense > 0 && (
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${variations.expense < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {variations.expense < 0 ? <TrendingDown size={9}/> : <TrendingUp size={9}/>}
                  {Math.abs(variations.expense)}%
                </div>
              )}
            </div>
            <p className="text-base font-bold text-rose-600 font-mono">-{formatCurrency(monthlyTotals.expense)}</p>
            {previousMonthTotals.expense > 0 && (
              <p className="text-[9px] text-slate-400 mt-0.5">vs {formatCurrency(previousMonthTotals.expense)}</p>
            )}
          </div>

          {/* Diário */}
          <div className="bg-white p-3 hover:bg-amber-50/30 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center">
                  <Calendar size={12} className="text-amber-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Diário</span>
              </div>
              {variations.daily !== 0 && previousMonthTotals.daily > 0 && (
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${variations.daily < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {variations.daily < 0 ? <TrendingDown size={9}/> : <TrendingUp size={9}/>}
                  {Math.abs(variations.daily)}%
                </div>
              )}
            </div>
            <p className="text-base font-bold text-amber-600 font-mono">-{formatCurrency(monthlyTotals.daily)}</p>
            {previousMonthTotals.daily > 0 && (
              <p className="text-[9px] text-slate-400 mt-0.5">vs {formatCurrency(previousMonthTotals.daily)}</p>
            )}
          </div>

          {/* Economia */}
          <div className="bg-white p-3 hover:bg-blue-50/30 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center">
                  <Wallet size={12} className="text-blue-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Economia</span>
              </div>
              {variations.economy !== 0 && previousMonthTotals.economy > 0 && (
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${variations.economy > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {variations.economy > 0 ? <TrendingUp size={9}/> : <TrendingDown size={9}/>}
                  {Math.abs(variations.economy)}%
                </div>
              )}
            </div>
            <p className="text-base font-bold text-blue-600 font-mono">-{formatCurrency(monthlyTotals.economy)}</p>
            {previousMonthTotals.economy > 0 && (
              <p className="text-[9px] text-slate-400 mt-0.5">vs {formatCurrency(previousMonthTotals.economy)}</p>
            )}
          </div>

          {/* Desembolso Total */}
          <div className="bg-slate-50 p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-slate-200 flex items-center justify-center">
                  <Minus size={12} className="text-slate-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Desembolso</span>
              </div>
              {variations.outflow !== 0 && prevTotalOutflow > 0 && (
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${variations.outflow < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {variations.outflow < 0 ? <TrendingDown size={9}/> : <TrendingUp size={9}/>}
                  {Math.abs(variations.outflow)}%
                </div>
              )}
            </div>
            <p className="text-base font-bold text-slate-700 font-mono">-{formatCurrency(totalOutflow)}</p>
            {prevTotalOutflow > 0 && (
              <p className="text-[9px] text-slate-400 mt-0.5">vs {formatCurrency(prevTotalOutflow)}</p>
            )}
          </div>

          {/* Performance */}
          <div className={`p-3 ${performance >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${performance >= 0 ? 'bg-emerald-200' : 'bg-rose-200'}`}>
                  {performance >= 0 ? <TrendingUp size={12} className="text-emerald-700" /> : <TrendingDown size={12} className="text-rose-700" />}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Performance</span>
              </div>
              {variations.performance !== 0 && prevPerformance !== 0 && (
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${variations.performance > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {variations.performance > 0 ? <TrendingUp size={9}/> : <TrendingDown size={9}/>}
                  {Math.abs(variations.performance)}%
                </div>
              )}
            </div>
            <p className={`text-base font-bold font-mono ${performance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {performance >= 0 ? '+' : ''}{formatCurrency(performance)}
            </p>
            {prevPerformance !== 0 && (
              <p className="text-[9px] text-slate-400 mt-0.5">vs {formatCurrency(prevPerformance)}</p>
            )}
          </div>
        </div>

        {/* Saldo do dia atual + Gráfico de área */}
        <div className="p-4">
          {/* Saldo de Hoje */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Saldo Hoje</span>
              </div>
              {todayBalance !== null ? (
                <span className={`text-lg font-bold font-mono ${todayBalance >= 0 ? (getHealthLevel(todayBalance).color === 'rose' || getHealthLevel(todayBalance).color === 'orange' ? 'text-rose-600' : getHealthLevel(todayBalance).color === 'amber' ? 'text-amber-600' : getHealthLevel(todayBalance).color === 'emerald' ? 'text-emerald-600' : 'text-indigo-600') : 'text-rose-600'}`}>
                  {formatCurrency(todayBalance)}
                </span>
              ) : (
                <span className="text-sm text-slate-400">Não disponível neste mês</span>
              )}
              {todayBalance !== null && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${healthColorMap[getHealthLevel(todayBalance).color]?.bg || 'bg-slate-100'} ${healthColorMap[getHealthLevel(todayBalance).color]?.text || 'text-slate-600'}`}>
                  {getHealthLevel(todayBalance).label}
                </span>
              )}
            </div>

            {/* Legenda dos níveis */}
            <div className="flex items-center gap-3 flex-wrap">
              {healthLevels.map(level => {
                const colorInfo = healthColorMap[level.color] || healthColorMap.slate;
                return (
                  <div key={level.id} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colorInfo.hex }}></div>
                    <span className="text-[9px] text-slate-500 font-medium">{level.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico de Área */}
          {areaChartData.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                      {gradientStops.map((stop, idx) => (
                        <stop key={idx} offset={stop.offset} stopColor={stop.color} stopOpacity={0.8} />
                      ))}
                    </linearGradient>
                    <linearGradient id="healthGradientLine" x1="0" y1="0" x2="0" y2="1">
                      {gradientStops.map((stop, idx) => (
                        <stop key={idx} offset={stop.offset} stopColor={stop.color} stopOpacity={1} />
                      ))}
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[yMin, yMax]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(value) => formatCurrency(value)}
                    width={70}
                  />
                  <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth={1} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
                            <div className="font-bold">Dia {data.day}</div>
                            <div className="font-mono mt-1">{formatCurrency(data.balance)}</div>
                            <div className="text-slate-300 text-[10px] mt-0.5">{data.level}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="url(#healthGradientLine)"
                    strokeWidth={2}
                    fill="url(#healthGradient)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              Sem dados para exibir o gráfico
            </div>
          )}
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
              <div key={day.date} className={`border-b border-slate-100 last:border-0 ${isExpanded ? 'bg-slate-100 pt-3 px-3' : ''}`}>
                {/* Linha compacta do dia - com destaque sutil */}
                <div
                  onClick={() => toggleDay(day.date)}
                  className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-all ${
                    isToday
                      ? 'bg-gradient-to-r from-emerald-50 to-emerald-50/30 border-l-4 border-l-emerald-500 shadow-sm'
                      : isExpanded
                        ? 'bg-white rounded-xl border border-slate-200 shadow-sm'
                        : 'hover:bg-slate-50/60 hover:shadow-sm'
                  }`}
                >
                  {/* Data */}
                  <div className="flex items-center gap-3 min-w-[60px]">
                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold ${isToday ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <span className="text-base leading-none">{dateObj.getDate()}</span>
                      <span className="text-[9px] uppercase">{dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.','')}</span>
                    </div>
                  </div>

                  {/* Resumo: Entradas | Saídas | Diário | Economia | Saldo - Grid com alinhamento tabular */}
                  <div className="grid grid-cols-[1fr,1fr,1fr,1fr,auto] text-xs flex-1 items-center">
                    <div className="px-3">
                      {day.totalIncome > 0 ? (
                        <div className="flex flex-col items-end">
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">Entrada</p>
                          <p className="font-mono font-bold text-emerald-600 text-sm">+{formatCurrency(day.totalIncome)}</p>
                        </div>
                      ) : (
                        <p className="font-mono text-slate-200 text-right leading-[38px]">—</p>
                      )}
                    </div>
                    <div className="px-3">
                      {day.totalExpense > 0 ? (
                        <div className="flex flex-col items-end">
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">Saída</p>
                          <p className="font-mono font-bold text-rose-600 text-sm">-{formatCurrency(day.totalExpense)}</p>
                        </div>
                      ) : (
                        <p className="font-mono text-slate-200 text-right leading-[38px]">—</p>
                      )}
                    </div>
                    <div className="px-3">
                      {day.totalDaily > 0 ? (
                        <div className="flex flex-col items-end">
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">Diário</p>
                          <p className="font-mono font-bold text-amber-600 text-sm">-{formatCurrency(day.totalDaily)}</p>
                        </div>
                      ) : (
                        <p className="font-mono text-slate-200 text-right leading-[38px]">—</p>
                      )}
                    </div>
                    <div className="px-3">
                      {day.totalEconomy > 0 ? (
                        <div className="flex flex-col items-end">
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">Economia</p>
                          <p className="font-mono font-bold text-blue-600 text-sm">-{formatCurrency(day.totalEconomy)}</p>
                        </div>
                      ) : (
                        <p className="font-mono text-slate-200 text-right leading-[38px]">—</p>
                      )}
                    </div>
                    {/* Saldo */}
                    <div className="px-3">
                      <div className="flex flex-col items-end">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">Saldo</p>
                        <p className={`font-mono font-bold text-sm ${day.endBalance < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {formatCurrency(day.endBalance)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lista de transações expandida */}
                {isExpanded && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200 pt-2 pb-2">
                    {/* Títulos das colunas - só mostra se há transações */}
                    {hasTransactions && (
                      <div className="grid grid-cols-[minmax(180px,2fr),minmax(70px,1fr),minmax(70px,1fr),minmax(60px,1fr),minmax(100px,1fr)] items-center gap-1.5 px-3 pb-1.5">
                        {/* pl-[32px] = w-6 (24px) + gap-2 (8px) para alinhar com texto após ícone */}
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-[32px]">Descrição</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Categoria</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Conta</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right pr-1">Valor</span>
                      </div>
                    )}

                    {/* Transações ordenadas */}
                    <div className="space-y-1.5">
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
                              <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${cardColorClasses?.bg || 'bg-slate-50'}`}>
                                <div className="flex items-center gap-1.5">
                                  <CreditCardIcon size={12} className={cardColorClasses?.text || 'text-slate-500'} />
                                  <span className={`text-[11px] font-bold ${cardColorClasses?.textDark || 'text-slate-600'}`}>
                                    {getCardName(t.cardId)}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-medium">
                                    {sortedTransactions.filter(st => st.cardId === t.cardId).length} itens
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onViewCard(t.cardId!); }}
                                  className={`flex items-center gap-1 text-[9px] font-bold ${cardColorClasses?.text || 'text-slate-500'} hover:underline`}
                                >
                                  Ver fatura <ExternalLink size={9} />
                                </button>
                              </div>
                            )}

                            {/* Linha da transação - Card compacto */}
                            <div
                              onClick={(e) => { e.stopPropagation(); onEditTransaction(t); }}
                              className={`grid grid-cols-[minmax(180px,2fr),minmax(70px,1fr),minmax(70px,1fr),minmax(60px,1fr),minmax(100px,1fr)] items-center gap-1.5 px-3 py-2 cursor-pointer transition-all rounded-lg shadow-sm hover:shadow-md border ${typeColors.bgLight} ${typeColors.border || 'border-transparent'} ${
                                t.cardId ? 'ml-3' : ''
                              }`}
                            >
                              {/* Descrição + ícone */}
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${typeColors.bg} ${typeColors.text} flex-shrink-0`}>
                                  {t.type === 'income' ? <ArrowUpRight size={13} strokeWidth={2.5} /> :
                                    t.type === 'economy' ? <Wallet size={13} strokeWidth={2.5} /> :
                                    <ArrowDownRight size={13} strokeWidth={2.5} />}
                                </div>
                                <span className={`font-semibold text-xs truncate ${typeColors.textDark}`}>{t.description}</span>
                                {t.installmentCurrent && t.installmentTotal && (
                                  <span className="text-[9px] text-slate-500 font-medium flex-shrink-0 bg-white/80 px-1 py-0.5 rounded">
                                    {t.installmentCurrent}/{t.installmentTotal}
                                  </span>
                                )}
                              </div>

                              {/* Categoria */}
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide truncate">
                                {t.category}
                              </span>

                              {/* Origem (Conta ou Cartão) */}
                              <div className="flex items-center gap-1 text-[11px] text-slate-600 truncate">
                                {t.cardId ? (
                                  <span className="text-slate-400">—</span>
                                ) : t.accountId ? (
                                  <>
                                    <Building2 size={10} className="text-slate-400 flex-shrink-0" />
                                    <span className="font-medium truncate">{getAccountName(t.accountId)}</span>
                                  </>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </div>

                              {/* Status com ícone */}
                              <div className="flex items-center">
                                {t.status === 'paid' ? (
                                  <div className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                    <Check size={10} strokeWidth={3} />
                                    <span className="text-[8px] font-bold uppercase">Pago</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-0.5 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                    <Clock size={10} strokeWidth={2.5} />
                                    <span className="text-[8px] font-bold uppercase">Pend.</span>
                                  </div>
                                )}
                                {t.isSimulation && <SimulationBadge />}
                              </div>

                              {/* Valor */}
                              <p className={`font-mono font-bold text-xs text-right ${typeColors.textDark}`}>
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                              </p>
                            </div>
                          </React.Fragment>
                        );
                      })}

                      {/* Item fantasma para adicionar */}
                      <div
                        onClick={(e) => { e.stopPropagation(); onSelectDay(day.date); }}
                        className="grid grid-cols-[minmax(180px,2fr),minmax(70px,1fr),minmax(70px,1fr),minmax(60px,1fr),minmax(100px,1fr)] items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-all rounded-lg border border-dashed border-slate-300 hover:border-slate-400 hover:bg-white/50 group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-200 text-slate-400 group-hover:bg-slate-300 group-hover:text-slate-500 transition-colors">
                            <Plus size={14} strokeWidth={2} />
                          </div>
                          <span className="font-medium text-xs text-slate-400 group-hover:text-slate-500 transition-colors">Adicionar lançamento</span>
                        </div>
                        <span className="text-slate-300 text-[9px]">—</span>
                        <span className="text-slate-300 text-[9px]">—</span>
                        <span className="text-slate-300 text-[9px]">—</span>
                        <span className="text-slate-300 text-[9px] text-right">—</span>
                      </div>
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
