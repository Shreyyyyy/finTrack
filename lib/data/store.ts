'use client';

import {
  Category,
  PaymentMethod,
  Expense,
  MonthlySetting,
  Goal,
  GoalTransaction,
  ApiKey,
  Profile,
} from '@/types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_MONTHLY_SETTINGS,
  DEFAULT_GOALS,
  DEFAULT_EXPENSES,
  DEFAULT_API_KEYS,
  DEFAULT_PROFILES,
} from './initialData';
import { isSupabaseConfigured, createClient } from '../supabase/client';

const STORAGE_KEYS = {
  EXPENSES: 'fintrack_expenses',
  CATEGORIES: 'fintrack_categories',
  PAYMENT_METHODS: 'fintrack_payment_methods',
  MONTHLY_SETTINGS: 'fintrack_monthly_settings',
  GOALS: 'fintrack_goals',
  GOAL_TRANSACTIONS: 'fintrack_goal_transactions',
  API_KEYS: 'fintrack_api_keys',
  PROFILES: 'fintrack_profiles',
};

export const DATA_CHANGE_EVENT = 'fintrack_store_change';

function emitChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATA_CHANGE_EVENT));
  }
}

// Helper to safely get from localStorage with fallback
function getLocalItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    emitChange();
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

// -------------------------------------------------------------
// PROFILES (Multi-Person Support)
// -------------------------------------------------------------
export async function getProfiles(): Promise<Profile[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('profiles').select('*').order('created_at');
      if (!error && data && data.length > 0) {
        return data as Profile[];
      }
    } catch {
      // Fallback
    }
  }
  return getLocalItem<Profile[]>(STORAGE_KEYS.PROFILES, DEFAULT_PROFILES);
}

// -------------------------------------------------------------
// EXPENSES
// -------------------------------------------------------------
export async function getExpenses(filterUserId?: string): Promise<Expense[]> {
  const profiles = await getProfiles();
  const categories = await getCategories();
  const paymentMethods = await getPaymentMethods();

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase
        .from('expenses')
        .select(`
          *,
          category:categories(*),
          payment_method:payment_methods(*)
        `)
        .order('expense_date', { ascending: false });

      if (filterUserId && filterUserId !== 'all') {
        query = query.eq('user_id', filterUserId);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          profile: profiles.find((p) => p.id === item.user_id),
        })) as Expense[];
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back to local storage', err);
    }
  }

  // Local storage fallback
  const rawExpenses = getLocalItem<Expense[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
  let list = rawExpenses;
  if (filterUserId && filterUserId !== 'all') {
    list = list.filter((e) => e.user_id === filterUserId);
  }

  return list.map((exp) => ({
    ...exp,
    category: categories.find((c) => c.id === exp.category_id),
    payment_method: paymentMethods.find((pm) => pm.id === exp.payment_method_id),
    profile: profiles.find((p) => p.id === exp.user_id),
  })).sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
}

