import { Category, PaymentMethod, Expense, MonthlySetting, Goal, ApiKey, Profile } from '@/types';

// Clean initial profiles (empty by default - populated on real authentication)
export const DEFAULT_PROFILES: Profile[] = [];

// Clean standard category presets (available for new users)
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Food', icon: '🍔', color: '#f97316', budget_amount: 10000, is_default: true },
  { id: 'cat-2', name: 'Transport', icon: '🚗', color: '#06b6d4', budget_amount: 5000, is_default: true },
  { id: 'cat-3', name: 'Shopping', icon: '🛍', color: '#ec4899', budget_amount: 8000, is_default: true },
  { id: 'cat-4', name: 'Bills', icon: '🏠', color: '#ef4444', budget_amount: 12000, is_default: true },
  { id: 'cat-5', name: 'Entertainment', icon: '🎬', color: '#8b5cf6', budget_amount: 3000, is_default: true },
  { id: 'cat-6', name: 'Health', icon: '🏥', color: '#10b981', budget_amount: 4000, is_default: true },
  { id: 'cat-7', name: 'Education', icon: '📚', color: '#3b82f6', budget_amount: 5000, is_default: true },
  { id: 'cat-8', name: 'Travel', icon: '✈️', color: '#f59e0b', budget_amount: 6000, is_default: true },
  { id: 'cat-9', name: 'Subscriptions', icon: '🔄', color: '#6366f1', budget_amount: 2000, is_default: true },
  { id: 'cat-10', name: 'Work', icon: '💻', color: '#64748b', budget_amount: 3000, is_default: true },
  { id: 'cat-11', name: 'Personal', icon: '❤️', color: '#f43f5e', budget_amount: 3000, is_default: true },
  { id: 'cat-12', name: 'Investment', icon: '📈', color: '#14b8a6', budget_amount: 10000, is_default: true },
  { id: 'cat-13', name: 'Other', icon: '💰', color: '#94a3b8', budget_amount: 2000, is_default: true },
];

// Clean payment method presets
export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm-1', name: 'UPI', type: 'upi', is_default: true },
  { id: 'pm-2', name: 'Credit Card', type: 'card', is_default: false },
  { id: 'pm-3', name: 'Debit Card', type: 'card', is_default: false },
  { id: 'pm-4', name: 'Cash', type: 'cash', is_default: false },
  { id: 'pm-5', name: 'Bank Transfer', type: 'bank', is_default: false },
  { id: 'pm-6', name: 'Other', type: 'other', is_default: false },
];

export const DEFAULT_MONTHLY_SETTINGS: MonthlySetting[] = [
  {
    id: 'ms-current',
    month: 9,
    year: 2026,
    income: 0,
    monthly_budget: 0,
    savings_target: 0,
  }
];

// Zero dummy goals - populated only when created by user
export const DEFAULT_GOALS: Goal[] = [];

// Zero dummy expenses - clean slate
export const DEFAULT_EXPENSES: Expense[] = [];

export const DEFAULT_API_KEYS: ApiKey[] = [];
