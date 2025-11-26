﻿import React, { useState } from 'react';
import { Account, CreditCard, Transaction, Recurrence } from '../types';
import { formatCurrency, getLocalDateString } from '../utils/financeUtils';
import { Plus, CreditCard as CreditCardIcon, Landmark, Wallet, Trash2, Edit2, Wifi, Eye, Briefcase } from 'lucide-react';
import AccountModal from './AccountModal';
import CardDetailModal from './CardDetailModal';
import AccountDetailModal from './AccountDetailModal';
import Card from './ui/Card';
import Button from './ui/Button';
import { ActionIcon } from './ui/IconButton';
import EmptyState from './ui/EmptyState';
import { getColorClasses } from '../styles/tokens';

interface AccountManagerProps {
  accounts: Account[];
  creditCards: CreditCard[];
  transactions: Transaction[];
  recurrences: Recurrence[];
  projectedTransactions?: Transaction[];
  onAddAccount: (account: Account) => void;
  onAddCard: (card: CreditCard) => void;
  onUpdateAccount: (account: Account) => void;
  onUpdateCard: (card: CreditCard) => void;
  onDeleteAccount: (id: string) => void;
  onDeleteCard: (id: string) => void;
}

const AccountManager: React.FC<AccountManagerProps> = ({
  accounts, creditCards, transactions, recurrences, projectedTransactions = [],
  onAddAccount, onAddCard, onUpdateAccount, onUpdateCard,
  onDeleteAccount, onDeleteCard
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | undefined>(undefined);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | undefined>(undefined);

  // Detail Modals
  const [viewCard, setViewCard] = useState<CreditCard | null>(null);
  const [viewAccount, setViewAccount] = useState<Account | null>(null);

  const handleSaveAccount = (acc: Account) => {
    if (accountToEdit) {
      onUpdateAccount(acc);
    } else {
      onAddAccount(acc);
    }
    setAccountToEdit(undefined);
  };

  const handleSaveCard = (card: CreditCard) => {
    if (cardToEdit) {
      onUpdateCard(card);
    } else {
      onAddCard(card);
    }
    setCardToEdit(undefined);
  };

  const handleAddNew = () => {
    setAccountToEdit(undefined);
    setCardToEdit(undefined);
    setIsModalOpen(true);
  };

  // Calcula saldo REAL atual de cada conta considerando transações efetivadas
  const calculateRealBalance = (account: Account) => {
    const today = getLocalDateString();

    // Pega TODAS as transações da conta (removido filtro de status para debug)
    const accountTransactions = transactions.filter(t =>
      t.accountId === account.id &&
      t.date <= today
    );


    const transactionsTotal = accountTransactions.reduce((sum, t) => {
      if (t.type === 'income') return sum + t.amount;
      if (t.type === 'expense' || t.type === 'daily' || t.type === 'economy') return sum - t.amount;
      return sum;
    }, 0);


    return account.initialBalance + transactionsTotal;
  };

  // Separating accounts
  const checkingAccounts = accounts.filter(a => a.type !== 'investment');
  const walletAccounts = accounts.filter(a => a.type === 'investment');

  const totalBalance = checkingAccounts.reduce((acc, curr) => acc + calculateRealBalance(curr), 0);
  const totalInvested = walletAccounts.reduce((acc, curr) => acc + calculateRealBalance(curr), 0);
  const totalCreditLimit = creditCards.reduce((acc, curr) => acc + (curr.limit || 0), 0);

  // Account Card Component
  const AccountCard = ({ acc, isInvestment = false }: { acc: Account; isInvestment?: boolean }) => {
    const colorClasses = getColorClasses(acc.color);
    const accountLabel = isInvestment ? 'Carteira de Investimentos' : acc.type === 'checking' ? 'Conta Corrente' : acc.type === 'savings' ? 'Poupança' : 'Dinheiro';
    const realBalance = calculateRealBalance(acc);
    const isPositive = realBalance >= 0;

    return (
      <div
        onClick={() => setViewAccount(acc)}
        className={`relative group overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border ${colorClasses.border} border-opacity-30 shadow-[0_8px_30px_-8px_rgba(15,23,42,0.12)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] hover:-translate-y-2 hover:border-opacity-60 cursor-pointer`}
      >
        {/* Fundo colorido sutil */}
        <div className={`absolute inset-0 ${colorClasses.bg} opacity-[0.08] pointer-events-none`}></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        {/* Actions */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all flex gap-1.5 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); setAccountToEdit(acc); setCardToEdit(undefined); setIsModalOpen(true); }}
            className={`p-2 rounded-lg ${colorClasses.bg} ${colorClasses.text} hover:scale-110 transition-all shadow-md`}
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteAccount(acc.id); }}
            className="p-2 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white transition-all shadow-md hover:scale-110"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="relative z-[1]">
          <div className="flex justify-between items-start mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colorClasses.bgSolid} shadow-lg`}>
              {isInvestment ? (
                <Briefcase size={28} className="text-white"/>
              ) : acc.type === 'cash' ? (
                <Wallet size={28} className="text-white"/>
              ) : acc.type === 'savings' ? (
                <Briefcase size={28} className="text-white" />
              ) : (
                <Landmark size={28} className="text-white" />
              )}
            </div>
          </div>

          <div className="space-y-1 mb-6">
            <h4 className="text-xl font-bold text-slate-800">{acc.name}</h4>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${colorClasses.bg} ${colorClasses.text}`}>
                {accountLabel}
              </span>
            </div>
          </div>

          <div className={`pt-4 border-t-2 ${colorClasses.border} border-opacity-25`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Saldo Atual</p>
            <p className={`text-3xl font-bold font-mono tracking-tight ${isPositive ? 'text-slate-800' : 'text-rose-600'}`}>
              {formatCurrency(realBalance)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Credit Card Component
  const CreditCardComponent = ({ card }: { card: CreditCard }) => {
    const colorClasses = getColorClasses(card.color);

    // Mapeamento de cores sólidas para cartões
    const cardColorMap: Record<string, string> = {
      blue: 'from-blue-600 to-blue-800',
      indigo: 'from-indigo-600 to-indigo-900',
      purple: 'from-purple-600 to-purple-900',
      emerald: 'from-emerald-700 to-emerald-900',
      rose: 'from-rose-600 to-rose-800',
      amber: 'from-amber-700 to-amber-900',
      orange: 'from-orange-700 to-orange-900',
      yellow: 'from-yellow-700 to-yellow-900',
      lime: 'from-lime-700 to-lime-900',
      teal: 'from-teal-700 to-teal-900',
      cyan: 'from-cyan-700 to-cyan-900',
      sky: 'from-sky-700 to-sky-900',
      violet: 'from-violet-600 to-violet-900',
      fuchsia: 'from-fuchsia-600 to-fuchsia-900',
      pink: 'from-pink-600 to-pink-900',
      slate: 'from-slate-700 to-slate-900',
    };

    const gradientClass = cardColorMap[card.color] || 'from-slate-700 to-slate-900';

    return (
      <div
        onClick={() => setViewCard(card)}
        className={`relative h-56 rounded-2xl p-6 text-white shadow-2xl transition-all hover:scale-[1.03] hover:shadow-3xl duration-300 overflow-hidden group cursor-pointer bg-gradient-to-br ${gradientClass}`}
      >
        {/* Textura e Efeitos */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-black/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2">
              <div className="w-12 h-8 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-md flex items-center justify-center relative overflow-hidden border border-yellow-500/30 shadow-lg">
                <div className="absolute w-[1px] h-full bg-yellow-700/30 left-1/3"></div>
                <div className="absolute w-[1px] h-full bg-yellow-700/30 right-1/3"></div>
                <div className="absolute h-[1px] w-full bg-yellow-700/30 top-1/2"></div>
              </div>
              <Wifi size={22} className="rotate-90 opacity-80 drop-shadow" />
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <button
                onClick={(e) => { e.stopPropagation(); setCardToEdit(card); setAccountToEdit(undefined); setIsModalOpen(true); }}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-md transition-all shadow-lg"
              >
                <Edit2 size={14}/>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id); }}
                className="p-2 bg-white/20 hover:bg-rose-500/80 rounded-lg backdrop-blur-md transition-all shadow-lg"
              >
                <Trash2 size={14}/>
              </button>
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <p className="text-sm font-mono opacity-80 tracking-[0.25em]">···· ···· ···· {String(Math.floor(Math.random() * 10000)).padStart(4, '0')}</p>
            <h4 className="text-2xl font-bold tracking-wide text-white drop-shadow-lg">{card.name}</h4>
          </div>

          <div className="flex justify-between items-end pt-4 border-t border-white/10">
            <div>
              <p className="text-[10px] uppercase opacity-70 mb-1 tracking-wider">Limite Total</p>
              <p className="text-lg font-bold font-mono drop-shadow">{formatCurrency(card.limit || 0)}</p>
            </div>
            <div className="text-right">
              <div className="mb-2 flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-all duration-300">
                <Eye size={14} /> <span className="text-xs font-bold tracking-wide">DETALHES</span>
              </div>
              <div className="text-[11px] flex gap-3 opacity-90 font-medium">
                <span>Fecha: <strong>{card.closingDay}</strong></span>
                <span>Vence: <strong>{card.dueDay}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-500">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Liquidez Card */}
        <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-emerald-600/20 shadow-[0_8px_30px_-8px_rgba(5,150,105,0.15)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(5,150,105,0.25)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent pointer-events-none"></div>
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-100 rounded-xl shadow-sm">
                <Landmark size={20} className="text-emerald-700" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/70">Liquidez</span>
              </div>
            </div>
            <p className="text-4xl font-bold tracking-tight font-mono text-slate-800">{formatCurrency(totalBalance)}</p>
            <p className="text-xs text-slate-400 mt-2">Disponível em contas</p>
          </div>
        </div>

        {/* Investimentos Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 rounded-2xl p-6 border border-white/10 shadow-[0_8px_30px_-8px_rgba(15,23,42,0.4)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(99,102,241,0.4)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl shadow-sm">
                <Briefcase size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Investimentos</span>
              </div>
            </div>
            <p className="text-4xl font-bold tracking-tight font-mono text-white">{formatCurrency(totalInvested)}</p>
            <p className="text-xs text-white/50 mt-2">Total investido</p>
          </div>
        </div>

        {/* Crédito Card */}
        <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-indigo-600/20 shadow-[0_8px_30px_-8px_rgba(79,70,229,0.15)] transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.25)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent pointer-events-none"></div>
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-100 rounded-xl shadow-sm">
                <CreditCardIcon size={20} className="text-indigo-700" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700/70">Crédito</span>
              </div>
            </div>
            <p className="text-4xl font-bold tracking-tight font-mono text-slate-800">{formatCurrency(totalCreditLimit)}</p>
            <p className="text-xs text-slate-400 mt-2">Limite disponível</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-800">Gerenciamento</h3>
        <Button
          variant="primary"
          icon={<Plus size={20} />}
          onClick={handleAddNew}
        >
          Adicionar
        </Button>
      </div>

      {/* Banking Accounts List */}
      {checkingAccounts.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Contas Correntes & Caixas</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {checkingAccounts.map(acc => (
              <AccountCard key={acc.id} acc={acc} />
            ))}
          </div>
        </div>
      )}

      {/* Investment Wallets List */}
      {walletAccounts.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Carteiras de Investimento</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {walletAccounts.map(acc => (
              <AccountCard key={acc.id} acc={acc} isInvestment />
            ))}
          </div>
        </div>
      )}

      {/* Credit Cards List */}
      {creditCards.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Cartões de Crédito</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {creditCards.map(card => (
              <CreditCardComponent key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {accounts.length === 0 && creditCards.length === 0 && (
        <EmptyState
          icon={<Wallet size={32} />}
          title="Nenhuma conta cadastrada"
          description="Adicione suas contas bancárias e cartões de crédito para começar a gerenciar suas finanças."
          action={{
            label: 'Adicionar Conta',
            onClick: handleAddNew,
            icon: <Plus size={16} />
          }}
        />
      )}

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveAccount={handleSaveAccount}
        onSaveCard={handleSaveCard}
        onDeleteAccount={onDeleteAccount}
        onDeleteCard={onDeleteCard}
        accountToEdit={accountToEdit}
        cardToEdit={cardToEdit}
      />

      <CardDetailModal
        card={viewCard}
        transactions={transactions}
        recurrences={recurrences}
        onClose={() => setViewCard(null)}
      />

      <AccountDetailModal
        account={viewAccount}
        transactions={transactions}
        projectedTransactions={projectedTransactions}
        recurrences={recurrences}
        onClose={() => setViewAccount(null)}
      />
    </div>
  );
};

export default AccountManager;
