import React, { useMemo, useState } from 'react';
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Activity, BrainCircuit, Send, AlertTriangle, Clock, Target, Sparkles, Flame, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { DailyBalance, Account, UserSettings, Transaction } from '../types';
import { formatCurrency, groupDataByCategory, groupDailyToMonthly } from '../utils/financeUtils';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card, { CardHeader, CardStat } from './ui/Card';

interface DashboardProps {
  timeline: DailyBalance[];
  accounts: Account[];
  settings: UserSettings;
  transactions: Transaction[];
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

const Dashboard: React.FC<DashboardProps> = ({ timeline, accounts, settings, transactions }) => {
  const [categoryMonth, setCategoryMonth] = useState(new Date());

  const categoryMonthKey = useMemo(() => {
    const y = categoryMonth.getFullYear();
    const m = String(categoryMonth.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [categoryMonth]);

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
  const currentBalance = timeline[0]?.startBalance || 0;
  const endOfMonth = timeline[29]?.endBalance || 0;

  const liquidBalance = accounts.filter(a => a.type !== 'investment').reduce((acc, c) => acc + c.initialBalance, 0);
  const investBalance = accounts.filter(a => a.type === 'investment').reduce((acc, c) => acc + c.initialBalance, 0);
  const totalNetWorth = liquidBalance + investBalance;

  const totalIncome = timeline.slice(0,30).reduce((acc, t) => acc + t.totalIncome, 0);
  const totalExpense = timeline.slice(0,30).reduce((acc, t) => acc + t.totalExpense + t.totalDaily, 0);
  const monthlyNet = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const burnRate = totalIncome > 0 ? totalExpense / totalIncome : 0;

  const monthlyChartData = groupDailyToMonthly(timeline).slice(0, 6).map(m => ({
      ...m,
      monthName: new Date(m.name + '-02').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  }));

  const avgMonthlyExpense = monthlyChartData.reduce((acc, m) => acc + m.expense, 0) / (monthlyChartData.length || 1);
  const runwayMonths = avgMonthlyExpense > 0 ? liquidBalance / avgMonthlyExpense : 999;

  // Mescla transações reais com as projetadas da timeline para considerar recorrências futuras
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

  // Filtra despesas do mês selecionado
  const currentMonthExpenses = useMemo(() => {
    return mergedTransactions.filter(t => {
      if (!t.date?.startsWith(categoryMonthKey)) return false;
      return t.type === 'expense' || t.type === 'daily' || t.type === 'economy';
    });
  }, [mergedTransactions, categoryMonthKey]);
  const expenseByCategory = useMemo(() => groupDataByCategory(currentMonthExpenses, 'expense'), [currentMonthExpenses]);
  const topExpenseCategories = useMemo(() => expenseByCategory.slice(0, 10), [expenseByCategory]);
  const biggestExpenseCategory = expenseByCategory[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Top level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Liquidez */}
        <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-emerald-600/20 shadow-[0_8px_30px_-8px_rgba(5,150,105,0.15)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(5,150,105,0.25)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent pointer-events-none"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl shadow-sm">
                <Wallet size={18} className="text-emerald-700" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/70">Liquidez</span>
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight font-mono text-slate-800 mb-1">{formatCurrency(liquidBalance)}</p>
            <p className="text-xs text-slate-400">Disponível em contas</p>
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
        <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-blue-600/20 shadow-[0_8px_30px_-8px_rgba(37,99,235,0.15)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(37,99,235,0.25)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-100 rounded-xl shadow-sm">
                <TrendingUp size={18} className="text-blue-700" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700/70">Projeção 30d</span>
              </div>
            </div>
            <p className={`text-3xl font-bold tracking-tight font-mono mb-1 ${endOfMonth >= currentBalance ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(endOfMonth)}
            </p>
            <p className="text-xs text-slate-400">Variação: {formatCurrency(endOfMonth - currentBalance)}</p>
          </div>
        </div>

        {/* Burn/Savings */}
        <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-amber-600/20 shadow-[0_8px_30px_-8px_rgba(245,158,11,0.15)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(245,158,11,0.25)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent pointer-events-none"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-100 rounded-xl shadow-sm">
                <Flame size={18} className="text-amber-700" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/70">Velocidade</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Burn Rate</span>
                <span className="text-lg font-bold text-rose-600">{(burnRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Savings</span>
                <span className="text-lg font-bold text-emerald-600">{savingsRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolução Mensal - Redesenhada */}
        <div className="lg:col-span-2 relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-indigo-600/10 shadow-[0_8px_30px_-8px_rgba(79,70,229,0.12)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.2)]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-transparent pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Evolução Mensal</h3>
                <p className="text-sm text-slate-500">Últimos 6 meses - Entradas, Saídas e Saldo</p>
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

        <div className="flex flex-col gap-6">
          {/* Runway Card */}
          <div className="flex-1 relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-amber-600/20 shadow-[0_8px_30px_-8px_rgba(245,158,11,0.15)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(245,158,11,0.25)]">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-amber-100 rounded-xl shadow-sm">
                  <Clock size={18} className="text-amber-700"/>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/70">Runway</span>
              </div>
              <p className="text-3xl font-bold text-slate-800 font-mono mb-2">
                {runwayMonths > 24 ? '> 2 Anos' : `${runwayMonths.toFixed(1)} Meses`}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Com média de <strong className="text-slate-700">{formatCurrency(avgMonthlyExpense)}</strong> por mês
              </p>
            </div>
          </div>

          {/* Maior Ofensor Card */}
          <div className="flex-1 relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-rose-600/20 shadow-[0_8px_30px_-8px_rgba(244,63,94,0.15)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(244,63,94,0.25)]">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-rose-100 rounded-xl shadow-sm">
                  <AlertTriangle size={18} className="text-rose-700"/>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700/70">Maior Ofensor</span>
              </div>
              {biggestExpenseCategory ? (
                <>
                  <p className="text-xl font-bold text-slate-800 mb-1">{biggestExpenseCategory.name}</p>
                  <p className="text-rose-600 font-bold font-mono text-lg mb-3">{formatCurrency(biggestExpenseCategory.value)}</p>
                  <div className="w-full bg-rose-100/50 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-500 shadow-sm"
                      style={{width: `${Math.min((biggestExpenseCategory.value / totalExpense)*100, 100)}%`}}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2.5">
                    <strong className="text-slate-700">{((biggestExpenseCategory.value / totalExpense)*100).toFixed(1)}%</strong> das saídas do mês
                  </p>
                </>
              ) : (
                <p className="text-slate-400 text-sm">Sem dados suficientes.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat + categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="gradient" padding="none" className="flex flex-col overflow-hidden h-96 lg:h-auto bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white"><BrainCircuit size={18}/></div>
            <div>
              <h4 className="font-bold text-sm text-white">Fluxo AI</h4>
              <p className="text-[10px] text-emerald-200 font-bold uppercase">Pronto para ajudar</p>
            </div>
          </div>
          <div className="flex-1 p-5 space-y-4 overflow-y-auto">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0"></div>
              <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none text-sm text-slate-100 border border-white/10">
                Analisei seu mês: sua categoria mais pesada foi "Mercado" com {biggestExpenseCategory ? formatCurrency(biggestExpenseCategory.value) : '—'}. Quer cortes automáticos?
              </div>
            </div>
            <div className="flex gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-emerald-400/80 flex-shrink-0"></div>
              <div className="bg-emerald-500 p-3 rounded-2xl rounded-tr-none text-sm text-white shadow-lg shadow-emerald-500/30">
                Sim, sugira um plano e redistribua para investimentos.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Cortes rápidos', 'Rever assinaturas', 'Simular câmbio', 'Planejar 6 meses'].map((chip) => (
                <span key={chip} className="px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/20 cursor-pointer hover:bg-white/20 transition">{chip}</span>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-white/10 bg-white/5">
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 border border-white/15">
              <input type="text" placeholder="Pergunte algo..." className="bg-transparent w-full outline-none text-sm text-white placeholder:text-white/50" />
              <button className="text-white hover:text-emerald-200 transition-colors"><Send size={16}/></button>
            </div>
          </div>
        </Card>

        <Card variant="elevated" className="lg:col-span-2">
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
    </div>
  );
};

export default Dashboard;
