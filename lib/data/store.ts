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
  UserSummary,
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

// Helper to check for standard UUID syntax
export function isValidUUID(str: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

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
    } catch (err) {
      console.warn('Supabase getProfiles failed, using local', err);
    }
  }
  return getLocalItem<Profile[]>(STORAGE_KEYS.PROFILES, DEFAULT_PROFILES);
}

export async function saveProfile(profile: Partial<Profile> & { id: string }): Promise<Profile> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        const local = getLocalItem<Profile[]>(STORAGE_KEYS.PROFILES, DEFAULT_PROFILES);
        const idx = local.findIndex((p) => p.id === profile.id);
        if (idx >= 0) {
          local[idx] = { ...local[idx], ...data };
        } else {
          local.push(data as Profile);
        }
        setLocalItem(STORAGE_KEYS.PROFILES, local);
        return data as Profile;
      }
    } catch (err) {
      console.error('Failed to save profile to Supabase:', err);
    }
  }

  // Local fallback
  const local = getLocalItem<Profile[]>(STORAGE_KEYS.PROFILES, DEFAULT_PROFILES);
  const idx = local.findIndex((p) => p.id === profile.id);
  let updated: Profile;
  if (idx >= 0) {
    updated = {
      ...local[idx],
      ...profile,
      updated_at: new Date().toISOString(),
    };
    local[idx] = updated;
  } else {
    updated = {
      id: profile.id,
      email: profile.email || '',
      display_name: profile.display_name || 'Member',
      avatar_url: profile.avatar_url,
      currency: profile.currency || 'INR',
      default_payment_method: profile.default_payment_method || 'UPI',
      monthly_income: profile.monthly_income || 0,
      monthly_budget: profile.monthly_budget || 0,
      savings_target: profile.savings_target || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    local.push(updated);
  }
  setLocalItem(STORAGE_KEYS.PROFILES, local);
  return updated;
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

      // Determine target user ID:
      // If filterUserId is explicitly 'all', allow loading all expenses (reserved for DB Admin)
      // Otherwise, filter by filterUserId if provided, or default to current authenticated user
      let targetUserId = filterUserId;
      if (!targetUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          targetUserId = session.user.id;
        }
      }

      if (targetUserId && targetUserId !== 'all') {
        query = query.eq('user_id', targetUserId);
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
  let targetUserId = filterUserId;
  if (!targetUserId && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('fintrack_guest_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) targetUserId = parsed.id;
      }
    } catch {}
  }

  if (targetUserId && targetUserId !== 'all') {
    list = list.filter((e) => e.user_id === targetUserId);
  }

  return list.map((exp) => ({
    ...exp,
    category: categories.find((c) => c.id === exp.category_id),
    payment_method: paymentMethods.find((pm) => pm.id === exp.payment_method_id),
    profile: profiles.find((p) => p.id === exp.user_id),
  })).sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
}

