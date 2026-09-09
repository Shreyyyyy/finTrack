import { Expense, Category, MonthlySetting, DashboardSummary } from '@/types';
import { getMonthDaysInfo, formatINR, formatPercentage } from '../formatting/formatters';

/**
 * Calculate comprehensive dashboard metrics strictly using deterministic arithmetic.
 * ZERO AI.
 */
export function calculateDashboardSummary(
  expenses: Expense[],
  setting: MonthlySetting,
  categories: Category[] = []
): DashboardSummary {
  const { month, year, income, monthly_budget } = setting;
  const { daysElapsed, totalDays } = getMonthDaysInfo(month, year);

  // Filter expenses belonging to this specific month and year
  const monthExpenses = expenses.filter((e) => {
    if (!e.expense_date) return false;
    const parts = e.expense_date.split('-');
    const expYear = parseInt(parts[0], 10);
    const expMonth = parseInt(parts[1], 10);
    return expYear === year && expMonth === month;
  });

  // Total spending
  const totalSpent = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Remaining budget
  const remainingBudget = Math.max(0, monthly_budget - totalSpent);

  // Savings
  const savings = Math.max(0, income - totalSpent);

  // Savings rate
  const savingsRate = income > 0 ? ((income - totalSpent) / income) * 100 : 0;

  // Budget utilization
  const budgetUtilization = monthly_budget > 0 ? (totalSpent / monthly_budget) * 100 : 0;

  // Average daily spending
  const averageDailySpending = daysElapsed > 0 ? totalSpent / daysElapsed : 0;

  // Projected monthly spending
  const projectedSpending = averageDailySpending * totalDays;

  // Calculate highest spending category
  const categoryTotals: Record<string, number> = {};
  for (const exp of monthExpenses) {
    const catId = exp.category_id || 'other';
    categoryTotals[catId] = (categoryTotals[catId] || 0) + Number(exp.amount);
  }

  let highestCategory: { name: string; amount: number; percentage: number } | undefined = undefined;
  let maxCatAmount = 0;
  for (const [catId, amount] of Object.entries(categoryTotals)) {
    if (amount > maxCatAmount) {
      maxCatAmount = amount;
      const foundCategory = categories.find((c) => c.id === catId);
      const catName = foundCategory ? foundCategory.name : 'Other';
      const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
      highestCategory = { name: catName, amount, percentage };
    }
  }

  // Calculate highest spending day
  const dayTotals: Record<string, number> = {};
  for (const exp of monthExpenses) {
    dayTotals[exp.expense_date] = (dayTotals[exp.expense_date] || 0) + Number(exp.amount);
  }

  let highestDay: { date: string; amount: number } | undefined = undefined;
  let maxDayAmount = 0;
  for (const [date, amount] of Object.entries(dayTotals)) {
    if (amount > maxDayAmount) {
      maxDayAmount = amount;
      highestDay = { date, amount };
    }
  }

  return {
    month,
    year,
    income,
    totalSpent,
    remainingBudget,
    savings,
    savingsRate,
    budgetUtilization,
    monthlyBudget: monthly_budget,
    projectedSpending,
    averageDailySpending,
    daysElapsed,
    daysInMonth: totalDays,
    highestCategory,
    highestDay,
  };
}

/**
 * Generate clear, deterministic financial insight strings.
 * Absolutely NO LLM / AI used.
 */
export function generateDeterministicInsights(summary: DashboardSummary): string[] {
  const insights: string[] = [];
  const {
    budgetUtilization,
    monthlyBudget,
    totalSpent,
    averageDailySpending,
    daysInMonth,
    daysElapsed,
    highestCategory,
    projectedSpending,
  } = summary;

  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

  // 1. Budget utilization insight
  if (monthlyBudget > 0) {
    if (budgetUtilization > 100) {
      insights.push(`You have exceeded your monthly budget by ${formatINR(totalSpent - monthlyBudget)} (${formatPercentage(budgetUtilization)} utilized).`);
    } else {
      insights.push(`You have spent ${formatPercentage(budgetUtilization)} of your monthly budget.`);
    }
  }

  // 2. Daily spending rate insight
  if (averageDailySpending > 0) {
    insights.push(`Your average daily spending this month is ${formatINR(averageDailySpending)}.`);
  }

  // 3. Category concentration
  if (highestCategory && highestCategory.amount > 0) {
    insights.push(`${highestCategory.name} is your largest spending category (${formatINR(highestCategory.amount)}, ${formatPercentage(highestCategory.percentage)} of spending).`);
  }

  // 4. Days remaining
  insights.push(`You have ${daysRemaining} days remaining in this month.`);

  // 5. Projected variance
  if (monthlyBudget > 0 && projectedSpending > 0) {
    if (projectedSpending > monthlyBudget) {
      insights.push(`At current pace, projected month-end spending is ${formatINR(projectedSpending)}, which is ${formatINR(projectedSpending - monthlyBudget)} over budget.`);
    } else {
      insights.push(`You are on track to finish ${formatINR(monthlyBudget - projectedSpending)} below your maximum spending limit.`);
    }
  }

  return insights;
}

/**
 * Compare two amounts and compute percentage delta
 */
export function calculateDelta(current: number, previous: number): { deltaAmount: number; percentage: number; isIncrease: boolean } {
  const deltaAmount = current - previous;
  const isIncrease = deltaAmount > 0;
  if (previous === 0) {
    return {
      deltaAmount,
      percentage: current > 0 ? 100 : 0,
      isIncrease,
    };
  }
  const percentage = ((current - previous) / Math.abs(previous)) * 100;
  return {
    deltaAmount,
    percentage,
    isIncrease,
  };
}
