
export type TransactionType = 'income' | 'expense' | 'daily' | 'economy';
export type TransactionStatus = 'pending' | 'paid';
export type RecurrenceFrequency = 'daily' | 'monthly';

// Tabela: accounts
export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'investment'; // Added investment
  initialBalance: number;
  color: string;
}

// Tabela: credit_cards
export interface CreditCard {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  limit: number;
  color: string;
}

// Tabela: transactions
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  status: TransactionStatus;
  
  // Relacionamentos (Foreign Keys)
  accountId?: string; // Link para conta bancária (se débito/dinheiro)
  cardId?: string;    // Link para cartão de crédito (se crédito)
  
  // Lógica de Simulação e Projeção do App
  isSimulation?: boolean;
  isProjected?: boolean;

  // Parcelamento
  installmentCurrent?: number;
  installmentTotal?: number;
  originalTransactionId?: string;
}

// Tabela: recurring_rules
export interface Recurrence {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: RecurrenceFrequency;
  startFrom: string; // Data de início
  endDate?: string;
  occurrenceCount?: number;
  active: boolean;
  
  // Se frequency == 'monthly', usa isso. Se 'daily', ignora.
  dayOfMonth: number; 

  // Relacionamentos
  targetAccountId?: string;
  targetCardId?: string;
}

export interface RecurrenceOverride {
  id: string;
  recurrenceId: string;
  effectiveFrom: string; // date the override applies from
  scope: 'single' | 'from_here';
  deleteFlag?: boolean;
  amount?: number;
  description?: string;
  category?: string;
  targetAccountId?: string;
  targetCardId?: string;
  status?: TransactionStatus;
  createdAt?: string;
}

export interface HealthLevel {
    id: string;
    label: string;
    min: number | null; // null = -Infinity
    max: number | null; // null = Infinity
    color: string; // tailwind color name (e.g., 'rose', 'emerald')
}

export interface UserSettings {
    healthLevels: HealthLevel[];
    customCategories: {
        income: string[];
        expense: string[];
        daily: string[];
        economy: string[];
    };
}

export interface DailyBalance {
  date: string;
  startBalance: number;
  totalIncome: number;
  totalExpense: number; 
  totalDaily: number;
  totalEconomy: number; 
  endBalance: number;
  transactions: Transaction[];
  healthColor: string; // Agora dinâmico
}

export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalSavings: number;
  savingsRate: number;
}

// Defaults
export const DEFAULT_CATEGORIES = {
    income: ['Salário', 'Freela', 'Rendimentos', 'Reembolso', 'Outros'],
    expense: ['Moradia', 'Contas Fixas', 'Assinaturas', 'Educação', 'Saúde', 'Transporte', 'Impostos', 'Outros'],
    daily: ['Mercado', 'Lanche', 'Combustível', 'Lazer', 'Farmácia', 'Uber/Taxi', 'Outros'],
    economy: ['Reserva de Emergência', 'Ações', 'FIIs', 'Renda Fixa', 'Cripto', 'Poupança', 'Outros']
};

export const DEFAULT_HEALTH_LEVELS: HealthLevel[] = [
    { id: 'critical', label: 'Crítico', min: null, max: 0, color: 'rose' },
    { id: 'urgent', label: 'Urgente', min: 0, max: 1000, color: 'orange' },
    { id: 'warning', label: 'Atenção', min: 1000, max: 3000, color: 'amber' },
    { id: 'healthy', label: 'Saudável', min: 3000, max: 10000, color: 'emerald' },
    { id: 'abundant', label: 'Abundante', min: 10000, max: null, color: 'indigo' },
];
