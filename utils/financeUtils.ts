
import { Transaction, DailyBalance, Account, CreditCard, MonthlySummary, Recurrence, HealthLevel, RecurrenceOverride } from '../types';

export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Retorna a data atual no timezone local no formato YYYY-MM-DD
 * Evita problemas com UTC que podem causar diferença de um dia
 */
export const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const getDaysInMonth = (year: number, month: number) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date).toISOString().split('T')[0]);
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const calculateCreditCardDueDate = (purchaseDate: string, closingDay: number, dueDay: number): string => {
  const pDate = new Date(purchaseDate + 'T00:00:00');
  const pDay = pDate.getDate();
  
  let invoiceMonth = pDate.getMonth();
  let invoiceYear = pDate.getFullYear();

  if (pDay >= closingDay) {
    invoiceMonth++;
    if (invoiceMonth > 11) {
        invoiceMonth = 0;
        invoiceYear++;
    }
  }

  let dueMonth = invoiceMonth;
  let dueYear = invoiceYear;

  if (dueDay < closingDay) {
      dueMonth++;
      if (dueMonth > 11) {
          dueMonth = 0;
          dueYear++;
      }
  }

  const dueDate = new Date(dueYear, dueMonth, dueDay);
  return dueDate.toISOString().split('T')[0];
};

export const processCreditCardTransaction = (
    baseTransaction: Partial<Transaction>,
    card: CreditCard,
    installments: number
): Transaction[] => {
    const results: Transaction[] = [];
    const purchaseDate = baseTransaction.purchaseDate || baseTransaction.date || getLocalDateString();
    const amountPerInstallment = (baseTransaction.amount || 0) / installments;

    let currentDueDateStr = calculateCreditCardDueDate(purchaseDate, card.closingDay, card.dueDay);

    for (let i = 0; i < installments; i++) {
        const tDate = new Date(currentDueDateStr + 'T00:00:00');
        if (i > 0) {
            tDate.setMonth(tDate.getMonth() + i);
        }

        const dateStr = tDate.toISOString().split('T')[0];

        results.push({
            id: generateUUID(),
            description: installments > 1
                ? `${baseTransaction.description} (${i + 1}/${installments})`
                : baseTransaction.description || '',
            amount: amountPerInstallment,
            date: dateStr, // Data do vencimento da fatura
            purchaseDate: purchaseDate, // Data real da compra
            type: 'expense',
            category: baseTransaction.category || 'Outros',
            status: 'pending',
            cardId: card.id,
            isSimulation: baseTransaction.isSimulation,
            installmentCurrent: i + 1,
            installmentTotal: installments,
            originalTransactionId: baseTransaction.id
        });
    }

    return results;
};

// Helper to determine health color
const getHealthColor = (balance: number, levels: HealthLevel[]): string => {
    const normalizeBoundary = (value: any, fallback: number) => {
        if (value === null || value === undefined || value === '') return fallback;
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    };

    const balanceNum = Number(balance);
    if (!Number.isFinite(balanceNum)) {
        return 'slate';
    }

    const normalized = levels.map(l => ({
        ...l,
        min: normalizeBoundary(l.min, -Infinity),
        max: normalizeBoundary(l.max, Infinity),
    }));

    const sorted = normalized.sort((a, b) => {
        if (a.min === b.min) {
            return (a.max ?? Infinity) - (b.max ?? Infinity);
        }
        return a.min - b.min;
    });

    const match = sorted.find(l => balanceNum >= l.min && balanceNum < l.max);
    return match ? match.color : 'slate';
};

