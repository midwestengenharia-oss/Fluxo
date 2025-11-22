
import React, { useState, useMemo } from 'react';
import { MonthlySummary } from '../types';
import { formatCurrency } from '../utils/financeUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import Card from './ui/Card';
import EmptyState from './ui/EmptyState';

interface EconomyProps {
  data: MonthlySummary[];
}

const Economy: React.FC<EconomyProps> = ({ data }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const filteredData = useMemo(() => {
    return data.filter(d => d.month.startsWith(selectedYear.toString()));
  }, [data, selectedYear]);

  const totalIncome = filteredData.reduce((acc, cur) => acc + cur.totalIncome, 0);
  const totalSaved = filteredData.reduce((acc, cur) => acc + cur.totalSavings, 0);
  const totalRate = totalIncome > 0 ? (totalSaved / totalIncome) * 100 : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24 animate-in fade-in duration-500">
      {/* Year Navigation */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => setSelectedYear(prev => prev - 1)}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft size={24}/>
        </button>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{selectedYear}</h2>
        <button
          onClick={() => setSelectedYear(prev => prev + 1)}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-colors"
        >
          <ChevronRight size={24}/>
        </button>
      </div>

      {/* Summary Card */}
      <Card variant="elevated" padding="lg">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Performance Anual</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Entradas</p>
            <p className="text-3xl font-bold text-slate-800 font-mono tracking-tight">{formatCurrency(totalIncome)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Aportado</p>
            <p className="text-3xl font-bold text-blue-600 font-mono tracking-tight">{formatCurrency(totalSaved)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Taxa de Poupança</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-slate-800 tracking-tighter">{totalRate.toFixed(1)}%</p>
              <span className="text-sm text-slate-400">da renda</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart */}
        <Card variant="elevated" padding="lg">
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-6">Evolução dos Aportes</h3>
          <div className="h-72">
            {filteredData.length === 0 ? (
              <EmptyState
                icon={<TrendingUp size={32} />}
                title="Sem dados"
                description="Nenhum aporte registrado para este ano."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(val) => val.substring(5)}
                    tick={{fill: '#64748b', fontSize: 12}}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="totalSavings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card variant="default" padding="none" className="overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-4 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider">Mês</th>
                <th className="py-4 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Entradas</th>
                <th className="py-4 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Aportes</th>
                <th className="py-4 px-6 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((m) => (
                <tr key={m.month} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-6 font-medium text-slate-700">{m.month}</td>
                  <td className="py-3 px-6 text-right text-emerald-600 font-mono">+{formatCurrency(m.totalIncome)}</td>
                  <td className="py-3 px-6 text-right font-bold text-blue-600 font-mono">
                    {formatCurrency(m.totalSavings)}
                  </td>
                  <td className="py-3 px-6 text-right">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                      m.savingsRate > 20 ? 'bg-emerald-100 text-emerald-700' :
                      m.savingsRate > 0 ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {m.savingsRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">Nenhum dado para este ano.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};

export default Economy;
