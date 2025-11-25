
import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, CalendarDays, PiggyBank, Menu, Settings as SettingsIcon, Plus, Sparkles, CreditCard, RefreshCcw, X, LogOut, Check, Trash2 } from 'lucide-react';
import { Transaction, Account, CreditCard as CreditCardType, Recurrence, TransactionType, UserSettings, DEFAULT_CATEGORIES, DEFAULT_HEALTH_LEVELS, HealthLevel, RecurrenceOverride } from './types';
import { calculateTimeline, calculateEconomy, processCreditCardTransaction, generateUUID } from './utils/financeUtils';
import { supabase } from './utils/supabaseClient';
import Dashboard from './components/Dashboard';
import CashFlow from './components/CashFlow';
import Economy from './components/Economy';
import RecurrenceManager from './components/RecurrenceManager';
import AccountManager from './components/AccountManager';
import TransactionModal from './components/TransactionModal';
import Settings from './components/Settings';
import Auth from './components/Auth';
import CardDetailModal from './components/CardDetailModal';

// --- MAPPERS (DB <-> APP) ---
const mapTypeToDB = (t: TransactionType): string => {
    if (t === 'economy') return 'INVESTMENT';
    return t.toUpperCase();
}

const mapTypeFromDB = (t: string): TransactionType => {
    const lower = t.toLowerCase();
    if (lower === 'investment') return 'economy';
    return lower as TransactionType;
}

const normalizeAccountType = (rawType: string | undefined | null): Account['type'] => {
    const t = (rawType || '').toLowerCase();
    if (['savings', 'poupanca', 'poupan�a'].includes(t)) return 'savings';
    if (['cash', 'dinheiro'].includes(t)) return 'cash';
    if (['investment', 'investimento', 'carteira', 'wallet'].includes(t)) return 'investment';
    return 'checking';
};

const mapAccountFromDB = (dbAcc: any): Account => ({
    id: dbAcc.id,
    name: dbAcc.name,
    type: normalizeAccountType(dbAcc.type),
    initialBalance: Number(dbAcc.initial_balance),
    color: dbAcc.color || 'slate'
});

const mapCardFromDB = (dbCard: any): CreditCardType => ({
    id: dbCard.id,
    name: dbCard.name,
    limit: Number(dbCard.limit),
    closingDay: dbCard.closing_day,
    dueDay: dbCard.due_day,
    color: dbCard.color || 'purple'
});

const mapTransactionFromDB = (dbTx: any): Transaction => ({
    id: dbTx.id,
    description: dbTx.description,
    amount: Number(dbTx.amount),
    date: dbTx.date,
    type: mapTypeFromDB(dbTx.type),
    category: dbTx.category || 'Outros',
    status: dbTx.status ? dbTx.status.toLowerCase() : 'pending',
    accountId: dbTx.account_id,
    cardId: dbTx.card_id,
    installmentCurrent: dbTx.installment_current,
    installmentTotal: dbTx.installment_total,
    originalTransactionId: dbTx.original_transaction_id
});

const mapRecurrenceFromDB = (dbRec: any): Recurrence => {
    return {
        id: dbRec.id,
        description: dbRec.description,
        amount: Number(dbRec.amount),
        type: mapTypeFromDB(dbRec.type),
        category: dbRec.category || 'Outros',
        frequency: dbRec.frequency.toLowerCase(),
        startFrom: dbRec.start_from,
        active: dbRec.active,
        dayOfMonth: dbRec.day_of_month ?? new Date(dbRec.start_from + 'T00:00:00').getDate(),
        endDate: dbRec.end_date || undefined,
        occurrenceCount: dbRec.occurrence_count || undefined,
        targetAccountId: dbRec.target_account_id,
        targetCardId: dbRec.target_card_id
    };
};

const mapRecurrenceOverrideFromDB = (db: any): RecurrenceOverride => ({
    id: db.id,
    recurrenceId: db.recurrence_id,
    effectiveFrom: db.effective_from,
    scope: db.scope,
    deleteFlag: db.delete_flag,
    amount: db.amount !== null && db.amount !== undefined ? Number(db.amount) : undefined,
    description: db.description || undefined,
    category: db.category || undefined,
    targetAccountId: db.target_account_id || undefined,
    targetCardId: db.target_card_id || undefined,
    status: db.status ? db.status.toLowerCase() : undefined,
    createdAt: db.created_at || undefined,
});

const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error_description) return error.error_description;
    return JSON.stringify(error);
};