export const calculateTimeline = (
  manualTransactions: Transaction[],
  accounts: Account[],
  creditCards: CreditCard[],
  recurrences: Recurrence[],
  startDate: string,
  daysToProject: number = 365,
  healthLevels: HealthLevel[],
  recurrenceOverrides: RecurrenceOverride[] = []
): DailyBalance[] => {
  
  // Initial Balance considers only liquid assets (not investments/wallets) usually, 
  // but requested to show balance. We sum everything that isn't a future card debt.
  let runningBalance = accounts.filter(a => a.type !== 'investment').reduce((acc, curr) => acc + curr.initialBalance, 0);
  
  const parseDateSafe = (value: string) => {
      const d = new Date(value + 'T00:00:00');
      return Number.isNaN(d.getTime()) ? null : d;
  };

  const startCandidate = parseDateSafe(startDate) || new Date(startDate);

  const earliestTxDate = manualTransactions.reduce<Date | null>((min, tx) => {
      const d = parseDateSafe(tx.date);
      if (!d) return min;
      if (!min || d < min) return d;
      return min;
  }, null);

  const effectiveStart = earliestTxDate && earliestTxDate < startCandidate ? earliestTxDate : startCandidate;
  const extraDays = Math.max(0, Math.ceil((startCandidate.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = daysToProject + extraDays;

  // Apply historical transactions prior to the effective start so the running balance is real
  const effectiveStartStr = effectiveStart.toISOString().split('T')[0];
  const pastTransactions = manualTransactions.filter(t => t.date < effectiveStartStr);
  pastTransactions.forEach(t => {
      if (t.type === 'income') {
          runningBalance += t.amount;
      } else {
          runningBalance -= t.amount;
      }
  });
  
  const timeline: DailyBalance[] = [];
  const start = effectiveStart;
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + totalDays);

  const projectedRecurrences: Transaction[] = [];
  const makeUTCDate = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day));

  const byCreatedAt = (a: RecurrenceOverride, b: RecurrenceOverride) => {
      const ca = a.createdAt || '';
      const cb = b.createdAt || '';
      return ca.localeCompare(cb);
  };

  const getOverrideForDate = (recurrenceId: string, dateStr: string): RecurrenceOverride | null => {
      const singles = recurrenceOverrides
          .filter(o => o.recurrenceId === recurrenceId && o.scope === 'single' && o.effectiveFrom === dateStr)
          .sort(byCreatedAt);
      if (singles.length > 0) return singles[singles.length - 1];

      const candidates = recurrenceOverrides
          .filter(o => o.recurrenceId === recurrenceId && o.scope === 'from_here' && o.effectiveFrom <= dateStr)
          .sort((a, b) => {
              if (a.effectiveFrom === b.effectiveFrom) return byCreatedAt(a, b);
              return a.effectiveFrom.localeCompare(b.effectiveFrom);
          });
      if (candidates.length === 0) return null;
      return candidates[candidates.length - 1];
  };

  const applyOverrideToProjection = (
      baseTx: Transaction,
      override: RecurrenceOverride | null
  ): Transaction | null => {
      if (!override) return baseTx;
      if (override.deleteFlag) return null;

      const next: Transaction = { ...baseTx };

      if (override.amount !== undefined && override.amount !== null) next.amount = override.amount;
      if (override.description) next.description = override.description;
      if (override.category) next.category = override.category;
      if (override.status) next.status = override.status;

      if (override.targetCardId) {
          next.cardId = override.targetCardId;
          next.accountId = undefined;
          next.type = 'expense';
          const card = creditCards.find(c => c.id === override.targetCardId);
          if (card) {
              next.date = calculateCreditCardDueDate(baseTx.date, card.closingDay, card.dueDay);
          }
      } else if (override.targetAccountId) {
          next.accountId = override.targetAccountId;
          next.cardId = undefined;
      }

      return next;
  };

  // DEBUG helper: expõe overrides para inspeção no console
  if (typeof window !== 'undefined') {
      (window as any).__fluxoOverrides = recurrenceOverrides;
  }
  
  // Só projetar recorrências ativas; inativas não geram novas projeções
  const applicableRecurrences = recurrences.filter(r => r.active);

  applicableRecurrences.forEach(r => {
      const recurrenceStart = new Date(r.startFrom);
      const endLimit = r.endDate ? new Date(r.endDate + 'T00:00:00') : null;
      const maxOccurrences = r.occurrenceCount || null;
      let occurrences = 0;
      
      if (r.frequency === 'daily') {
          let cursor = new Date(recurrenceStart > start ? recurrenceStart : start);
          while (cursor < endDate) {
              if (endLimit && cursor > endLimit) break;
              if (maxOccurrences && occurrences >= maxOccurrences) break;
              const dateStr = cursor.toISOString().split('T')[0];
              // Verificar se já existe uma transação real para este dia/descrição/valor
              const alreadyExists = manualTransactions.some(t =>
                  t.date === dateStr &&
                  t.description === r.description &&
                  Math.abs(t.amount - r.amount) < 0.1
              );

              if (!alreadyExists) {
                  const baseTx: Transaction = {
                      id: `proj-daily-${r.id}-${dateStr}`,
                      description: r.description,
                      amount: r.amount,
                      date: dateStr,
                      type: r.type,
                      category: r.category,
                      status: 'pending',
                      accountId: r.targetAccountId,
                      cardId: r.targetCardId,
                      isProjected: true,
                      originalTransactionId: r.id
                  };

                  const override = getOverrideForDate(r.id, dateStr);
                  const finalTx = applyOverrideToProjection(baseTx, override);
                  if (finalTx && override && typeof window !== 'undefined') {
                      console.log('[override-applied]', { recurrenceId: r.id, date: dateStr, override });
                  }
                  if (finalTx) {
                      projectedRecurrences.push(finalTx);
                  }
              }
              occurrences++;
              cursor.setDate(cursor.getDate() + 1);
          }
      } 
      else {
          // Use UTC math to avoid timezone drift (e.g., day 15 caindo como 16)
          let base = recurrenceStart > start ? recurrenceStart : start;
          let cursor = makeUTCDate(base.getUTCFullYear(), base.getUTCMonth(), r.dayOfMonth);
          if (cursor < base) {
              cursor.setUTCMonth(cursor.getUTCMonth() + 1);
              cursor = makeUTCDate(cursor.getUTCFullYear(), cursor.getUTCMonth(), r.dayOfMonth);
          }

          while (cursor < endDate) {
              if (endLimit && cursor > endLimit) break;
              if (maxOccurrences && occurrences >= maxOccurrences) break;
              const purchaseDateStr = cursor.toISOString().split('T')[0];
              
              // Only project if date is on/after the recurrence start
              if (purchaseDateStr >= r.startFrom) {
                  let effectiveDateStr = purchaseDateStr;
                  let effectiveType = r.type;

                  if (r.targetCardId) {
                      const card = creditCards.find(c => c.id === r.targetCardId);
                      if (card) {
                          effectiveDateStr = calculateCreditCardDueDate(purchaseDateStr, card.closingDay, card.dueDay);
                          effectiveType = 'expense'; 
                      }
                  }

                  const alreadyExists = manualTransactions.some(t => 
                      t.date === effectiveDateStr && 
                      t.description === r.description && 
                      Math.abs(t.amount - r.amount) < 0.1
                  );

                  if (!alreadyExists) {
                      const baseTx: Transaction = {
                          id: `proj-monthly-${r.id}-${effectiveDateStr}`,
                          description: r.description,
                          amount: r.amount,
                          date: effectiveDateStr,
                          type: effectiveType,
                          category: r.category,
                          status: 'pending',
                          accountId: r.targetAccountId,
                          cardId: r.targetCardId,
                          isProjected: true,
                          originalTransactionId: r.id
                      };

                      const override = getOverrideForDate(r.id, effectiveDateStr);
                      const finalTx = applyOverrideToProjection(baseTx, override);
                      if (finalTx && override && typeof window !== 'undefined') {
                          console.log('[override-applied]', { recurrenceId: r.id, date: effectiveDateStr, override });
                      }
                      if (finalTx) {
                          projectedRecurrences.push(finalTx);
                      }
                  }
              }
              occurrences++;
              cursor.setUTCMonth(cursor.getUTCMonth() + 1);
              cursor = makeUTCDate(cursor.getUTCFullYear(), cursor.getUTCMonth(), r.dayOfMonth);
          }
      }
  });

  const allProjections = [...manualTransactions, ...projectedRecurrences];

  for (let i = 0; i < daysToProject; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dateStr = current.toISOString().split('T')[0];

    const daysTransactions = allProjections.filter(t => t.date === dateStr);
    
    const income = daysTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = daysTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const daily = daysTransactions.filter(t => t.type === 'daily').reduce((acc, t) => acc + t.amount, 0);
    const economy = daysTransactions.filter(t => t.type === 'economy').reduce((acc, t) => acc + t.amount, 0);

    const totalOut = expense + daily + economy;
    const startBal = runningBalance;
    const endBal = startBal + income - totalOut;

    timeline.push({
      date: dateStr,
      startBalance: startBal,
      totalIncome: income,
      totalExpense: expense,
      totalDaily: daily,
      totalEconomy: economy,
      endBalance: endBal,
      transactions: daysTransactions,
      healthColor: getHealthColor(endBal, healthLevels)
    });

    runningBalance = endBal;
  }

  return timeline;
};

