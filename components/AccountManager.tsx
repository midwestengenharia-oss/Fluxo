﻿import React, { useState } from 'react';
import { Account, CreditCard, Transaction, Recurrence } from '../types';
import { formatCurrency } from '../utils/financeUtils';
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
  onDeleteAccount: (id: string) => void;
  onDeleteCard: (id: string) => void;
}

const AccountManager: React.FC<AccountManagerProps> = ({
  accounts, creditCards, transactions, recurrences, projectedTransactions = [],
  onAddAccount, onAddCard,
  onDeleteAccount, onDeleteCard
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | undefined>(undefined);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | undefined>(undefined);

  // Detail Modals
  const [viewCard, setViewCard] = useState<CreditCard | null>(null);
  const [viewAccount, setViewAccount] = useState<Account | null>(null);

  const handleSaveAccount = (acc: Account) => {
    if (accountToEdit) onDeleteAccount(acc.id);
    onAddAccount(acc);
    setAccountToEdit(undefined);
  };

  const handleSaveCard = (card: CreditCard) => {
    if (cardToEdit) onDeleteCard(card.id);
    onAddCard(card);
    setCardToEdit(undefined);
  };

  const handleAddNew = () => {
    setAccountToEdit(undefined);
    setCardToEdit(undefined);
    setIsModalOpen(true);
  };

  // Separating accounts
  const checkingAccounts = accounts.filter(a => a.type !== 'investment');
  const walletAccounts = accounts.filter(a => a.type === 'investment');

  const totalBalance = checkingAccounts.reduce((acc, curr) => acc + curr.initialBalance, 0);
  const totalInvested = walletAccounts.reduce((acc, curr) => acc + curr.initialBalance, 0);
  const totalCreditLimit = creditCards.reduce((acc, curr) => acc + (curr.limit || 0), 0);

  // Account Card Component
  const AccountCard = ({ acc, isInvestment = false }: { acc: Account; isInvestment?: boolean }) => {
    const colorClasses = getColorClasses(acc.color);
    const accountLabel = isInvestment ? 'Carteira de Investimentos' : acc.type === 'checking' ? 'Conta Corrente' : 'Carteira Física';
    return (
      <Card
        variant="elevated"
        hover
        onClick={() => setViewAccount(acc)}
        className="relative group"
      >
        {/* Actions */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <ActionIcon
            icon={<Edit2 size={16} />}
            onClick={(e) => { e.stopPropagation(); setAccountToEdit(acc); setCardToEdit(undefined); setIsModalOpen(true); }}
            color="primary"
          />
          <ActionIcon
            icon={<Trash2 size={16} />}
            onClick={(e) => { e.stopPropagation(); onDeleteAccount(acc.id); }}
            color="danger"
          />
        </div>

        <div className="flex justify-between items-start mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClasses.bg} ${colorClasses.text}`}>
            {isInvestment ? <Briefcase size={28}/> : acc.type === 'cash' ? <Wallet size={28}/> : <Landmark size={28} />}
          </div>
        </div>
        <div>
          <h4 className="text-xl font-bold text-slate-800 mb-1">{acc.name}</h4>
          <p className="text-slate-800 text-sm mb-4 capitalize">{accountLabel}</p>
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <p className="text-2xl font-bold text-slate-800 font-mono tracking-tight">{formatCurrency(acc.initialBalance)}</p>
          </div>
        </div>
      </Card>
    );
  };

  // Credit Card Component
  const CreditCardComponent = ({ card }: { card: CreditCard }) => {
    const colorClasses = getColorClasses(card.color);
    return (
      <div
        onClick={() => setViewCard(card)}
        className="relative h-56 rounded-2xl p-6 text-white shadow-2xl transition-transform hover:scale-[1.02] duration-300 overflow-hidden group bg-gradient-to-br from-slate-800 to-black cursor-pointer"
      >
        {/* Holographic Overlay Effect */}
        <div className={`absolute inset-0 ${colorClasses.bgSolid} opacity-60 mix-blend-multiply pointer-events-none`}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col h-full gap-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-10 h-7 bg-yellow-200/80 rounded-md flex items-center justify-center relative overflow-hidden border border-yellow-400/50">
                <div className="absolute w-[1px] h-full bg-black/20 left-1/3"></div>
                <div className="absolute w-[1px] h-full bg-black/20 right-1/3"></div>
                <div className="absolute h-[1px] w-full bg-black/20 top-1/2"></div>
              </div>
              <Wifi size={20} className="rotate-90 opacity-70" />
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); setCardToEdit(card); setAccountToEdit(undefined); setIsModalOpen(true); }}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm"
              >
                <Edit2 size={14}/>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteCard(card.id); }}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm"
              >
                <Trash2 size={14}/>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-mono opacity-70 tracking-[0.2em]">···· ···· ···· ····</p>
            <h4 className="text-2xl font-bold tracking-wide text-white drop-shadow-md">{card.name}</h4>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] uppercase opacity-60 mb-0.5">Limite</p>
              <p className="font-bold font-mono">{formatCurrency(card.limit || 0)}</p>
            </div>
            <div className="text-right">
              <div className="mb-1 flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Eye size={12} /> <span className="text-[10px] font-bold">VER DETALHES</span>
              </div>
              <div className="text-[10px] flex gap-2 opacity-80">
                <span>Fecha: {card.closingDay}</span>
                <span>Vence: {card.dueDay}</span>
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
        <Card variant="elevated" className="relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6 opacity-60">
            <div className="p-2 bg-slate-100 rounded-lg"><Landmark size={20} /></div>
            <span className="text-xs font-bold uppercase tracking-widest">Liquidez</span>
          </div>
          <p className="text-4xl font-bold tracking-tight mb-1 font-mono">{formatCurrency(totalBalance)}</p>
        </Card>

        <Card variant="default" className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 text-white shadow-xl shadow-slate-900/40 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/15 rounded-lg"><Briefcase size={20} /></div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-white">Investimentos</span>
          </div>
          <p className="text-4xl font-bold tracking-tight mb-1 font-mono">{formatCurrency(totalInvested)}</p>
        </Card>

        <Card variant="dark" className="shadow-xl shadow-slate-900/20 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6 opacity-80">
            <div className="p-2 bg-white/10 rounded-lg"><CreditCardIcon size={20} /></div>
            <span className="text-xs font-bold uppercase tracking-widest">Crédito</span>
          </div>
          <p className="text-4xl font-bold tracking-tight mb-1 font-mono">{formatCurrency(totalCreditLimit)}</p>
        </Card>
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
