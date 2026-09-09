import { Category, PaymentMethod, Expense, MonthlySetting, Goal, ApiKey, Profile } from '@/types';

export const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'usr-1',
    email: 'you@fintrack.local',
    display_name: 'You (Owner)',
    currency: 'INR',
    default_payment_method: 'UPI',
  },
  {
    id: 'usr-2',
    email: 'sarah@fintrack.local',
    display_name: 'Sarah',
    currency: 'INR',
    default_payment_method: 'UPI',
  },
  {
    id: 'usr-3',
    email: 'alex@fintrack.local',
    display_name: 'Alex',
    currency: 'INR',
    default_payment_method: 'Credit Card',
  },
];

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
    income: 80000,
    monthly_budget: 50000,
    savings_target: 30000,
  },
  {
    id: 'ms-prev',
    month: 8,
    year: 2026,
    income: 80000,
    monthly_budget: 50000,
    savings_target: 30000,
  }
];

export const DEFAULT_GOALS: Goal[] = [
  {
    id: 'goal-1',
    name: 'MacBook Pro M-Series',
    target_amount: 150000,
    current_amount: 72000,
    deadline: '2026-12-31',
    monthly_contribution: 15000,
    status: 'in_progress',
  },
  {
    id: 'goal-2',
    name: 'Emergency Fund',
    target_amount: 100000,
    current_amount: 40000,
    deadline: '2027-03-31',
    monthly_contribution: 10000,
    status: 'in_progress',
  },
  {
    id: 'goal-3',
    name: 'Travel (Goa / Himalayas)',
    target_amount: 60000,
    current_amount: 25000,
    deadline: '2026-11-15',
    monthly_contribution: 5000,
    status: 'in_progress',
  },
];

export const DEFAULT_EXPENSES: Expense[] = [
  // Today's expenses (matches user prompt)
  {
    id: 'exp-1',
    user_id: 'usr-1',
    amount: 350,
    category_id: 'cat-1',
    payment_method_id: 'pm-1',
    merchant: 'Dinner',
    note: 'Dinner with friends',
    expense_date: '2026-09-09',
  },
  {
    id: 'exp-2',
    user_id: 'usr-1',
    amount: 220,
    category_id: 'cat-2',
    payment_method_id: 'pm-1',
    merchant: 'Uber',
    note: 'Ride to office',
    expense_date: '2026-09-09',
  },
  {
    id: 'exp-3',
    user_id: 'usr-1',
    amount: 160,
    category_id: 'cat-1',
    payment_method_id: 'pm-2',
    merchant: 'Blue Tokai',
    note: 'Morning coffee',
    expense_date: '2026-09-09',
  },
  // Yesterday's expenses
  {
    id: 'exp-4',
    user_id: 'usr-2',
    amount: 1299,
    category_id: 'cat-3',
    payment_method_id: 'pm-2',
    merchant: 'Zara / Uniqlo',
    note: 'Summer wear',
    expense_date: '2026-09-08',
  },
  {
    id: 'exp-5',
    user_id: 'usr-3',
    amount: 2000,
    category_id: 'cat-4',
    payment_method_id: 'pm-1',
    merchant: 'Electricity Bill',
    note: 'Bescom bill payment',
    expense_date: '2026-09-08',
  },
  // Earlier in September 2026
  {
    id: 'exp-6',
    user_id: 'usr-1',
    amount: 4500,
    category_id: 'cat-1',
    payment_method_id: 'pm-2',
    merchant: 'Nature Basket',
    note: 'Monthly groceries',
    expense_date: '2026-09-05',
  },
  {
    id: 'exp-7',
    user_id: 'usr-2',
    amount: 1199,
    category_id: 'cat-9',
    payment_method_id: 'pm-2',
    merchant: 'Netflix & Spotify',
    note: 'Monthly entertainment subs',
    expense_date: '2026-09-04',
  },
  {
    id: 'exp-8',
    user_id: 'usr-1',
    amount: 14000,
    category_id: 'cat-4',
    payment_method_id: 'pm-5',
    merchant: 'House Rent',
    note: 'Monthly room maintenance/rent',
    expense_date: '2026-09-01',
  },
  {
    id: 'exp-9',
    user_id: 'usr-3',
    amount: 1800,
    category_id: 'cat-6',
    payment_method_id: 'pm-1',
    merchant: 'Apollo Pharmacy',
    note: 'Supplements & health',
    expense_date: '2026-09-03',
  },
  {
    id: 'exp-10',
    user_id: 'usr-2',
    amount: 1602,
    category_id: 'cat-5',
    payment_method_id: 'pm-1',
    merchant: 'PVR Cinema IMAX',
    note: 'Weekend movie ticket and popcorn',
    expense_date: '2026-09-06',
  },
  // August 2026 expenses for comparison (Total: ₹42,300)
  {
    id: 'exp-aug-1',
    amount: 7200,
    category_id: 'cat-1',
    payment_method_id: 'pm-1',
    merchant: 'Food & Dining',
    note: 'August Dining',
    expense_date: '2026-08-15',
  },
  {
    id: 'exp-aug-2',
    amount: 9200,
    category_id: 'cat-3',
    payment_method_id: 'pm-2',
    merchant: 'Shopping Festival',
    note: 'Electronics & clothes',
    expense_date: '2026-08-18',
  },
  {
    id: 'exp-aug-3',
    amount: 18000,
    category_id: 'cat-4',
    payment_method_id: 'pm-5',
    merchant: 'Rent & Maintenance',
    note: 'August Rent',
    expense_date: '2026-08-01',
  },
  {
    id: 'exp-aug-4',
    amount: 4500,
    category_id: 'cat-2',
    payment_method_id: 'pm-1',
    merchant: 'Fuel & Cab',
    note: 'August Travel',
    expense_date: '2026-08-20',
  },
  {
    id: 'exp-aug-5',
    amount: 3400,
    category_id: 'cat-5',
    payment_method_id: 'pm-2',
    merchant: 'Concert & Outings',
    note: 'Social events',
    expense_date: '2026-08-26',
  }
];

export const DEFAULT_API_KEYS: ApiKey[] = [
  {
    id: 'key-1',
    name: 'iPhone Back Tap Shortcut',
    key_hash: 'fintrack_sec_9083a21b3cd4e890',
    created_at: '2026-09-09T08:00:00Z',
  }
];