export const calculateEconomy = (transactions: Transaction[]): MonthlySummary[] => {
    const monthlyData: Record<string, { income: number; saved: number }> = {};

    transactions.forEach(t => {
        const monthKey = t.date.substring(0, 7); 
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, saved: 0 };
        }

        if (t.type === 'income') {
            monthlyData[monthKey].income += t.amount;
        } 
        
        if (t.type === 'economy') {
            monthlyData[monthKey].saved += t.amount;
        }
    });

    return Object.keys(monthlyData).sort().map(key => {
        const { income, saved } = monthlyData[key];
        return {
            month: key,
            totalIncome: income,
            totalSavings: saved,
            savingsRate: income > 0 ? (saved / income) * 100 : 0
        };
    });
};

export const groupDataByCategory = (transactions: Transaction[], type: 'income' | 'expense') => {
    const grouped: Record<string, number> = {};
    transactions.filter(t => {
        if (type === 'income') return t.type === 'income';
        return t.type === 'expense' || t.type === 'daily' || t.type === 'economy';
    }).forEach(t => {
        const cat = t.category || 'Outros';
        grouped[cat] = (grouped[cat] || 0) + t.amount;
    });

    return Object.keys(grouped).map(key => ({
        name: key,
        value: grouped[key]
    })).sort((a, b) => b.value - a.value);
};