export async function addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
  const categories = await getCategories();
  const paymentMethods = await getPaymentMethods();

  // Validate or map UUIDs for Supabase foreign keys
  let categoryId = expense.category_id;
  if (categoryId && !isValidUUID(categoryId)) {
    const matched = categories.find((c) => c.id === categoryId || c.name.toLowerCase() === categoryId?.toLowerCase());
    categoryId = matched && isValidUUID(matched.id) ? matched.id : null;
  }

  let paymentMethodId = expense.payment_method_id;
  if (paymentMethodId && !isValidUUID(paymentMethodId)) {
    const matched = paymentMethods.find((pm) => pm.id === paymentMethodId || pm.name.toLowerCase() === paymentMethodId?.toLowerCase());
    paymentMethodId = matched && isValidUUID(matched.id) ? matched.id : null;
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        const { data, error } = await supabase
          .from('expenses')
          .insert({
            user_id: userId,
            amount: Number(expense.amount),
            category_id: categoryId,
            payment_method_id: paymentMethodId,
            merchant: expense.merchant?.trim() || null,
            note: expense.note?.trim() || null,
            expense_date: expense.expense_date,
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
        if (error) {
          console.warn('Supabase insert expense failed, storing locally', error);
        }
      }
    } catch (err) {
      console.warn('Supabase insert failed, storing locally', err);
    }
  }

  // Local storage fallback
  const newId = 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const newExpense: Expense = {
    ...expense,
    id: newId,
    amount: Number(expense.amount),
    created_at: new Date().toISOString(),
  };

  const list = getLocalItem<Expense[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
  const updatedList = [newExpense, ...list];
  setLocalItem(STORAGE_KEYS.EXPENSES, updatedList);
  return newExpense;
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
  if (isSupabaseConfigured() && isValidUUID(id)) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('expenses')
        .update({
          amount: updates.amount !== undefined ? Number(updates.amount) : undefined,
          category_id: updates.category_id && isValidUUID(updates.category_id) ? updates.category_id : undefined,
          payment_method_id: updates.payment_method_id && isValidUUID(updates.payment_method_id) ? updates.payment_method_id : undefined,
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
  if (isSupabaseConfigured() && isValidUUID(id)) {
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
function deduplicateCategories(cats: Category[]): Category[] {
  const seen = new Set<string>();
  const result: Category[] = [];

  for (const cat of cats) {
    if (!cat || !cat.name) continue;
    const norm = cat.name.trim().toLowerCase();
    if (!seen.has(norm)) {
      seen.add(norm);
      result.push(cat);
    }
  }

  return result;
}

let isSeedingCategories = false;

export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (!error && data && data.length > 0) {
        return deduplicateCategories(data as Category[]);
      }

      // Auto-seed default categories in Supabase only if user has none and not currently seeding
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId && (!data || data.length === 0) && !isSeedingCategories) {
        isSeedingCategories = true;
        try {
          // Double check before inserting
          const { data: check } = await supabase.from('categories').select('id').limit(1);
          if (!check || check.length === 0) {
            const seedCategories = [
              { user_id: userId, name: 'Food & Dining', icon: '🍔', color: '#f97316', budget_amount: 0, is_default: true },
              { user_id: userId, name: 'Transportation', icon: '🚗', color: '#06b6d4', budget_amount: 0, is_default: true },
              { user_id: userId, name: 'Shopping', icon: '🛍', color: '#ec4899', budget_amount: 0, is_default: true },
              { user_id: userId, name: 'Bills & Utilities', icon: '🏠', color: '#ef4444', budget_amount: 0, is_default: true },
              { user_id: userId, name: 'Entertainment', icon: '🎬', color: '#8b5cf6', budget_amount: 0, is_default: true },
              { user_id: userId, name: 'Health & Medical', icon: '🏥', color: '#10b981', budget_amount: 0, is_default: true },
              { user_id: userId, name: 'Groceries', icon: '🛒', color: '#14b8a6', budget_amount: 0, is_default: true },
              { user_id: userId, name: 'Subscriptions', icon: '🔄', color: '#6366f1', budget_amount: 0, is_default: true },
              { user_id: userId, name: 'Personal Care', icon: '❤️', color: '#f43f5e', budget_amount: 0, is_default: true },
              { user_id: userId, name: 'Other', icon: '💰', color: '#94a3b8', budget_amount: 0, is_default: true },
            ];
            const { data: seeded } = await supabase.from('categories').insert(seedCategories).select();
            if (seeded && seeded.length > 0) {
              return deduplicateCategories(seeded as Category[]);
            }
          }
        } finally {
          isSeedingCategories = false;
        }
      }
    } catch (err) {
      console.warn('Supabase getCategories error:', err);
    }
  }
  const rawLocal = getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  return deduplicateCategories(rawLocal);
}

