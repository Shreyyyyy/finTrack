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

  // Filter items belonging to this specific month and year
  const currentMonthItems = expenses.filter((e) => {
    if (!e.expense_date) return false;
    const parts = e.expense_date.split('-');
    const expYear = parseInt(parts[0], 10);
    const expMonth = parseInt(parts[1], 10);
    return expYear === year && expMonth === month;
  });

  // Category map for rapid lookup
  const categoryMap = new Map<string, Category>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  // Separate expenses from income transactions
  const monthExpenses = currentMonthItems.filter((e) => e.type !== 'income');
  const monthIncomes = currentMonthItems.filter((e) => e.type === 'income');

  // Actual verified income logged via vouchers
  const actualIncome = monthIncomes.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Distinguish salary vouchers from other credits (refunds, cashbacks, freelance, gifts, etc.)
  const salaryVouchers = monthIncomes.filter((e) => {
    const cat = categoryMap.get(e.category_id || '')?.name || '';
    const note = e.note || '';
    return /salary|payroll|paycheck|wages|stipend/i.test(cat) || /salary|payroll|paycheck|wages|stipend/i.test(note);
  });
  const salaryVouchersTotal = salaryVouchers.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const otherInflows = actualIncome - salaryVouchersTotal;

  const plannedSalary = Number(income) || 0;
  let effectiveIncome = 0;

  if (plannedSalary > 0) {
    if (salaryVouchersTotal > 0) {
      // User planned a salary and logged salary vouchers -> take the greater of the two plus any non-salary earnings
      effectiveIncome = Math.max(plannedSalary, salaryVouchersTotal) + otherInflows;
    } else {
      // User planned a salary and hasn't logged salary voucher yet -> planned salary plus all actual income received
      effectiveIncome = plannedSalary + actualIncome;
    }
  } else {
    // No planned salary -> strictly all actual verified income vouchers
    effectiveIncome = actualIncome;
  }

  // Total spending
  const totalSpent = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Net Cashflow: positive means surplus, negative means operating deficit
  const netCashflow = effectiveIncome - totalSpent;

  // Spendable Budget & Treasury Allowance:
  // When income is credited (freelance, refunds, cashbacks, salary), your Treasury Allowance increases!
  const plannedBudget = Number(monthly_budget) || 0;
  let effectiveBudget = 0;

  if (plannedBudget > 0) {
    // If a budget was planned, any additional income credited directly expands the spendable allowance!
    const extraAllowance = plannedSalary > 0 ? Math.max(0, effectiveIncome - plannedSalary) : actualIncome;
    effectiveBudget = plannedBudget + extraAllowance;
  } else {
    // If no explicit spending budget is configured, the allowance is all available income minus savings target
    effectiveBudget = Math.max(0, effectiveIncome - (Number(setting.savings_target) || 0));
  }

  // Remaining Treasury Allowance
  const remainingBudget = Math.max(0, effectiveBudget - totalSpent);

  // Savings: strictly positive retained cash
  const savings = Math.max(0, netCashflow);

  // Savings rate (% of total income saved; 0 if in deficit)
  const savingsRate = effectiveIncome > 0 && netCashflow > 0 ? (netCashflow / effectiveIncome) * 100 : 0;

  // Budget utilization (% of effective spendable budget used)
  const budgetUtilization = effectiveBudget > 0 ? (totalSpent / effectiveBudget) * 100 : 0;

  // Average daily spending
  const averageDailySpending = daysElapsed > 0 ? totalSpent / daysElapsed : 0;

  // Projected monthly spending
  const projectedSpending = averageDailySpending * totalDays;

  // 50/30/20 Needs vs Wants vs Recurring analysis
  let needsSpent = 0;
  let wantsSpent = 0;
  let recurringTotal = 0;

  // Calculate highest spending category
  const categoryTotals: Record<string, number> = {};
  for (const exp of monthExpenses) {
    const catId = exp.category_id || 'other';
    const amount = Number(exp.amount) || 0;
    categoryTotals[catId] = (categoryTotals[catId] || 0) + amount;

    const cat = categoryMap.get(catId);
    if (cat?.group === 'needs') {
      needsSpent += amount;
    } else {
      // Default to wants for discretionary items
      wantsSpent += amount;
    }

    if (exp.is_recurring || cat?.name.toLowerCase().includes('subscription')) {
      recurringTotal += amount;
    }
  }

  let highestCategory: { name: string; amount: number; percentage: number } | undefined = undefined;
  let maxCatAmount = 0;
  for (const [catId, amount] of Object.entries(categoryTotals)) {
    if (amount > maxCatAmount) {
      maxCatAmount = amount;
      const foundCategory = categoryMap.get(catId);
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

  // Calculate Deterministic Financial Health Score (0 - 100)
  let healthScore = 50; // base

  // 1. Savings Rate weight (max 30 pts)
  if (savingsRate >= 25) healthScore += 25;
  else if (savingsRate >= 15) healthScore += 18;
  else if (savingsRate >= 5) healthScore += 10;
  else if (savingsRate < 0) healthScore -= 20;

  // 2. Budget adherence weight (max 25 pts)
  if (effectiveBudget > 0) {
    if (budgetUtilization <= 85) healthScore += 20;
    else if (budgetUtilization <= 100) healthScore += 12;
    else if (budgetUtilization > 120) healthScore -= 25;
    else healthScore -= 10;
  }

  // 3. Needs vs Wants balance (max 15 pts)
  if (effectiveIncome > 0) {
    const wantsRatio = wantsSpent / effectiveIncome;
    if (wantsRatio <= 0.35) healthScore += 10;
    else if (wantsRatio > 0.50) healthScore -= 10;
  }

  // Clamp 0 - 100
  const financialHealthScore = Math.min(100, Math.max(0, Math.round(healthScore)));

  return {
    month,
    year,
    income: effectiveIncome,
    actualIncome,
    totalSpent,
    netCashflow,
    remainingBudget,
    savings,
    savingsRate,
    budgetUtilization,
    monthlyBudget: effectiveBudget,
    projectedSpending,
    averageDailySpending,
    daysElapsed,
    daysInMonth: totalDays,
    highestCategory,
    highestDay,
    needsSpent,
    wantsSpent,
    recurringTotal,
    financialHealthScore,
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
    actualIncome,
    income,
    savingsRate,
    netCashflow,
    recurringTotal,
  } = summary;

  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

  // Cashflow insight
  if (actualIncome > 0) {
    insights.push(`Logged ₹${actualIncome.toLocaleString('en-IN')} in verified income this month with net cashflow of ${formatINR(netCashflow)}.`);
  }

  // Days remaining
  if (daysRemaining > 0) {
    insights.push(`You have ${daysRemaining} days remaining in this billing month.`);
  }

  // 1. Budget utilization insight
  if (monthlyBudget > 0) {
    if (budgetUtilization > 100) {
      insights.push(`You have exceeded your monthly budget by ${formatINR(totalSpent - monthlyBudget)} (${formatPercentage(budgetUtilization)} utilized).`);
    } else {
      insights.push(`You have spent ${formatPercentage(budgetUtilization)} of your monthly budget.`);
    }
  }

  // 2. Savings rate
  if (income > 0) {
    if (savingsRate >= 20) {
      insights.push(`Strong savings rate of ${formatPercentage(savingsRate)} — well on track with the 50/30/20 wealth rule.`);
    } else if (savingsRate < 0) {
      insights.push(`Net deficit of ${formatINR(Math.abs(netCashflow))} this month. Outflows currently exceed inflows.`);
    }
  }

  // 3. Recurring Commitments
  if (recurringTotal > 0) {
    insights.push(`Fixed subscriptions & recurring commitments total ${formatINR(recurringTotal)} this month.`);
  }

  // 4. Daily spending rate insight
  if (averageDailySpending > 0) {
    insights.push(`Your average daily spending this month is ${formatINR(averageDailySpending)}.`);
  }

  // 5. Category concentration
  if (highestCategory && highestCategory.amount > 0) {
    insights.push(`${highestCategory.name} is your largest spending category (${formatINR(highestCategory.amount)}, ${formatPercentage(highestCategory.percentage)} of spending).`);
  }

  // 6. Projected variance
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