export async function addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
  const newId = 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const newExpense: Expense = {
    ...expense,
    id: newId,
    amount: Number(expense.amount),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          amount: newExpense.amount,
          category_id: newExpense.category_id,
          payment_method_id: newExpense.payment_method_id,
          merchant: newExpense.merchant,
          note: newExpense.note,
          expense_date: newExpense.expense_date,
        })
        .select(`
          *,
          category:categories(*),
          payment_method:payment_methods(*)
        `)
        .single();
      if (!error && data) {
        emitChange();
        return data as Expense;
      }
    } catch (err) {
      console.warn('Supabase insert failed, storing locally', err);
    }
  }

  const list = getLocalItem<Expense[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
  const updatedList = [newExpense, ...list];
  setLocalItem(STORAGE_KEYS.EXPENSES, updatedList);
  return newExpense;
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('expenses')
        .update({
          amount: updates.amount !== undefined ? Number(updates.amount) : undefined,
          category_id: updates.category_id,
          payment_method_id: updates.payment_method_id,
          merchant: updates.merchant,
          note: updates.note,
          expense_date: updates.expense_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          category:categories(*),
          payment_method:payment_methods(*)
        `)
        .single();
      if (!error && data) {
        emitChange();
        return data as Expense;
      }
    } catch (err) {
      console.warn('Supabase update failed, updating locally', err);
    }
  }

  const list = getLocalItem<Expense[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
  const index = list.findIndex((e) => e.id === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    amount: updates.amount !== undefined ? Number(updates.amount) : list[index].amount,
    updated_at: new Date().toISOString(),
  };
  setLocalItem(STORAGE_KEYS.EXPENSES, [...list]);
  return list[index];
}

export async function deleteExpense(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (!error) {
        emitChange();
        return true;
      }
    } catch (err) {
      console.warn('Supabase delete failed, deleting locally', err);
    }
  }

  const list = getLocalItem<Expense[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
  const updatedList = list.filter((e) => e.id !== id);
  setLocalItem(STORAGE_KEYS.EXPENSES, updatedList);
  return true;
}

// -------------------------------------------------------------
// CATEGORIES
// -------------------------------------------------------------
export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (!error && data && data.length > 0) {
        return data as Category[];
      }
    } catch {
      // Fallback
    }
  }
  return getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
}

export async function saveCategory(category: Partial<Category> & { name: string }): Promise<Category> {
  const isEdit = Boolean(category.id);
  const id = category.id || 'cat-' + Date.now();
  const fullCategory: Category = {
    id,
    name: category.name,
    icon: category.icon || '💰',
    color: category.color || '#10b981',
    budget_amount: Number(category.budget_amount) || 0,
    is_default: category.is_default || false,
    created_at: category.created_at || new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      if (isEdit) {
        const { data } = await supabase
          .from('categories')
          .update(fullCategory)
          .eq('id', id)
          .select()
          .single();
        if (data) {
          emitChange();
          return data as Category;
        }
      } else {
        const { data } = await supabase.from('categories').insert(fullCategory).select().single();
        if (data) {
          emitChange();
          return data as Category;
        }
      }
    } catch {
      // Fallback
    }
  }

  const categories = getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  const index = categories.findIndex((c) => c.id === id);
  if (index >= 0) {
    categories[index] = fullCategory;
  } else {
    categories.push(fullCategory);
  }
  setLocalItem(STORAGE_KEYS.CATEGORIES, [...categories]);
  return fullCategory;
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from('categories').delete().eq('id', id);
    } catch {
      // Fallback
    }
  }
  const categories = getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  setLocalItem(STORAGE_KEYS.CATEGORIES, categories.filter((c) => c.id !== id));
  return true;
}

// -------------------------------------------------------------
// PAYMENT METHODS
// -------------------------------------------------------------
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('payment_methods').select('*').order('created_at');
      if (!error && data && data.length > 0) {
        return data as PaymentMethod[];
      }
    } catch {
      // Fallback
    }
  }
  return getLocalItem<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, DEFAULT_PAYMENT_METHODS);
}

export async function savePaymentMethod(method: Partial<PaymentMethod> & { name: string }): Promise<PaymentMethod> {
  const id = method.id || 'pm-' + Date.now();
  const fullMethod: PaymentMethod = {
    id,
    name: method.name,
    type: method.type || 'other',
    is_default: method.is_default || false,
    created_at: method.created_at || new Date().toISOString(),
  };

  const methods = getLocalItem<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, DEFAULT_PAYMENT_METHODS);
  // If set to default, clear default on other methods
  if (fullMethod.is_default) {
    methods.forEach((m) => {
      m.is_default = false;
    });
  }

  const index = methods.findIndex((m) => m.id === id);
  if (index >= 0) {
    methods[index] = fullMethod;
  } else {
    methods.push(fullMethod);
  }
  setLocalItem(STORAGE_KEYS.PAYMENT_METHODS, [...methods]);
  return fullMethod;
}

export async function deletePaymentMethod(id: string): Promise<boolean> {
  const methods = getLocalItem<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, DEFAULT_PAYMENT_METHODS);
  setLocalItem(STORAGE_KEYS.PAYMENT_METHODS, methods.filter((m) => m.id !== id));
  return true;
}

// -------------------------------------------------------------
// MONTHLY SETTINGS (INCOME, BUDGET, SAVINGS)
// -------------------------------------------------------------
export async function getMonthlySetting(month: number, year: number): Promise<MonthlySetting> {
  const settings = getLocalItem<MonthlySetting[]>(STORAGE_KEYS.MONTHLY_SETTINGS, DEFAULT_MONTHLY_SETTINGS);
  const found = settings.find((s) => s.month === month && s.year === year);
  if (found) return found;

  // Return default setting for this month
  const defaultSetting: MonthlySetting = {
    id: `ms-${month}-${year}`,
    month,
    year,
    income: 80000,
    monthly_budget: 50000,
    savings_target: 30000,
  };
  return defaultSetting;
}

export async function saveMonthlySetting(setting: MonthlySetting): Promise<MonthlySetting> {
  const settings = getLocalItem<MonthlySetting[]>(STORAGE_KEYS.MONTHLY_SETTINGS, DEFAULT_MONTHLY_SETTINGS);
  const index = settings.findIndex((s) => s.month === setting.month && s.year === setting.year);
  if (index >= 0) {
    settings[index] = { ...settings[index], ...setting, updated_at: new Date().toISOString() };
  } else {
    settings.push({ ...setting, created_at: new Date().toISOString() });
  }
  setLocalItem(STORAGE_KEYS.MONTHLY_SETTINGS, [...settings]);
  return setting;
}

// -------------------------------------------------------------
// GOALS
// -------------------------------------------------------------
export async function getGoals(): Promise<Goal[]> {
  return getLocalItem<Goal[]>(STORAGE_KEYS.GOALS, DEFAULT_GOALS);
}

export async function saveGoal(goal: Partial<Goal> & { name: string; target_amount: number }): Promise<Goal> {
  const id = goal.id || 'goal-' + Date.now();
  const fullGoal: Goal = {
    id,
    name: goal.name,
    target_amount: Number(goal.target_amount),
    current_amount: Number(goal.current_amount) || 0,
    deadline: goal.deadline || null,
    monthly_contribution: Number(goal.monthly_contribution) || 0,
    status: goal.status || 'in_progress',
    created_at: goal.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const goals = getLocalItem<Goal[]>(STORAGE_KEYS.GOALS, DEFAULT_GOALS);
  const index = goals.findIndex((g) => g.id === id);
  if (index >= 0) {
    goals[index] = fullGoal;
  } else {
    goals.push(fullGoal);
  }
  setLocalItem(STORAGE_KEYS.GOALS, [...goals]);
  return fullGoal;
}

export async function deleteGoal(id: string): Promise<boolean> {
  const goals = getLocalItem<Goal[]>(STORAGE_KEYS.GOALS, DEFAULT_GOALS);
  setLocalItem(STORAGE_KEYS.GOALS, goals.filter((g) => g.id !== id));
  return true;
}

export async function addGoalTransaction(
  goalId: string,
  amount: number,
  type: 'deposit' | 'withdraw',
  note?: string
): Promise<Goal | null> {
  const goals = getLocalItem<Goal[]>(STORAGE_KEYS.GOALS, DEFAULT_GOALS);
  const goalIndex = goals.findIndex((g) => g.id === goalId);
  if (goalIndex === -1) return null;

  const numericAmount = Math.abs(Number(amount));
  let newCurrent = goals[goalIndex].current_amount;
  if (type === 'deposit') {
    newCurrent += numericAmount;
  } else {
    newCurrent = Math.max(0, newCurrent - numericAmount);
  }

  goals[goalIndex].current_amount = newCurrent;
  if (newCurrent >= goals[goalIndex].target_amount) {
    goals[goalIndex].status = 'completed';
  } else if (goals[goalIndex].status === 'completed' && newCurrent < goals[goalIndex].target_amount) {
    goals[goalIndex].status = 'in_progress';
  }

  setLocalItem(STORAGE_KEYS.GOALS, [...goals]);

  // Log transaction
  const transactions = getLocalItem<GoalTransaction[]>(STORAGE_KEYS.GOAL_TRANSACTIONS, []);
  transactions.push({
    id: 'gt-' + Date.now(),
    goal_id: goalId,
    amount: numericAmount,
    type,
    date: new Date().toISOString().split('T')[0],
    note,
    created_at: new Date().toISOString(),
  });
  setLocalItem(STORAGE_KEYS.GOAL_TRANSACTIONS, transactions);

  return goals[goalIndex];
}

// -------------------------------------------------------------
// API KEYS (Apple Shortcuts Back Tap)
// -------------------------------------------------------------
export async function getApiKeys(): Promise<ApiKey[]> {
  return getLocalItem<ApiKey[]>(STORAGE_KEYS.API_KEYS, DEFAULT_API_KEYS);
}

export async function createApiKey(name: string): Promise<ApiKey> {
  const randomSuffix = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  const newKey: ApiKey = {
    id: 'key-' + Date.now(),
    name: name || 'iPhone Shortcut',
    key_hash: `fintrack_sec_${randomSuffix}`,
    created_at: new Date().toISOString(),
  };
  const keys = getLocalItem<ApiKey[]>(STORAGE_KEYS.API_KEYS, DEFAULT_API_KEYS);
  const updated = [...keys, newKey];
  setLocalItem(STORAGE_KEYS.API_KEYS, updated);
  return newKey;
}

export async function deleteApiKey(id: string): Promise<boolean> {
  const keys = getLocalItem<ApiKey[]>(STORAGE_KEYS.API_KEYS, DEFAULT_API_KEYS);
  setLocalItem(STORAGE_KEYS.API_KEYS, keys.filter((k) => k.id !== id));
  return true;
}

// -------------------------------------------------------------
// DATA BACKUP & WIPE
// -------------------------------------------------------------
export async function wipeAllData(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    emitChange();
  }
  return true;
}