export async function saveCategory(category: Partial<Category> & { name: string }): Promise<Category> {
  const isEdit = Boolean(category.id && isValidUUID(category.id));

  // Check existing categories to prevent duplicates
  const existingCategories = await getCategories();
  const normName = category.name.trim().toLowerCase();
  const existingDup = existingCategories.find(
    (c) => c.name.trim().toLowerCase() === normName && c.id !== category.id
  );
  if (existingDup && !isEdit) {
    return existingDup;
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        if (isEdit) {
          const { data } = await supabase
            .from('categories')
            .update({
              name: category.name.trim(),
              icon: category.icon || '💰',
              color: category.color || '#10b981',
              budget_amount: Number(category.budget_amount) || 0,
            })
            .eq('id', category.id)
            .select()
            .single();

          if (data) {
            emitChange();
            return data as Category;
          }
        } else {
          const { data } = await supabase
            .from('categories')
            .insert({
              user_id: userId,
              name: category.name.trim(),
              icon: category.icon || '💰',
              color: category.color || '#10b981',
              budget_amount: Number(category.budget_amount) || 0,
              is_default: false,
            })
            .select()
            .single();

          if (data) {
            emitChange();
            return data as Category;
          }
        }
      }
    } catch (err) {
      console.warn('Supabase saveCategory error:', err);
    }
  }

  // Local fallback
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

  const categories = getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  const index = categories.findIndex((c) => c.id === id);
  if (index >= 0) {
    categories[index] = fullCategory;
  } else {
    categories.push(fullCategory);
  }
  setLocalItem(STORAGE_KEYS.CATEGORIES, [...categories]);
  emitChange();
  return fullCategory;
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && isValidUUID(id)) {
    try {
      const supabase = createClient();
      await supabase.from('categories').delete().eq('id', id);
      emitChange();
    } catch (err) {
      console.warn('Supabase deleteCategory error:', err);
    }
  }
  const categories = getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  setLocalItem(STORAGE_KEYS.CATEGORIES, categories.filter((c) => c.id !== id));
  emitChange();
  return true;
}

// -------------------------------------------------------------
// PAYMENT METHODS
// -------------------------------------------------------------
function deduplicatePaymentMethods(pms: PaymentMethod[]): PaymentMethod[] {
  const seen = new Set<string>();
  const result: PaymentMethod[] = [];
  let defaultSet = false;

  for (const pm of pms) {
    if (!pm || !pm.name) continue;
    const norm = pm.name.trim().toLowerCase();
    if (!seen.has(norm)) {
      seen.add(norm);
      // Ensure only 1 default payment method is marked true
      if (pm.is_default) {
        if (!defaultSet) {
          defaultSet = true;
          result.push({ ...pm, name: pm.name.trim() });
        } else {
          result.push({ ...pm, name: pm.name.trim(), is_default: false });
        }
      } else {
        result.push({ ...pm, name: pm.name.trim() });
      }
    }
  }

  // If no default was set, set the first item (e.g. UPI) as default
  if (!defaultSet && result.length > 0) {
    result[0] = { ...result[0], is_default: true };
  }

  return result;
}

let isSeedingPaymentMethods = false;

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  let result: PaymentMethod[] = [];
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('payment_methods').select('*').order('created_at');
      if (!error && data && data.length > 0) {
        result = deduplicatePaymentMethods(data as PaymentMethod[]);
      } else {
        // Auto-seed default payment methods in Supabase only if user has none and not currently seeding
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (userId && (!data || data.length === 0) && !isSeedingPaymentMethods) {
          isSeedingPaymentMethods = true;
          try {
            const seedMethods = [
              { user_id: userId, name: 'UPI', type: 'upi', is_default: true },
              { user_id: userId, name: 'Credit Card', type: 'card', is_default: false },
              { user_id: userId, name: 'Debit Card', type: 'card', is_default: false },
              { user_id: userId, name: 'Cash', type: 'cash', is_default: false },
              { user_id: userId, name: 'Net Banking', type: 'bank', is_default: false },
            ];
            const { data: seeded } = await supabase.from('payment_methods').insert(seedMethods).select();
            if (seeded && seeded.length > 0) {
              result = deduplicatePaymentMethods(seeded as PaymentMethod[]);
            }
          } finally {
            isSeedingPaymentMethods = false;
          }
        }
      }
    } catch (err) {
      console.warn('Supabase getPaymentMethods error:', err);
    }
  }
  if (result.length === 0) {
    const rawLocal = getLocalItem<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, DEFAULT_PAYMENT_METHODS);
    result = deduplicatePaymentMethods(rawLocal);
  }

  return result;
}