// Converte string numérica em pt-BR/en-US para número ou null se inválido
const parseLocaleNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return null;

        // Formatos com milhar em pt-BR (ex: 10.000,50)
        const thousandPattern = /^\d{1,3}(\.\d{3})+(,\d+)?$/;
        if (thousandPattern.test(trimmed)) {
            const normalized = trimmed.replace(/\./g, '').replace(',', '.');
            const num = Number(normalized);
            return Number.isFinite(num) ? num : null;
        }

        // Fallback: troca vírgula por ponto para aceitar "1000,5"
        const normalized = trimmed.replace(',', '.');
        const num = Number(normalized);
        return Number.isFinite(num) ? num : null;
    }

    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

// Normaliza healthLevels para garantir que min/max sejam números ou null
const normalizeHealthLevels = (levels: any[]): HealthLevel[] => {
    if (!Array.isArray(levels)) return DEFAULT_HEALTH_LEVELS;
    return levels.map(l => ({
        id: l.id || 'unknown',
        label: l.label || 'N/A',
        color: l.color || 'slate',
        min: parseLocaleNumber(l.min),
        max: parseLocaleNumber(l.max),
    }));
};

const parseProjectedMeta = (projId: string | undefined | null) => {
    if (!projId) return null;
    const match = projId.match(/^proj-(?:daily|monthly)-(.+)-(\d{4}-\d{2}-\d{2})$/);
    if (!match) return null;
    return { recurrenceId: match[1], date: match[2] };
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'flow' | 'economy' | 'recurrence' | 'accounts' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State Real
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
  const [recurrenceOverrides, setRecurrenceOverrides] = useState<RecurrenceOverride[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
      healthLevels: DEFAULT_HEALTH_LEVELS,
      customCategories: DEFAULT_CATEGORIES
  });
  
  // State Simulation
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulatedTransactions, setSimulatedTransactions] = useState<Transaction[]>([]);
  const [simulatedDeletions, setSimulatedDeletions] = useState<string[]>([]);
  const [simulatedRecurrences, setSimulatedRecurrences] = useState<Recurrence[]>([]);
  const [simulatedRecurrenceDeletions, setSimulatedRecurrenceDeletions] = useState<string[]>([]);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined);
  const [cardToView, setCardToView] = useState<CreditCardType | null>(null);

  // --- AUTH & INIT ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) fetchData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
      else {
          setTransactions([]);
          setAccounts([]);
          setCreditCards([]);
          setRecurrences([]);
          setRecurrenceOverrides([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
      setDataLoading(true);
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const [accRes, cardRes, recRes, txRes, setRes, overrideRes] = await Promise.all([
              supabase.from('accounts').select('*').eq('user_id', user.id),
              supabase.from('credit_cards').select('*').eq('user_id', user.id),
              supabase.from('recurring_rules').select('*').eq('user_id', user.id),
              supabase.from('transactions').select('*').eq('user_id', user.id),
              supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
              supabase.from('recurrence_overrides').select('*')
          ]);

          if (accRes.data) setAccounts(accRes.data.map(mapAccountFromDB));
          if (cardRes.data) setCreditCards(cardRes.data.map(mapCardFromDB));
          if (recRes.data) setRecurrences(recRes.data.map(mapRecurrenceFromDB));
          if (txRes.data) setTransactions(txRes.data.map(mapTransactionFromDB));
          if (overrideRes.data) setRecurrenceOverrides(overrideRes.data.map(mapRecurrenceOverrideFromDB));
          
          let nextSettings: UserSettings | null = null;

          if (setRes.data) {
              nextSettings = {
                  healthLevels: normalizeHealthLevels(setRes.data.health_levels || DEFAULT_HEALTH_LEVELS),
                  customCategories: setRes.data.custom_categories || DEFAULT_CATEGORIES
              };
          } else {
              // Try to read cached local settings
              const cached = typeof window !== 'undefined' ? window.localStorage.getItem('fluxo_user_settings') : null;
              if (cached) {
                  try {
                      const parsed = JSON.parse(cached);
                      nextSettings = {
                          ...parsed,
                          healthLevels: normalizeHealthLevels(parsed.healthLevels || DEFAULT_HEALTH_LEVELS)
                      };
                  } catch (_e) { /* ignore parse error */ }
              }

              // Create defaults in Supabase if nothing cached
              if (!nextSettings) {
                  const inserted = await supabase
                      .from('user_settings')
                      .insert({
                          user_id: user.id,
                          health_levels: DEFAULT_HEALTH_LEVELS,
                          custom_categories: DEFAULT_CATEGORIES
                      })
                      .select()
                      .maybeSingle();

                  nextSettings = inserted.data ? {
                      healthLevels: normalizeHealthLevels(inserted.data.health_levels || DEFAULT_HEALTH_LEVELS),
                      customCategories: inserted.data.custom_categories || DEFAULT_CATEGORIES
                  } : {
                      healthLevels: normalizeHealthLevels(DEFAULT_HEALTH_LEVELS),
                      customCategories: DEFAULT_CATEGORIES
                  };
              }
          }

          if (nextSettings) {
              setSettings(nextSettings);
              if (typeof window !== 'undefined') {
                  window.localStorage.setItem('fluxo_user_settings', JSON.stringify(nextSettings));
              }
          }

      } catch (error) {
          console.error('Error fetching data:', error);
      } finally {
          setDataLoading(false);
      }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
  };

  const handleSaveSettings = async (newSettings: UserSettings) => {
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          const { data, error } = await supabase.from('user_settings').upsert({
              user_id: user.id,
              health_levels: newSettings.healthLevels,
              custom_categories: newSettings.customCategories
          }, { onConflict: 'user_id' }).select().maybeSingle();
          if (error) throw error;
          const nextSettings = data ? {
              healthLevels: normalizeHealthLevels(data.health_levels || DEFAULT_HEALTH_LEVELS),
              customCategories: data.custom_categories || DEFAULT_CATEGORIES
          } : { ...newSettings, healthLevels: normalizeHealthLevels(newSettings.healthLevels) };
          setSettings(nextSettings);
          if (typeof window !== 'undefined') {
              window.localStorage.setItem('fluxo_user_settings', JSON.stringify(nextSettings));
          }
          alert("Configurações salvas!");
      } catch (e) {
          if (typeof window !== 'undefined') {
              window.localStorage.setItem('fluxo_user_settings', JSON.stringify(newSettings));
          }
          alert("Erro ao salvar: " + getErrorMessage(e));
      }
  }

  const handleAddCustomCategory = async (catType: TransactionType, label: string) => {
      const trimmed = (label || '').trim();
      if (!trimmed) return;

      const updatedCategories = {
          ...settings.customCategories,
          [catType]: Array.from(new Set([...(settings.customCategories[catType] || []), trimmed]))
      };

      setSettings(prev => ({
          ...prev,
          customCategories: updatedCategories
      }));

      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { data, error } = await supabase.from('user_settings').upsert({
              user_id: user.id,
              health_levels: settings.healthLevels,
              custom_categories: updatedCategories
          }, { onConflict: 'user_id' }).select().maybeSingle();
          if (error) throw error;
          if (data) {
              setSettings(prev => ({
                  ...prev,
                  customCategories: data.custom_categories || updatedCategories
              }));
          }
      } catch (e) {
          console.error('Erro ao salvar categoria customizada:', e);
      }
  };


  // --- MERGED DATA (REAL + SIMULATION) ---
  const allTransactions = useMemo(() => {
    if (!simulationMode) return transactions;
    const activeRealTransactions = transactions.filter(t => !simulatedDeletions.includes(t.id));
    const overriddenIds = simulatedTransactions.map(t => t.id);
    const finalRealTransactions = activeRealTransactions.filter(t => !overriddenIds.includes(t.id));
    return [...finalRealTransactions, ...simulatedTransactions];
  }, [transactions, simulatedTransactions, simulatedDeletions, simulationMode]);

  const allRecurrences = useMemo(() => {
      if (!simulationMode) return recurrences;
      const activeReal = recurrences.filter(r => !simulatedRecurrenceDeletions.includes(r.id));
      return [...activeReal, ...simulatedRecurrences];
  }, [recurrences, simulatedRecurrences, simulatedRecurrenceDeletions, simulationMode]);

  const timeline = useMemo(() => {
    if (dataLoading) return [];
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    
    return calculateTimeline(
        allTransactions, 
        accounts,
        creditCards,
        allRecurrences, 
        startOfMonth, 
        365,
        settings.healthLevels,
        recurrenceOverrides
    );
  }, [allTransactions, allRecurrences, accounts, creditCards, dataLoading, settings.healthLevels, recurrenceOverrides]);

  const economyData = useMemo(() => {
    // Combinar transações reais (incluindo meses passados) com projetadas
    const projectedTransactions = timeline.flatMap(day => day.transactions);

    // Pegar transações reais que não estão na timeline (meses passados)
    const timelineDates = new Set(timeline.map(d => d.date));
    const pastTransactions = allTransactions.filter(t => !timelineDates.has(t.date));

    // Combinar todas as transações únicas
    const allEconomyTransactions = [...pastTransactions, ...projectedTransactions];

    return calculateEconomy(allEconomyTransactions);
  }, [timeline, allTransactions]);


  // --- HANDLERS ---

  const handleSaveTransaction = async (t: Partial<Transaction>, installments: number = 1, targetId: string, targetType: 'account' | 'card', recurrenceScope?: 'single' | 'from_here' | 'all') => {
    
    // --- SIMULATION LOGIC ---
    if (simulationMode) {
        let newSimTxs: Transaction[] = [];
        const effectiveId = t.id || `sim-${generateUUID()}`;

        if (targetType === 'card') {
            const card = creditCards.find(c => c.id === targetId);
            if (card) {
                if (t.id && !t.id.startsWith('sim-')) {
                     setSimulatedDeletions(prev => [...prev, t.id!]);
                }
                newSimTxs = processCreditCardTransaction({ ...t, id: effectiveId, cardId: targetId }, card, installments);
                newSimTxs.forEach(tx => tx.isSimulation = true);
            }
        } else {
            newSimTxs = [{
                id: effectiveId,
                description: t.description!,
                amount: t.amount!,
                date: t.date!,
                type: t.type!,
                category: t.category!,
                status: t.status!,
                accountId: targetId,
                isSimulation: true
            }];
        }

        setSimulatedTransactions(prev => {
             const filtered = prev.filter(pt => !newSimTxs.some(nt => nt.id === pt.id));
             return [...filtered, ...newSimTxs];
        });
        return;
    }

    const projectedMeta = t.id && t.id.startsWith('proj-') ? parseProjectedMeta(t.id) : null;
    const projectedRecurrenceId = t.originalTransactionId || projectedMeta?.recurrenceId || null;
    const projectedDate = t.date || projectedMeta?.date || undefined;
    const isProjected = !!t.id && t.id.startsWith('proj-');

    // --- REAL DB LOGIC ---
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não logado.");

        if (!targetId || targetId === '') throw new Error("Destino inválido.");
        if (!t.amount || isNaN(t.amount)) throw new Error("Valor inválido.");

        // Projeções de recorrência: salvar override ao invés de criar transação real
        if (isProjected && projectedRecurrenceId && (t.date || projectedDate)) {
            const scopeField = recurrenceScope === 'from_here' || recurrenceScope === 'all' ? 'from_here' : 'single';
            const overridePayload: any = {
                recurrence_id: projectedRecurrenceId,
                effective_from: t.date || projectedDate,
                scope: scopeField,
                delete_flag: false,
                amount: t.amount,
                description: t.description,
                category: t.category,
                status: (t.status || 'pending').toUpperCase(),
                target_account_id: targetType === 'account' ? targetId : null,
                target_card_id: targetType === 'card' ? targetId : null
            };

            const { data, error } = await supabase.from('recurrence_overrides').upsert(overridePayload).select().maybeSingle();
            if (error) throw error;
            const mapped = data ? mapRecurrenceOverrideFromDB(data) : null;
            if (mapped) {
                setRecurrenceOverrides(prev => {
                    const filtered = prev.filter(o => !(o.recurrenceId === mapped.recurrenceId && o.effectiveFrom === mapped.effectiveFrom && o.scope === mapped.scope));
                    return [...filtered, mapped];
                });
            }
            return;
        }

        // Transações projetadas (proj-*) não existem no banco, então devem ser criadas como novas
        const isProjectedTransaction = t.id?.startsWith('proj-');

        if (t.id && !isProjectedTransaction) {
            const payload: any = {
                description: t.description,
                amount: t.amount,
                date: t.date,
                type: mapTypeToDB(t.type!),
                category: t.category,
                status: targetType === 'card' ? 'PENDING' : t.status?.toUpperCase(),
            };

            if (targetType === 'account') {
                payload.account_id = targetId;
                payload.card_id = null;
            } else {
                payload.card_id = targetId;
                payload.account_id = null;
            }

            const { error } = await supabase.from('transactions').update(payload).eq('id', t.id);
            if (error) throw error;

            setTransactions(prev => prev.map(tx => {
                if (tx.id === t.id) {
                    return {
                        ...tx,
                        description: t.description!,
                        amount: t.amount!,
                        date: t.date!,
                        type: t.type!,
                        category: t.category!,
                        status: targetType === 'card' ? 'pending' : t.status!,
                        accountId: targetType === 'account' ? targetId : undefined,
                        cardId: targetType === 'card' ? targetId : undefined
                    };
                }
                return tx;
            }));
        } 
        else {
            let dbPayloads: any[] = [];
            const batchId = generateUUID(); 

            if (targetType === 'card') {
                 const card = creditCards.find(c => c.id === targetId);
                 if (!card) throw new Error("Cartão não encontrado");
                 const generated = processCreditCardTransaction({ ...t, cardId: targetId }, card, installments);
                 
                 dbPayloads = generated.map(g => ({
                    user_id: user.id,
                    description: g.description,
                    amount: g.amount,
                    date: g.date,
                    type: mapTypeToDB(g.type),
                    category: g.category,
                    status: 'PENDING',
                    card_id: targetId, 
                    installment_current: g.installmentCurrent,
                    installment_total: g.installmentTotal,
                    original_transaction_id: batchId
                 }));
            } else {
                dbPayloads = [{
                    user_id: user.id,
                    description: t.description,
                    amount: t.amount,
                    date: t.date,
                    type: mapTypeToDB(t.type!),
                    category: t.category,
                    status: t.status?.toUpperCase(),
                    account_id: targetId
                }];
            }

            const { data, error } = await supabase.from('transactions').insert(dbPayloads).select();
            if (error) throw error;

            if (data) {
                const newTx = data.map(mapTransactionFromDB);
                setTransactions(prev => [...prev, ...newTx]);
            }
        }

    } catch (e: any) {
        console.error("Error saving transaction:", e);
        alert(`Erro: ${getErrorMessage(e)}`);
    }
  };

  const handleDeleteTransaction = async (id: string, opts?: { recurrenceScope?: 'single' | 'from_here' | 'all', date?: string }) => {
      if (simulationMode) {
          const isSimulatedOnly = simulatedTransactions.some(t => t.id === id);
          if (isSimulatedOnly) {
              setSimulatedTransactions(prev => prev.filter(t => t.id !== id));
          } else {
              setSimulatedDeletions(prev => [...prev, id]);
          }
          return;
      }

      // Transações projetadas (proj-*) devem virar override de exclusão
      const projectedMeta = id.startsWith('proj-') ? parseProjectedMeta(id) : null;
      const projectedTx = transactionToEdit && transactionToEdit.id === id && id.startsWith('proj-') ? transactionToEdit : undefined;
      const recurrenceId = projectedTx?.originalTransactionId || projectedMeta?.recurrenceId;
      const effectiveDate = opts?.date || projectedTx?.date || projectedMeta?.date;

      if (id.startsWith('proj-') && recurrenceId && effectiveDate) {
          const scopeField = opts?.recurrenceScope === 'from_here' || opts?.recurrenceScope === 'all' ? 'from_here' : 'single';
          try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("Usuário não logado.");
              const payload: any = {
                  recurrence_id: recurrenceId,
                  effective_from: effectiveDate,
                  scope: scopeField,
                  delete_flag: true
              };
              const { data, error } = await supabase.from('recurrence_overrides').upsert(payload).select().maybeSingle();
              if (error) throw error;
              const mapped = data ? mapRecurrenceOverrideFromDB(data) : null;
              if (mapped) {
                  setRecurrenceOverrides(prev => {
                      const filtered = prev.filter(o => !(o.recurrenceId === mapped.recurrenceId && o.effectiveFrom === mapped.effectiveFrom && o.scope === mapped.scope));
                      return [...filtered, mapped];
                  });
              }
          } catch (e) {
              alert("Erro ao excluir projeção: " + getErrorMessage(e));
          }
          return;
      }
      if (id.startsWith('proj-')) {
          console.warn('Ignorando delete de transação projetada (não existe no banco):', id);
          return;
      }

      try {
          const { error } = await supabase.from('transactions').delete().eq('id', id);
          if (error) throw error;
          setTransactions(prev => prev.filter(t => t.id !== id));
      } catch (e) {
          alert("Erro ao excluir: " + getErrorMessage(e));
      }
  };

  const handleAddRecurrence = async (r: Recurrence) => {
    if (simulationMode) {
        const effectiveId = r.id.startsWith('sim-') ? r.id : `sim-${generateUUID()}`;
        const simRec = { ...r, id: effectiveId, active: true };
        
        if (r.id && !r.id.startsWith('sim-')) {
            setSimulatedRecurrenceDeletions(prev => [...prev, r.id]);
        }
        
        setSimulatedRecurrences(prev => [...prev.filter(x => x.id !== effectiveId), simRec]);
        return;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload: any = {
            user_id: user.id,
            description: r.description,
            amount: r.amount,
            type: mapTypeToDB(r.type),
            category: r.category,
            frequency: r.frequency.toUpperCase(),
            start_from: r.startFrom,
            day_of_month: r.dayOfMonth,
            end_date: r.endDate || null,
            occurrence_count: r.occurrenceCount || null,
            active: r.active
        };

        // Garantir que apenas um destino seja definido
        if (r.targetAccountId) {
            payload.target_account_id = r.targetAccountId;
            payload.target_card_id = null;
        } else if (r.targetCardId) {
            payload.target_card_id = r.targetCardId;
            payload.target_account_id = null;
        }
        
        const exists = recurrences.find(ex => ex.id === r.id);
        
        if (exists) {
             const { error } = await supabase.from('recurring_rules').update(payload).eq('id', r.id);
             if (error) throw error;
             setRecurrences(prev => prev.map(ex => ex.id === r.id ? { ...r } : ex));
        } else {
            const { data, error } = await supabase.from('recurring_rules').insert([payload]).select();
            if (error) throw error;
            if (data) setRecurrences(prev => [...prev, mapRecurrenceFromDB(data[0])]);
        }

    } catch(e) {
        console.error(e);
        alert("Erro ao salvar regra: " + getErrorMessage(e));
    }
  };

  const handleDeleteRecurrence = async (id: string) => {
      if (simulationMode) {
          if (id.startsWith('sim-')) {
              setSimulatedRecurrences(prev => prev.filter(r => r.id !== id));
          } else {
              setSimulatedRecurrenceDeletions(prev => [...prev, id]);
          }
          return;
      }

      // Soft delete: desativa e corta projeções futuras, preservando histórico
      try {
          const todayStr = new Date().toISOString().split('T')[0];
          const { data, error } = await supabase
              .from('recurring_rules')
              .update({ active: false, end_date: todayStr })
              .eq('id', id)
              .select()
              .maybeSingle();
          if (error) throw error;
          setRecurrences(prev => prev.map(r => r.id === id ? { ...r, active: false, endDate: todayStr } : r));

          // Cria override from_here para cortar projeções futuras desta recorrência
          const { data: ovData, error: ovError } = await supabase.from('recurrence_overrides').upsert({
              recurrence_id: id,
              effective_from: todayStr,
              scope: 'from_here',
              delete_flag: true
          }).select().maybeSingle();
          if (ovError) throw ovError;
          const mapped = ovData ? mapRecurrenceOverrideFromDB(ovData) : null;
          if (mapped) {
              setRecurrenceOverrides(prev => {
                  const filtered = prev.filter(o => !(o.recurrenceId === mapped.recurrenceId && o.effectiveFrom === mapped.effectiveFrom && o.scope === mapped.scope));
                  return [...filtered, mapped];
              });
          }
      } catch (e) {
          alert("Erro ao desativar recorrência: " + getErrorMessage(e));
      }
  };

  // --- ACCOUNTS ---
  const handleAddAccount = async (a: Account) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const payload = { user_id: user.id, name: a.name, type: a.type.toUpperCase(), initial_balance: a.initialBalance, color: a.color };
        const { data, error } = await supabase.from('accounts').insert([payload]).select();
        if (error) throw error;
        if (data) setAccounts(prev => [...prev, mapAccountFromDB(data[0])]);
    } catch(e) { console.error(e); alert("Erro: " + getErrorMessage(e)); }
  };
  
  const handleAddCard = async (c: CreditCardType) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const payload = { user_id: user.id, name: c.name, limit: c.limit, closing_day: c.closingDay, due_day: c.dueDay, color: c.color };
        const { data, error } = await supabase.from('credit_cards').insert([payload]).select();
        if (error) throw error;
        if (data) setCreditCards(prev => [...prev, mapCardFromDB(data[0])]);
    } catch(e) { console.error(e); alert("Erro: " + getErrorMessage(e)); }
  };
  
  const handleDeleteAccount = async (id: string) => {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (!error) setAccounts(prev => prev.filter(a => a.id !== id));
  };
  const handleDeleteCard = async (id: string) => {
      const { error } = await supabase.from('credit_cards').delete().eq('id', id);
      if (!error) setCreditCards(prev => prev.filter(c => c.id !== id));
  };

  // --- SIMULATION CONTROL ---
  const toggleSimulation = () => {
    if (simulationMode) {
        setSimulatedTransactions([]);
        setSimulatedDeletions([]);
        setSimulatedRecurrences([]);
        setSimulatedRecurrenceDeletions([]);
    }
    setSimulationMode(!simulationMode);
  };

  const applySimulation = async () => {
      setLoading(true);
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Login necessário");

          if (simulatedDeletions.length > 0) {
              await supabase.from('transactions').delete().in('id', simulatedDeletions);
          }

          const txInserts: any[] = [];
          
          for (const t of simulatedTransactions) {
              const isNew = t.id.startsWith('sim-');
              const payload: any = {
                  user_id: user.id,
                  description: t.description,
                  amount: t.amount,
                  date: t.date,
                  type: mapTypeToDB(t.type),
                  category: t.category,
                  status: t.status === 'pending' || t.status === 'paid' ? t.status.toUpperCase() : 'PENDING',
                  account_id: t.accountId || null,
                  card_id: t.cardId || null,
                  installment_current: t.installmentCurrent,
                  installment_total: t.installmentTotal,
                  original_transaction_id: t.originalTransactionId
              };

              if (isNew) {
                  txInserts.push(payload);
              } else {
                  const { error } = await supabase.from('transactions').update(payload).eq('id', t.id);
                  if (error) throw error;
              }
          }

          if (txInserts.length > 0) {
              const { error } = await supabase.from('transactions').insert(txInserts);
              if (error) throw error;
          }

          if (simulatedRecurrenceDeletions.length > 0) {
              await supabase.from('recurring_rules').delete().in('id', simulatedRecurrenceDeletions);
          }

          if (simulatedRecurrences.length > 0) {
              const recPayloads = simulatedRecurrences.map(r => ({
                  user_id: user.id,
                  description: r.description,
                  amount: r.amount,
                  type: mapTypeToDB(r.type),
                  category: r.category,
                  frequency: r.frequency.toUpperCase(),
                  start_from: r.startFrom,
                  active: r.active,
                  target_account_id: r.targetAccountId,
                  target_card_id: r.targetCardId
              }));
              const { error } = await supabase.from('recurring_rules').insert(recPayloads);
              if (error) throw error;
          }

          await fetchData();
          
          setSimulatedTransactions([]);
          setSimulatedDeletions([]);
          setSimulatedRecurrences([]);
          setSimulatedRecurrenceDeletions([]);
          setSimulationMode(false);
          alert("Cenário aplicado com sucesso!");

      } catch (e: any) {
          console.error(e);
          alert("Erro ao aplicar cenário: " + getErrorMessage(e));
      } finally {
          setLoading(false);
      }
  };

  const NavButton = ({ tab, icon: Icon, label }: { tab: typeof activeTab, icon: any, label: string }) => {
    const isActive = activeTab === tab;
    return (
      <button 
          onClick={() => { setActiveTab(tab); setIsMobileMenuOpen(false); }}
          className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium ${
              isActive 
              ? 'bg-slate-800 text-white' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
      >
          <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
          <span>{label}</span>
      </button>
    );
  };

  const getPageTitle = (tab: typeof activeTab) => {
      switch(tab) {
          case 'dashboard': return 'Visão Geral';
          case 'flow': return 'Fluxo de Caixa';
          case 'economy': return 'Economia';
          case 'recurrence': return 'Recorrências';
          case 'accounts': return 'Contas e Cartões';
          case 'settings': return 'Configurações';
          default: return 'Fluxo';
      }
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><span className="text-slate-400 font-medium">Carregando...</span></div>;
  
  if (!session) return <Auth />;

  return (
    <div className={`min-h-screen flex flex-col md:flex-row text-slate-800 font-sans overflow-hidden transition-all duration-500 ${simulationMode ? 'ring-[6px] ring-inset ring-purple-500 bg-purple-50/30' : 'bg-slate-100'}`}>
      
      {/* Sidebar Compact */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-slate-900 text-white border-r border-slate-800 transition-all duration-300">
        <div className="p-6 border-b border-slate-800">
           <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
             <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center font-serif italic">F</div>
             Fluxo
           </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            <NavButton tab="dashboard" icon={LayoutDashboard} label="Visão Geral" />
            <NavButton tab="flow" icon={CalendarDays} label="Fluxo de Caixa" />
            <NavButton tab="economy" icon={PiggyBank} label="Economia" />
            <div className="my-4 border-t border-slate-800 mx-2"></div>
            <NavButton tab="recurrence" icon={RefreshCcw} label="Recorrências" />
            <NavButton tab="accounts" icon={CreditCard} label="Contas e Cartões" />
            <NavButton tab="settings" icon={SettingsIcon} label="Configurações" />
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center font-bold text-xs">{session.user.email?.substring(0,2).toUpperCase()}</div>
                    <div className="truncate">
                        <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="text-slate-500 hover:text-white p-1.5 rounded hover:bg-slate-800">
                    <LogOut size={16} />
                </button>
            </div>
        </div>
      </aside>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 md:hidden flex">
              <div className="w-64 bg-slate-900 h-full p-4 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                       <h1 className="text-xl font-bold text-white">Fluxo</h1>
                       <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400"><X size={20}/></button>
                  </div>
                  <div className="space-y-1">
                    <NavButton tab="dashboard" icon={LayoutDashboard} label="Visão Geral" />
                    <NavButton tab="flow" icon={CalendarDays} label="Fluxo de Caixa" />
                    <NavButton tab="economy" icon={PiggyBank} label="Economia" />
                    <NavButton tab="recurrence" icon={RefreshCcw} label="Recorrências" />
                    <NavButton tab="accounts" icon={CreditCard} label="Contas" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-slate-400 mt-4 border-t border-slate-800">Sair</button>
                  </div>
              </div>
              <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)}></div>
          </div>
      )}

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative transition-colors duration-300">
        
        {/* Header */}
        <header className={`h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm backdrop-blur-sm transition-colors ${simulationMode ? 'bg-purple-100/80 border-b border-purple-200' : 'bg-white/80 border-b border-slate-200'}`}>
            <div className="flex items-center gap-4">
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-500 hover:text-slate-800">
                    <Menu size={24}/>
                </button>
                <h2 className="text-xl font-bold text-slate-800">{getPageTitle(activeTab)}</h2>
                
                {simulationMode && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-bold uppercase tracking-wide animate-pulse">
                        <Sparkles size={12} /> Modo Simulação
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                {simulationMode ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <button 
                            onClick={toggleSimulation}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                        >
                            <X size={16} />
                            <span className="hidden md:inline">Descartar</span>
                        </button>
                        <button 
                            onClick={applySimulation}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-purple-600 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-all hover:scale-105"
                        >
                            <Check size={16} />
                            <span className="hidden md:inline">Aplicar Cenário</span>
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={toggleSimulation}
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors border text-slate-500 hover:bg-slate-100 border-transparent"
                    >
                        <Sparkles size={16} className="text-slate-400" />
                        Simulação
                    </button>
                )}

                {!simulationMode && (
                    <button onClick={toggleSimulation} className="md:hidden p-2 text-slate-500"><Sparkles size={20}/></button>
                )}

                <button 
                    onClick={() => { setSelectedDate(undefined); setTransactionToEdit(undefined); setIsModalOpen(true); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-bold text-sm shadow-lg transition-transform active:scale-95 ${
                        simulationMode ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
                    }`}
                >
                    <Plus size={18} />
                    <span className="hidden md:inline">Novo</span>
                </button>
            </div>
        </header>

        <div className="max-w-7xl mx-auto w-full p-4 md:p-8 pb-24">
          
          {activeTab === 'dashboard' && (
            <Dashboard
              timeline={timeline}
              accounts={accounts}
              settings={settings}
              transactions={allTransactions}
            />
          )}
          {activeTab === 'flow' &&
            <CashFlow
                timeline={timeline}
                creditCards={creditCards}
                accounts={accounts}
                healthLevels={settings.healthLevels}
                onSelectDay={(date) => { setSelectedDate(date); setTransactionToEdit(undefined); setIsModalOpen(true); }}
                onEditTransaction={(t) => { setTransactionToEdit(t); setIsModalOpen(true); }}
                onViewCard={(cardId) => {
                    const card = creditCards.find(c => c.id === cardId);
                    if (card) {
                        setCardToView(card);
                    } else {
                        console.warn('Cartão não encontrado:', cardId, 'Cartões disponíveis:', creditCards.map(c => c.id));
                    }
                }}
            />
          }
          {activeTab === 'economy' && <Economy data={economyData} />}
          {activeTab === 'recurrence' && (
                <RecurrenceManager
                    recurrences={allRecurrences}
                    onAddRecurrence={handleAddRecurrence}
                    onDeleteRecurrence={handleDeleteRecurrence}
                    onAddCategory={handleAddCustomCategory}
                    customCategories={settings.customCategories}
                    accounts={accounts}
                    creditCards={creditCards}
                />
          )}
          {activeTab === 'accounts' && (
                 <AccountManager 
                    accounts={accounts}
                    creditCards={creditCards}
                    transactions={allTransactions}
                    projectedTransactions={timeline.flatMap(day => day.transactions)}
                    recurrences={allRecurrences}
                    onAddAccount={handleAddAccount}
                    onAddCard={handleAddCard}
                    onDeleteAccount={handleDeleteAccount}
                    onDeleteCard={handleDeleteCard}
                 />
          )}
          {activeTab === 'settings' && <Settings settings={settings} onSaveSettings={handleSaveSettings} />}

        </div>

        <TransactionModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleSaveTransaction}
            onDelete={handleDeleteTransaction}
            initialDate={selectedDate}
            transactionToEdit={transactionToEdit}
            accounts={accounts}
            creditCards={creditCards}
            isSimulationMode={simulationMode}
            customCategories={settings.customCategories}
            onAddCategory={handleAddCustomCategory}
        />

        <CardDetailModal 
            card={cardToView}
            transactions={allTransactions}
            recurrences={allRecurrences}
            onClose={() => setCardToView(null)}
        />

      </main>
    </div>
  );
};

export default App;
