import { Category, PaymentMethod, Expense, MonthlySetting, Goal, ApiKey, Profile } from '@/types';

// Zero initial profiles - populated solely on real user authentication
export const DEFAULT_PROFILES: Profile[] = [];

// Clean standard category presets with 50/30/20 groupings and income categories
export const DEFAULT_CATEGORIES: Category[] = [
  // Needs
  { id: 'cat-4', name: 'Bills & Utilities', icon: '🏠', color: '#ef4444', budget_amount: 0, is_default: true, type: 'expense', group: 'needs' },
  { id: 'cat-7', name: 'Groceries', icon: '🛒', color: '#14b8a6', budget_amount: 0, is_default: true, type: 'expense', group: 'needs' },
  { id: 'cat-2', name: 'Transportation', icon: '🚗', color: '#06b6d4', budget_amount: 0, is_default: true, type: 'expense', group: 'needs' },
  { id: 'cat-6', name: 'Health & Medical', icon: '🏥', color: '#10b981', budget_amount: 0, is_default: true, type: 'expense', group: 'needs' },
  
  // Wants
  { id: 'cat-1', name: 'Food & Dining', icon: '🍔', color: '#f97316', budget_amount: 0, is_default: true, type: 'expense', group: 'wants' },
  { id: 'cat-3', name: 'Shopping', icon: '🛍', color: '#ec4899', budget_amount: 0, is_default: true, type: 'expense', group: 'wants' },
  { id: 'cat-5', name: 'Entertainment', icon: '🎬', color: '#8b5cf6', budget_amount: 0, is_default: true, type: 'expense', group: 'wants' },
  { id: 'cat-8', name: 'Subscriptions', icon: '🔄', color: '#6366f1', budget_amount: 0, is_default: true, type: 'expense', group: 'wants' },
  { id: 'cat-9', name: 'Personal Care', icon: '❤️', color: '#f43f5e', budget_amount: 0, is_default: true, type: 'expense', group: 'wants' },
  { id: 'cat-10', name: 'Other Expenses', icon: '💰', color: '#94a3b8', budget_amount: 0, is_default: true, type: 'expense', group: 'wants' },

  // Income Sources
  { id: 'cat-inc-1', name: 'Salary', icon: '💼', color: '#10b981', budget_amount: 0, is_default: true, type: 'income', group: 'income' },
  { id: 'cat-inc-2', name: 'Freelance & Consulting', icon: '💻', color: '#06b6d4', budget_amount: 0, is_default: true, type: 'income', group: 'income' },
  { id: 'cat-inc-3', name: 'Investments & Dividends', icon: '📈', color: '#8b5cf6', budget_amount: 0, is_default: true, type: 'income', group: 'income' },
  { id: 'cat-inc-4', name: 'Rental Income', icon: '🏢', color: '#f59e0b', budget_amount: 0, is_default: true, type: 'income', group: 'income' },
  { id: 'cat-inc-5', name: 'Refunds & Cashbacks', icon: '🎁', color: '#ec4899', budget_amount: 0, is_default: true, type: 'income', group: 'income' },
  { id: 'cat-inc-6', name: 'Other Income', icon: '💵', color: '#14b8a6', budget_amount: 0, is_default: true, type: 'income', group: 'income' },
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