export async function savePaymentMethod(method: Partial<PaymentMethod> & { name: string }): Promise<PaymentMethod> {
  const isEdit = Boolean(method.id && isValidUUID(method.id));
  const cleanName = method.name.trim();

  // Check existing payment methods to prevent duplicates
  const existingMethods = await getPaymentMethods();
  const normName = cleanName.toLowerCase();
  const existingDup = existingMethods.find(
    (p) => p.name.trim().toLowerCase() === normName && p.id !== method.id
  );
  if (existingDup && !isEdit) {
    if (method.is_default && !existingDup.is_default) {
      return savePaymentMethod({ ...existingDup, is_default: true });
    }
    return existingDup;
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        // If setting as default, clear default status on other payment methods
        if (method.is_default) {
          await supabase
            .from('payment_methods')
            .update({ is_default: false })
            .eq('user_id', userId);
        }

        if (isEdit) {
          const { data } = await supabase
            .from('payment_methods')
            .update({
              name: cleanName,
              type: method.type || 'other',
              is_default: method.is_default || false,
            })
            .eq('id', method.id)
            .select()
            .single();

          if (data) {
            emitChange();
            return data as PaymentMethod;
          }
        } else {
          const { data } = await supabase
            .from('payment_methods')
            .insert({
              user_id: userId,
              name: cleanName,
              type: method.type || 'other',
              is_default: method.is_default || false,
            })
            .select()
            .single();

          if (data) {
            emitChange();
            return data as PaymentMethod;
          }
        }
      }
    } catch (err) {
      console.warn('Supabase savePaymentMethod error:', err);
    }
  }

  // Local fallback
  const id = method.id || 'pm-' + Date.now();
  const fullMethod: PaymentMethod = {
    id,
    name: cleanName,
    type: method.type || 'custom',
    is_default: method.is_default || false,
    created_at: method.created_at || new Date().toISOString(),
  };

  const list = getLocalItem<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, DEFAULT_PAYMENT_METHODS);
  let updatedList = [...list];
  if (method.is_default) {
    updatedList = updatedList.map((p) => ({ ...p, is_default: false }));
  }

  const index = updatedList.findIndex((p) => p.id === id);
  if (index >= 0) {
    updatedList[index] = fullMethod;
  } else {
    updatedList.push(fullMethod);
  }

  setLocalItem(STORAGE_KEYS.PAYMENT_METHODS, deduplicatePaymentMethods(updatedList));
  emitChange();
  return fullMethod;
}

export async function deletePaymentMethod(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && isValidUUID(id)) {
    try {
      const supabase = createClient();
      await supabase.from('payment_methods').delete().eq('id', id);
      emitChange();
    } catch (err) {
      console.warn('Supabase deletePaymentMethod error:', err);
    }
  }
  const methods = getLocalItem<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, DEFAULT_PAYMENT_METHODS);
  setLocalItem(STORAGE_KEYS.PAYMENT_METHODS, methods.filter((m) => m.id !== id));
  emitChange();
  return true;
}

// -------------------------------------------------------------
// MONTHLY SETTINGS (INCOME, BUDGET, SAVINGS) - REAL DB
// -------------------------------------------------------------
export async function getMonthlySetting(month: number, year: number): Promise<MonthlySetting> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        // 1. Check exact setting for this user, month, year
        const { data, error } = await supabase
          .from('monthly_settings')
          .select('*')
          .eq('user_id', userId)
          .eq('month', month)
          .eq('year', year)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            user_id: data.user_id,
            month: data.month,
            year: data.year,
            income: Number(data.income),
            monthly_budget: Number(data.monthly_budget),
            savings_target: Number(data.savings_target),
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }

        // 2. If not found, inherit from the latest previous monthly setting
        const { data: latest } = await supabase
          .from('monthly_settings')
          .select('*')
          .eq('user_id', userId)
          .order('year', { ascending: false })
          .order('month', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latest) {
          const inherited: MonthlySetting = {
            id: `ms-${month}-${year}`,
            user_id: userId,
            month,
            year,
            income: Number(latest.income),
            monthly_budget: Number(latest.monthly_budget),
            savings_target: Number(latest.savings_target),
          };

          // Save inherited setting to database for this month
          await supabase.from('monthly_settings').upsert({
            user_id: userId,
            month,
            year,
            income: inherited.income,
            monthly_budget: inherited.monthly_budget,
            savings_target: inherited.savings_target,
          }, { onConflict: 'user_id,month,year' });

          return inherited;
        }

        // 3. Fallback to profile defaults
        const { data: profile } = await supabase
          .from('profiles')
          .select('monthly_income, monthly_budget, savings_target')
          .eq('id', userId)
          .maybeSingle();

        const defaultIncome = Number(profile?.monthly_income) || 0;
        const defaultBudget = Number(profile?.monthly_budget) || 0;
        const defaultSavings = Number(profile?.savings_target) || Math.max(0, defaultIncome - defaultBudget);

        const initial: MonthlySetting = {
          id: `ms-${month}-${year}`,
          user_id: userId,
          month,
          year,
          income: defaultIncome,
          monthly_budget: defaultBudget,
          savings_target: defaultSavings,
        };

        if (defaultIncome > 0 || defaultBudget > 0) {
          await supabase.from('monthly_settings').upsert({
            user_id: userId,
            month,
            year,
            income: initial.income,
            monthly_budget: initial.monthly_budget,
            savings_target: initial.savings_target,
          }, { onConflict: 'user_id,month,year' });
        }

        return initial;
      }
    } catch (err) {
      console.warn('Supabase getMonthlySetting error:', err);
    }
  }

  // Fallback to local storage
  const settings = getLocalItem<MonthlySetting[]>(STORAGE_KEYS.MONTHLY_SETTINGS, DEFAULT_MONTHLY_SETTINGS);
  const found = settings.find((s) => s.month === month && s.year === year);
  if (found) return found;

  return {
    id: `ms-${month}-${year}`,
    month,
    year,
    income: 0,
    monthly_budget: 0,
    savings_target: 0,
  };
}