export const groupDailyToMonthly = (timeline: DailyBalance[]) => {
    const monthly: Record<string, { 
        name: string, 
        income: number, 
        expense: number, 
        balance: number 
    }> = {};

    timeline.forEach(day => {
        const monthKey = day.date.substring(0, 7); // YYYY-MM
        if (!monthly[monthKey]) {
            monthly[monthKey] = { 
                name: monthKey, 
                income: 0, 
                expense: 0, 
                balance: 0 
            };
        }
        monthly[monthKey].income += day.totalIncome;
        monthly[monthKey].expense += (day.totalExpense + day.totalDaily + day.totalEconomy);
        // Balance is always the end balance of the last processed day of that month
        monthly[monthKey].balance = day.endBalance;
    });

    return Object.values(monthly).sort((a, b) => a.name.localeCompare(b.name));
}


// Invoice Helper
export interface CardInvoice {
    monthKey: string; // YYYY-MM
    dueDate: string;
    amount: number;
    status: 'open' | 'closed' | 'future';
    transactions: Transaction[];
}

export const getCardInvoices = (card: CreditCard, transactions: Transaction[]): CardInvoice[] => {
    const invoices: Record<string, CardInvoice> = {};
    const cardTxs = transactions.filter(t => t.cardId === card.id);

    cardTxs.forEach(t => {
        // Agrupar pela data de vencimento (que é a data da transação no fluxo)
        const dateParts = t.date.split('-');
        const monthKey = `${dateParts[0]}-${dateParts[1]}`;
        
        if (!invoices[monthKey]) {
            invoices[monthKey] = {
                monthKey,
                dueDate: t.date, // A data da transação de cartão no fluxo É o vencimento
                amount: 0,
                status: 'future',
                transactions: []
            };
        }
        
        invoices[monthKey].amount += t.amount;
        invoices[monthKey].transactions.push(t);
    });

    const today = getLocalDateString();

    return Object.values(invoices).map(inv => {
        if (inv.dueDate < today) inv.status = 'closed';
        else if (inv.dueDate.substring(0,7) === today.substring(0,7)) inv.status = 'open';
        else inv.status = 'future';
        return inv;
    }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};
