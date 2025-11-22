import React from 'react';
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Activity, BrainCircuit, Send, AlertTriangle, Clock, Target, Sparkles, Flame, ShieldCheck } from 'lucide-react';
import { DailyBalance, Account, UserSettings } from '../types';
import { formatCurrency, groupDataByCategory, groupDailyToMonthly } from '../utils/financeUtils';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card, { CardHeader, CardStat } from './ui/Card';

interface DashboardProps {
  timeline: DailyBalance[];
  accounts: Account[];
  settings: UserSettings;
}

const CHART_COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ef4444', '#a855f7', '#0ea5e9', '#84cc16'];

const Dashboard: React.FC<DashboardProps> = ({ timeline, accounts, settings }) => {
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

  const allTransactions = timeline.flatMap(t => t.transactions);
  const expenseByCategory = groupDataByCategory(allTransactions, 'expense');
  const biggestExpenseCategory = expenseByCategory[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Top level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="gradient" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-cyan-500/15 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <CardHeader
              icon={<Wallet size={20} />}
              iconBg="bg-white/10 text-emerald-200"
              title="Saldo em Conta"
              subtitle="Liquidez imediata"
            />
            <CardStat label="" value={formatCurrency(liquidBalance)} />
          </div>
        </Card>

        <Card variant="dark" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl -mr-10 -mt-10 opacity-20"></div>
          <div className="relative z-10">
            <CardHeader
              icon={<Activity size={20} />}
              iconBg="bg-white/10 text-indigo-300"
              title="Patrimônio Líquido"
            />
            <div>
              <p className="text-3xl font-bold text-white font-mono tracking-tight">{formatCurrency(totalNetWorth)}</p>
              <p className="text-xs text-slate-400 mt-1">Saldo + Investimentos</p>
            </div>
          </div>
        </Card>

        <Card variant="elevated">
          <CardHeader
            icon={<TrendingUp size={20} />}
            iconBg="bg-emerald-50 text-emerald-600"
            title="Projeção (30d)"
            subtitle="Saldo previsto"
          />
          <CardStat
            label=""
            value={formatCurrency(endOfMonth)}
            sublabel={`Variação: ${formatCurrency(endOfMonth - currentBalance)}`}
            valueColor={endOfMonth >= currentBalance ? 'text-emerald-600' : 'text-rose-600'}
          />
        </Card>

        <Card variant="elevated">
          <CardHeader
            icon={<Flame size={20} />}
            iconBg="bg-amber-50 text-amber-600"
            title="Burn / Savings"
            subtitle="Velocidade de caixa"
          />
          <div className="space-y-2">
            <p className="text-lg font-bold text-slate-800">Burn: {(burnRate * 100).toFixed(1)}%</p>
            <p className="text-sm text-emerald-600 font-bold">Savings: {savingsRate.toFixed(1)}%</p>
          </div>
        </Card>
      </div>

      {/* Chart + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="elevated" padding="lg" className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Evolução Semestral</h3>
              <p className="text-slate-400 text-sm">Entradas x Saídas x Saldo</p>
            </div>
            <div className="flex gap-3 text-xs font-bold text-slate-500">
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-full"></div> Entradas</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-400 rounded-full"></div> Saídas</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-600 rounded-full"></div> Saldo</div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyChartData} margin={{top: 10, right: 10, left: -10, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="monthName" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`}/>
                <Tooltip
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)'}}
                  formatter={(val: number) => formatCurrency(val)}
                />
                <Bar dataKey="income" fill="#34d399" barSize={14} radius={[6,6,0,0]} stackId="a" />
                <Bar dataKey="expense" fill="#fb7185" barSize={14} radius={[6,6,0,0]} stackId="a" />
                <Line type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card variant="elevated" className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Clock size={20}/></div>
              <h4 className="font-bold text-slate-700 text-sm uppercase">Runway</h4>
            </div>
            <p className="text-3xl font-bold text-slate-800 font-mono">{runwayMonths > 24 ? '> 2 Anos' : `${runwayMonths.toFixed(1)} Meses`}</p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Tempo estimado considerando média de gastos de <strong className="text-slate-600">{formatCurrency(avgMonthlyExpense)}</strong>/mês.
            </p>
          </Card>

          <Card variant="elevated" className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><AlertTriangle size={20}/></div>
              <h4 className="font-bold text-slate-700 text-sm uppercase">Maior Ofensor</h4>
            </div>
            {biggestExpenseCategory ? (
              <>
                <p className="text-xl font-bold text-slate-800">{biggestExpenseCategory.name}</p>
                <p className="text-rose-600 font-bold font-mono">{formatCurrency(biggestExpenseCategory.value)}</p>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all duration-500" style={{width: `${Math.min((biggestExpenseCategory.value / totalExpense)*100, 100)}%`}}></div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Representa {((biggestExpenseCategory.value / totalExpense)*100).toFixed(1)}% das saídas projetadas.</p>
              </>
            ) : (
              <p className="text-slate-400 text-sm">Sem dados suficientes.</p>
            )}
          </Card>
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
          {expenseByCategory.length === 0 ? (
            <p className="text-slate-400 text-sm">Sem dados suficientes.</p>
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/2 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseByCategory.slice(0,6)} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                      {expenseByCategory.slice(0,6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {expenseByCategory.slice(0,6).map((cat, idx) => (
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