export async function saveMonthlySetting(setting: MonthlySetting): Promise<MonthlySetting> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        const { data, error } = await supabase
          .from('monthly_settings')
          .upsert(
            {
              user_id: userId,
              month: setting.month,
              year: setting.year,
              income: Number(setting.income),
              monthly_budget: Number(setting.monthly_budget),
              savings_target: Number(setting.savings_target),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,month,year' }
          )
          .select()
          .single();

        // Also update profile default financial parameters
        await supabase
          .from('profiles')
          .update({
            monthly_income: Number(setting.income),
            monthly_budget: Number(setting.monthly_budget),
            savings_target: Number(setting.savings_target),
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (!error && data) {
          emitChange();
          return {
            id: data.id,
            user_id: data.user_id,
            month: data.month,
            year: data.year,
            income: Number(data.income),
            monthly_budget: Number(data.monthly_budget),
            savings_target: Number(data.savings_target),
          };
        }
      }
    } catch (err) {
      console.warn('Supabase saveMonthlySetting error:', err);
    }
  }

  // Fallback to local storage
  const settings = getLocalItem<MonthlySetting[]>(STORAGE_KEYS.MONTHLY_SETTINGS, DEFAULT_MONTHLY_SETTINGS);
  const index = settings.findIndex((s) => s.month === setting.month && s.year === setting.year);
  if (index >= 0) {
    settings[index] = { ...settings[index], ...setting, updated_at: new Date().toISOString() };
  } else {
    settings.push({ ...setting, created_at: new Date().toISOString() });
  }
  setLocalItem(STORAGE_KEYS.MONTHLY_SETTINGS, [...settings]);
  emitChange();
  return setting;
}

// -------------------------------------------------------------
// GOALS (REAL DB)
// -------------------------------------------------------------
export async function getGoals(): Promise<Goal[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((g: any) => ({
          ...g,
          target_amount: Number(g.target_amount),
          current_amount: Number(g.current_amount) || 0,
          monthly_contribution: Number(g.monthly_contribution) || 0,
        })) as Goal[];
      }
    } catch (err) {
      console.warn('Supabase getGoals failed, falling back to local', err);
    }
  }
  return getLocalItem<Goal[]>(STORAGE_KEYS.GOALS, DEFAULT_GOALS);
}

