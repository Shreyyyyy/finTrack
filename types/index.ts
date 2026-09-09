export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  currency: string;
  default_payment_method: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  icon: string;
  color: string;
  budget_amount: number;
  is_default?: boolean;
  created_at?: string;
}

export interface PaymentMethod {
  id: string;
  user_id?: string;
  name: string;
  type: string;
  is_default?: boolean;
  created_at?: string;
}

export interface Expense {
  id: string;
  user_id?: string;
  amount: number;
  category_id?: string | null;
  payment_method_id?: string | null;
  merchant?: string | null;
  note?: string | null;
  expense_date: string; // YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
  // Joined or resolved
  category?: Category;
  payment_method?: PaymentMethod;
  profile?: Profile;
}

export interface MonthlySetting {
  id: string;
  user_id?: string;
  month: number; // 1 - 12
  year: number;
  income: number;
  monthly_budget: number;
  savings_target: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryBudget {
  id: string;
  user_id?: string;
  category_id: string;
  month: number;
  year: number;
  budget_amount: number;
}

export interface Goal {
  id: string;
  user_id?: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string | null; // YYYY-MM-DD
  monthly_contribution: number;
  status: 'in_progress' | 'completed' | 'paused';
  created_at?: string;
  updated_at?: string;
}

export interface GoalTransaction {
  id: string;
  user_id?: string;
  goal_id: string;
  amount: number;
  type: 'deposit' | 'withdraw';
  date: string;
  note?: string | null;
  created_at?: string;
}

export interface ApiKey {
  id: string;
  user_id?: string;
  name: string;
  key_hash: string;
  created_at?: string;
}

export interface DashboardSummary {
  month: number;
  year: number;
  income: number;
  totalSpent: number;
  remainingBudget: number;
  savings: number;
  savingsRate: number;
  budgetUtilization: number;
  monthlyBudget: number;
  projectedSpending: number;
  averageDailySpending: number;
  daysElapsed: number;
  daysInMonth: number;
  highestCategory?: { name: string; amount: number; percentage: number };
  highestDay?: { date: string; amount: number };
}
