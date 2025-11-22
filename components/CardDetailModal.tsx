
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CreditCard, Transaction } from '../types';
import { getCardInvoices, formatCurrency, formatDate, groupDataByCategory } from '../utils/financeUtils';
import { X, Calendar, ShoppingBag, Wifi, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { getColorClasses } from '../styles/tokens';

interface CardDetailModalProps {
    card: CreditCard | null;
    transactions: Transaction[];
    onClose: () => void;
}

const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, transactions, onClose }) => {
    const [activeTab, setActiveTab] = useState<'invoice' | 'history'>('invoice');
    const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
    const invoiceListRef = useRef<HTMLDivElement>(null);

    const invoices = useMemo(() => {
        if (!card) return [];
        return getCardInvoices(card, transactions);
    }, [card, transactions]);

    // Determine current/open invoice to select by default
    useEffect(() => {
        if (invoices.length > 0 && !selectedMonthKey) {
            const openInvoice = invoices.find(i => i.status === 'open');
            const futureInvoice = invoices.find(i => i.status === 'future');
            const lastInvoice = invoices[invoices.length - 1];

            if (openInvoice) setSelectedMonthKey(openInvoice.monthKey);
            else if (futureInvoice) setSelectedMonthKey(futureInvoice.monthKey);
            else setSelectedMonthKey(lastInvoice.monthKey);
        }
    }, [invoices, selectedMonthKey]);

    const scrollInvoiceList = (direction: 'left' | 'right') => {
        if (invoiceListRef.current) {
            const scrollAmount = 100;
            invoiceListRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Metrics for Left Panel
    const totalUsed = invoices.filter(i => i.status !== 'closed').reduce((acc, i) => acc + i.amount, 0);
    const availableLimit = card ? card.limit - totalUsed : 0;
    const usagePercent = card ? (totalUsed / card.limit) * 100 : 0;

    // Selected Invoice Data
    const selectedInvoice = invoices.find(i => i.monthKey === selectedMonthKey);

    const invoiceCategoryBreakdown = useMemo(() => {
        if (!selectedInvoice) return [];
        return groupDataByCategory(selectedInvoice.transactions, 'expense');
    }, [selectedInvoice]);

    if (!card) return null;

    const colorClasses = getColorClasses(card.color);

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] h-[90vh]">

                {/* Left Panel: Visual & Summary */}
                <div className="bg-slate-50 p-8 md:w-80 border-r border-slate-100 flex flex-col gap-6 flex-shrink-0 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start md:hidden">
                         <h3 className="font-bold text-slate-800">Detalhes do Cartão</h3>
                         <button onClick={onClose}><X size={24}/></button>
                    </div>

                    {/* Visual Card */}
                    <div className="relative aspect-[1.586] rounded-2xl p-6 text-white shadow-xl overflow-hidden bg-gradient-to-br from-slate-800 to-black group transform transition-transform hover:scale-105 duration-300 flex-shrink-0">
                        <div className={`absolute inset-0 ${colorClasses.bgSolid} opacity-60 mix-blend-multiply pointer-events-none`}></div>
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div className="flex justify-between">
                                <Wifi size={24} className="rotate-90 opacity-70" />
                                <span className="font-mono font-bold tracking-widest opacity-80 text-lg">{card.name}</span>
                            </div>
                            <div className="text-sm">
                                <p className="opacity-60 text-[10px] uppercase">Limite Disponível</p>
                                <p className="font-mono text-2xl font-bold">{formatCurrency(availableLimit)}</p>
                            </div>
                            <div className="flex justify-between text-[10px] opacity-80 font-mono">
                                <span>**** {card.id.substring(0,4)}</span>
                                <span>Vence dia {card.dueDay}</span>
                            </div>
                        </div>
                    </div>

                    {/* Limit Bar */}
                    <div>
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase">
                            <span>Utilizado</span>
                            <span>{usagePercent.toFixed(0)}%</span>
                        </div>
                        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full ${colorClasses.bgSolid} transition-all duration-1000 ease-out`} style={{width: `${Math.min(usagePercent, 100)}%`}}></div>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-slate-400 mt-2">
                            <span>{formatCurrency(totalUsed)}</span>
                            <span>Total: {formatCurrency(card.limit)}</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Invoices & Transactions */}
                <div className="flex-1 flex flex-col bg-white h-full overflow-hidden min-w-0">
                    <div className="hidden md:flex justify-between items-center p-6 border-b border-slate-100 flex-shrink-0">
                        <h3 className="text-xl font-bold text-slate-800">Gestão de Faturas</h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={20} className="text-slate-400"/></button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 px-6 border-b border-slate-100 flex-shrink-0">
                         <button
                            onClick={() => setActiveTab('invoice')}
                            className={`py-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'invoice' ? `${colorClasses.border} ${colorClasses.text}` : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                         >
                            Faturas
                         </button>
                         <button
                            onClick={() => setActiveTab('history')}
                            className={`py-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'history' ? `${colorClasses.border} ${colorClasses.text}` : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                         >
                            Todas as Compras
                         </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden bg-slate-50/30 relative flex flex-col">

                        {activeTab === 'invoice' && (
                            <div className="flex flex-col h-full">
                                {/* 1. Horizontal Invoice Timeline (Months) */}
                                <div className="bg-white border-b border-slate-100 flex-shrink-0 relative group">
                                    <button
                                        onClick={() => scrollInvoiceList('left')}
                                        className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 flex items-center justify-center text-slate-400 hover:text-slate-800"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>

                                    <div ref={invoiceListRef} className="flex overflow-x-auto no-scrollbar p-4 gap-3 items-center snap-x scroll-smooth px-12">
                                        {invoices.length === 0 && <p className="text-sm text-slate-400 w-full text-center">Nenhuma fatura gerada.</p>}
                                        {invoices.map((inv) => {
                                            const isSelected = inv.monthKey === selectedMonthKey;
                                            const monthName = new Date(inv.dueDate + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.','');

                                            return (
                                                <button
                                                    key={inv.monthKey}
                                                    onClick={() => setSelectedMonthKey(inv.monthKey)}
                                                    className={`snap-center flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all duration-200 ${
                                                        isSelected
                                                        ? `bg-slate-900 border-slate-900 text-white shadow-lg scale-105`
                                                        : `bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600`
                                                    }`}
                                                >
                                                    <span className="text-xs font-bold uppercase">{monthName}</span>
                                                    <span className={`text-[10px] font-bold mt-1 ${isSelected ? 'text-slate-300' : inv.status === 'open' ? 'text-indigo-500' : inv.status === 'closed' ? 'text-slate-300' : 'text-amber-500'}`}>
                                                        {inv.status === 'open' ? 'Aberta' : inv.status === 'closed' ? 'Fechada' : 'Futura'}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <button
                                        onClick={() => scrollInvoiceList('right')}
                                        className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 flex items-center justify-center text-slate-400 hover:text-slate-800"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>

                                {/* 2. Selected Invoice Detail */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                                    {selectedInvoice ? (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

                                            {/* Hero Section */}
                                            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {selectedInvoice.status === 'open' && <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full"><AlertCircle size={12}/> Fatura Atual</div>}
                                                        {selectedInvoice.status === 'closed' && <div className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full"><CheckCircle2 size={12}/> Fechada</div>}
                                                        {selectedInvoice.status === 'future' && <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><Clock size={12}/> Em aberto</div>}
                                                    </div>
                                                    <p className="text-4xl font-mono font-bold text-slate-800 tracking-tight">{formatCurrency(selectedInvoice.amount)}</p>
                                                    <p className="text-sm text-slate-500 mt-1">Vencimento em <span className="font-bold text-slate-700">{formatDate(selectedInvoice.dueDate)}</span></p>
                                                </div>
                                            </div>

                                            {/* Mini Category Breakdown */}
                                            {invoiceCategoryBreakdown.length > 0 && (
                                                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Resumo de Gastos</h4>
                                                    <div className="flex items-end gap-1 h-16 mb-2">
                                                        {invoiceCategoryBreakdown.slice(0, 6).map((cat, idx) => {
                                                            const heightPct = Math.max((cat.value / selectedInvoice.amount) * 100, 10);
                                                            const opacityClass = idx === 0 ? 'opacity-100' : idx === 1 ? 'opacity-80' : idx === 2 ? 'opacity-60' : 'opacity-40';
                                                            return (
                                                                <div key={cat.name} className="flex-1 flex flex-col justify-end items-center group relative">
                                                                    <div
                                                                        className={`w-full mx-0.5 rounded-t-md ${colorClasses.bgSolid} ${opacityClass} hover:opacity-100 transition-all`}
                                                                        style={{ height: `${heightPct}%` }}
                                                                    ></div>
                                                                    {/* Tooltip */}
                                                                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white text-xs p-2 rounded z-20 whitespace-nowrap">
                                                                        {cat.name}: {formatCurrency(cat.value)}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold border-t border-slate-100 pt-2">
                                                        {invoiceCategoryBreakdown.slice(0, 4).map(cat => <span key={cat.name}>{cat.name}</span>)}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Transaction List */}
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Lançamentos ({selectedInvoice.transactions.length})</h4>
                                                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                                    {selectedInvoice.transactions.length === 0 ? (
                                                        <div className="p-8 text-center text-slate-400">Nenhum lançamento nesta fatura.</div>
                                                    ) : (
                                                        selectedInvoice.transactions.map((t, idx) => (
                                                            <div key={t.id} className={`flex justify-between items-center p-4 hover:bg-slate-50 transition-colors ${idx !== selectedInvoice.transactions.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                                        <ShoppingBag size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-700 text-sm">{t.description}</p>
                                                                        <div className="flex gap-2 text-[10px] text-slate-400 uppercase font-semibold mt-0.5">
                                                                            <span>{formatDate(t.date)}</span>
                                                                            <span>•</span>
                                                                            <span>{t.category}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="font-mono font-bold text-slate-700 block">{formatCurrency(t.amount)}</span>
                                                                    {t.installmentTotal && t.installmentTotal > 1 && (
                                                                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">
                                                                            {t.installmentCurrent}/{t.installmentTotal}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                                            <Calendar size={48} className="mb-4"/>
                                            <p>Selecione uma fatura para ver os detalhes.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                             <div className="p-6 space-y-2 h-full overflow-y-auto custom-scrollbar">
                                {transactions.filter(t => t.cardId === card.id).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                                        <ShoppingBag size={48} className="mb-4"/>
                                        <p>Nenhuma compra registrada neste cartão.</p>
                                    </div>
                                ) : (
                                    transactions.filter(t => t.cardId === card.id).sort((a,b) => b.date.localeCompare(a.date)).map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all group shadow-sm">
                                             <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-500 group-hover:shadow-sm transition-all">
                                                    <ShoppingBag size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700">{t.description}</p>
                                                    <p className="text-xs text-slate-400">{formatDate(t.date)} • {t.category}</p>
                                                </div>
                                             </div>
                                             <div className="text-right">
                                                 <p className="font-mono font-bold text-slate-800">{formatCurrency(t.amount)}</p>
                                                 {t.installmentTotal && t.installmentTotal > 1 && (
                                                     <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                                                         {t.installmentCurrent}/{t.installmentTotal}
                                                     </span>
                                                 )}
                                             </div>
                                        </div>
                                    ))
                                )}
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardDetailModal;