export async function saveGoal(goal: Partial<Goal> & { name: string; target_amount: number }): Promise<Goal> {
  const isEdit = Boolean(goal.id && isValidUUID(goal.id));

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        if (isEdit) {
          const { data, error } = await supabase
            .from('goals')
            .update({
              name: goal.name,
              target_amount: Number(goal.target_amount),
              current_amount: Number(goal.current_amount) || 0,
              deadline: goal.deadline || null,
              monthly_contribution: Number(goal.monthly_contribution) || 0,
              status: goal.status || 'in_progress',
              updated_at: new Date().toISOString(),
            })
            .eq('id', goal.id)
            .select()
            .single();

          if (!error && data) {
            emitChange();
            return {
              ...data,
              category_type: goal.category_type,
              institution: goal.institution || null,
              expected_cagr: goal.expected_cagr || undefined,
              target_amount: Number(data.target_amount),
              current_amount: Number(data.current_amount),
              monthly_contribution: Number(data.monthly_contribution),
            } as Goal;
          }
        } else {
          const { data, error } = await supabase
            .from('goals')
            .insert({
              user_id: userId,
              name: goal.name,
              target_amount: Number(goal.target_amount),
              current_amount: Number(goal.current_amount) || 0,
              deadline: goal.deadline || null,
              monthly_contribution: Number(goal.monthly_contribution) || 0,
              status: goal.status || 'in_progress',
            })
            .select()
            .single();

          if (!error && data) {
            emitChange();
            return {
              ...data,
              category_type: goal.category_type,
              institution: goal.institution || null,
              expected_cagr: goal.expected_cagr || undefined,
              target_amount: Number(data.target_amount),
              current_amount: Number(data.current_amount),
              monthly_contribution: Number(data.monthly_contribution),
            } as Goal;
          }
        }
      }
    } catch (err) {
      console.warn('Supabase saveGoal error:', err);
    }
  }

  // Local fallback
  const id = goal.id || 'goal-' + Date.now();
  const fullGoal: Goal = {
    id,
    name: goal.name,
    category_type: goal.category_type,
    institution: goal.institution || null,
    expected_cagr: goal.expected_cagr || undefined,
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
  emitChange();
  return fullGoal;
}

export async function deleteGoal(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && isValidUUID(id)) {
    try {
      const supabase = createClient();
      await supabase.from('goals').delete().eq('id', id);
      emitChange();
    } catch (err) {
      console.warn('Supabase deleteGoal error:', err);
    }
  }
  const goals = getLocalItem<Goal[]>(STORAGE_KEYS.GOALS, DEFAULT_GOALS);
  setLocalItem(STORAGE_KEYS.GOALS, goals.filter((g) => g.id !== id));
  emitChange();
  return true;
}

export async function addGoalTransaction(
  goalId: string,
  amount: number,
  type: 'deposit' | 'withdraw',
  note?: string
): Promise<Goal | null> {
  const numericAmount = Math.abs(Number(amount));

  if (isSupabaseConfigured() && isValidUUID(goalId)) {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        const { data: currentGoal } = await supabase
          .from('goals')
          .select('*')
          .eq('id', goalId)
          .single();

        if (currentGoal) {
          let newCurrent = Number(currentGoal.current_amount) || 0;
          if (type === 'deposit') {
            newCurrent += numericAmount;
          } else {
            newCurrent = Math.max(0, newCurrent - numericAmount);
          }

          const target = Number(currentGoal.target_amount);
          const newStatus = newCurrent >= target ? 'completed' : 'in_progress';

          const { data: updatedGoal } = await supabase
            .from('goals')
            .update({
              current_amount: newCurrent,
              status: newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', goalId)
            .select()
            .single();

          await supabase.from('goal_transactions').insert({
            user_id: userId,
            goal_id: goalId,
            amount: numericAmount,
            type,
            date: new Date().toISOString().split('T')[0],
            note,
          });

          emitChange();
          return updatedGoal as Goal;
        }
      }
    } catch (err) {
      console.warn('Supabase addGoalContribution error:', err);
    }
  }

  // Local fallback
  const goals = getLocalItem<Goal[]>(STORAGE_KEYS.GOALS, DEFAULT_GOALS);
  const goalIndex = goals.findIndex((g) => g.id === goalId);
  if (goalIndex === -1) return null;

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
  emitChange();
  return goals[goalIndex];
}

// -------------------------------------------------------------
// API KEYS (Apple Shortcuts Back Tap)
// -------------------------------------------------------------
export async function getApiKeys(): Promise<ApiKey[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        const { data, error } = await supabase
          .from('api_keys')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as ApiKey[];
        }
      }
    } catch (err) {
      console.warn('Supabase getApiKeys error:', err);
    }
  }

  // Local fallback: filter keys by active user if present
  const keys = getLocalItem<ApiKey[]>(STORAGE_KEYS.API_KEYS, DEFAULT_API_KEYS);
  return keys;
}

