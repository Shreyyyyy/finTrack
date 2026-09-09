import { Category, PaymentMethod, Expense, MonthlySetting, Goal, ApiKey, Profile } from '@/types';

// Zero initial profiles - populated solely on real user authentication
export const DEFAULT_PROFILES: Profile[] = [];

// Clean standard category presets with zero dummy budgets
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Food & Dining', icon: '🍔', color: '#f97316', budget_amount: 0, is_default: true },
  { id: 'cat-2', name: 'Transportation', icon: '🚗', color: '#06b6d4', budget_amount: 0, is_default: true },
  { id: 'cat-3', name: 'Shopping', icon: '🛍', color: '#ec4899', budget_amount: 0, is_default: true },
  { id: 'cat-4', name: 'Bills & Utilities', icon: '🏠', color: '#ef4444', budget_amount: 0, is_default: true },
  { id: 'cat-5', name: 'Entertainment', icon: '🎬', color: '#8b5cf6', budget_amount: 0, is_default: true },
  { id: 'cat-6', name: 'Health & Medical', icon: '🏥', color: '#10b981', budget_amount: 0, is_default: true },
  { id: 'cat-7', name: 'Groceries', icon: '🛒', color: '#14b8a6', budget_amount: 0, is_default: true },
  { id: 'cat-8', name: 'Subscriptions', icon: '🔄', color: '#6366f1', budget_amount: 0, is_default: true },
  { id: 'cat-9', name: 'Personal Care', icon: '❤️', color: '#f43f5e', budget_amount: 0, is_default: true },
  { id: 'cat-10', name: 'Other', icon: '💰', color: '#94a3b8', budget_amount: 0, is_default: true },
];

// Clean payment method presets
export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm-1', name: 'UPI', type: 'upi', is_default: true },
  { id: 'pm-2', name: 'Credit Card', type: 'card', is_default: false },
  { id: 'pm-3', name: 'Debit Card', type: 'card', is_default: false },
  { id: 'pm-4', name: 'Cash', type: 'cash', is_default: false },
  { id: 'pm-5', name: 'Net Banking', type: 'bank', is_default: false },
];

// Zero dummy monthly settings
export const DEFAULT_MONTHLY_SETTINGS: MonthlySetting[] = [
  {
    id: 'ms-current',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    income: 0,
    monthly_budget: 0,
    savings_target: 0,
  },
];

// Zero dummy goals - populated only when created by user
export const DEFAULT_GOALS: Goal[] = [];

// Zero dummy expenses - clean slate
export const DEFAULT_EXPENSES: Expense[] = [];

// Zero dummy API keys
export const DEFAULT_API_KEYS: ApiKey[] = [];