export async function createApiKey(name: string, explicitUserId?: string): Promise<ApiKey> {
  const randomSuffix = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  const keyHash = `fintrack_sec_${randomSuffix}`;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = explicitUserId || session?.user?.id;

      if (userId) {
        const { data, error } = await supabase
          .from('api_keys')
          .insert({
            user_id: userId,
            name: name || 'iPhone Shortcut',
            key_hash: keyHash,
          })
          .select()
          .single();

        if (!error && data) {
          const keys = getLocalItem<ApiKey[]>(STORAGE_KEYS.API_KEYS, DEFAULT_API_KEYS);
          setLocalItem(STORAGE_KEYS.API_KEYS, [data, ...keys]);
          return data as ApiKey;
        }
      }
    } catch (err) {
      console.warn('Supabase createApiKey error:', err);
    }
  }

  const newKey: ApiKey = {
    id: 'key-' + Date.now(),
    name: name || 'iPhone Shortcut',
    key_hash: keyHash,
    created_at: new Date().toISOString(),
  };
  const keys = getLocalItem<ApiKey[]>(STORAGE_KEYS.API_KEYS, DEFAULT_API_KEYS);
  const updated = [...keys, newKey];
  setLocalItem(STORAGE_KEYS.API_KEYS, updated);
  return newKey;
}

export async function deleteApiKey(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && isValidUUID(id)) {
    try {
      const supabase = createClient();
      await supabase.from('api_keys').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteApiKey error:', err);
    }
  }
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

// -------------------------------------------------------------
// DATABASE ADMIN & MULTI-ACCOUNT MANAGEMENT
// -------------------------------------------------------------
export async function getAllUsersSummary(): Promise<UserSummary[]> {
  const allProfiles = await getProfiles();
  // Filter out any demo or administrative placeholder accounts, ensuring only real users are shown
  const profiles = allProfiles.filter(
    (p) =>
      p.id !== 'usr-db-admin-master' &&
      p.email !== 'db_admin@fintrack.internal' &&
      !p.email?.endsWith('@fintrack.local')
  );
  const allExpenses = await getExpenses('all');
  const allGoals = await getGoals();

  const summaries: UserSummary[] = await Promise.all(
    profiles.map(async (prof) => {
      const userExpenses = allExpenses.filter((e) => e.user_id === prof.id);
      const userGoals = allGoals.filter((g) => g.user_id === prof.id);
      const setting = await getMonthlySetting(new Date().getMonth() + 1, new Date().getFullYear());

      const totalSpent = userExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const latestExpense = userExpenses[0];

      return {
        profile: prof,
        expenseCount: userExpenses.length,
        totalSpent,
        monthlyBudget: setting.monthly_budget,
        savingsTarget: setting.savings_target,
        goalsCount: userGoals.length,
        lastActiveDate: latestExpense ? latestExpense.expense_date : prof.created_at?.split('T')[0],
      };
    })
  );

  return summaries;
}

export async function updateUserRole(userId: string, role: 'admin' | 'member'): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (!error) {
        emitChange();
        return true;
      }
    } catch (err) {
      console.error('Failed to update user role in Supabase:', err);
    }
  }

  const profiles = getLocalItem<Profile[]>(STORAGE_KEYS.PROFILES, DEFAULT_PROFILES);
  const target = profiles.find((p) => p.id === userId);
  if (target) {
    target.role = role;
    setLocalItem(STORAGE_KEYS.PROFILES, [...profiles]);
    return true;
  }
  return false;
}

export async function deleteUserAccount(userId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.from('profiles').delete().eq('id', userId);
      emitChange();
      return true;
    } catch (err) {
      console.error('Failed to delete user in Supabase:', err);
    }
  }

  const profiles = getLocalItem<Profile[]>(STORAGE_KEYS.PROFILES, DEFAULT_PROFILES);
  setLocalItem(STORAGE_KEYS.PROFILES, profiles.filter((p) => p.id !== userId));

  const expenses = getLocalItem<Expense[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
  setLocalItem(STORAGE_KEYS.EXPENSES, expenses.filter((e) => e.user_id !== userId));

  return true;
}

export async function getAllExpensesMaster(): Promise<Expense[]> {
  return getExpenses('all');
}
