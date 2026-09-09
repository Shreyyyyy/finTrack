import * as XLSX from 'xlsx';
import { Expense, Category, PaymentMethod, MonthlySetting, Goal } from '@/types';
import { MONTH_NAMES } from '../formatting/formatters';

interface ExportDataParams {
  expenses: Expense[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  monthlySetting: MonthlySetting;
  goals: Goal[];
  scope: 'month' | 'range' | 'all';
  dateRangeLabel?: string;
}

export function exportToExcel({
  expenses,
  categories,
  paymentMethods,
  monthlySetting,
  goals,
  scope,
  dateRangeLabel,
}: ExportDataParams) {
  const wb = XLSX.utils.book_new();

  // 1. Transactions Sheet
  const txData = expenses.map((e) => {
    const cat = categories.find((c) => c.id === e.category_id);
    const pm = paymentMethods.find((p) => p.id === e.payment_method_id);
    return {
      'Date': e.expense_date,
      'Merchant': e.merchant || 'General',
      'Category': cat ? `${cat.icon} ${cat.name}` : 'Other',
      'Payment Method': pm ? pm.name : 'UPI',
      'Amount (INR)': Number(e.amount),
      'Note': e.note || '',
    };
  });

  const wsTransactions = XLSX.utils.json_to_sheet(txData.length > 0 ? txData : [
    { 'Date': '', 'Merchant': '', 'Category': '', 'Payment Method': '', 'Amount (INR)': 0, 'Note': 'No transactions' }
  ]);
  wsTransactions['!cols'] = [
    { wch: 14 }, // Date
    { wch: 22 }, // Merchant
    { wch: 20 }, // Category
    { wch: 18 }, // Payment Method
    { wch: 16 }, // Amount
    { wch: 30 }, // Note
  ];
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions');

  // 2. Monthly Summary Sheet
  const totalSpending = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const income = monthlySetting.income;
  const budget = monthlySetting.monthly_budget;
  const savings = Math.max(0, income - totalSpending);
  const savingsRate = income > 0 ? ((income - totalSpending) / income) * 100 : 0;
  const budgetRemaining = Math.max(0, budget - totalSpending);
  const budgetUsedPct = budget > 0 ? (totalSpending / budget) * 100 : 0;

  const summaryData = [
    { 'Metric': 'Month & Year', 'Value': `${MONTH_NAMES[monthlySetting.month - 1]} ${monthlySetting.year}` },
    { 'Metric': 'Total Income (INR)', 'Value': income },
    { 'Metric': 'Total Spending (INR)', 'Value': totalSpending },
    { 'Metric': 'Monthly Budget (INR)', 'Value': budget },
    { 'Metric': 'Budget Remaining (INR)', 'Value': budgetRemaining },
    { 'Metric': 'Budget Utilization (%)', 'Value': `${budgetUsedPct.toFixed(1)}%` },
    { 'Metric': 'Net Savings (INR)', 'Value': savings },
    { 'Metric': 'Savings Rate (%)', 'Value': `${savingsRate.toFixed(1)}%` },
    { 'Metric': 'Savings Target (INR)', 'Value': monthlySetting.savings_target },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 26 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Monthly Summary');

  // 3. Category Analysis Sheet
  const categorySpending: Record<string, number> = {};
  expenses.forEach((e) => {
    const catId = e.category_id || 'other';
    categorySpending[catId] = (categorySpending[catId] || 0) + Number(e.amount);
  });

  const catData = categories.map((cat) => {
    const spent = categorySpending[cat.id] || 0;
    const pct = totalSpending > 0 ? (spent / totalSpending) * 100 : 0;
    const catBudget = cat.budget_amount || 0;
    const remaining = catBudget > 0 ? Math.max(0, catBudget - spent) : 0;
    return {
      'Category': `${cat.icon} ${cat.name}`,
      'Total Spent (INR)': spent,
      'Percentage (%)': `${pct.toFixed(1)}%`,
      'Monthly Budget (INR)': catBudget,
      'Remaining Budget (INR)': remaining,
    };
  }).sort((a, b) => b['Total Spent (INR)'] - a['Total Spent (INR)']);

  const wsCategory = XLSX.utils.json_to_sheet(catData);
  wsCategory['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 20 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsCategory, 'Category Analysis');

  // 4. Payment Methods Sheet
  const pmSpending: Record<string, number> = {};
  expenses.forEach((e) => {
    const pmId = e.payment_method_id || 'other';
    pmSpending[pmId] = (pmSpending[pmId] || 0) + Number(e.amount);
  });

  const pmData = paymentMethods.map((pm) => {
    const spent = pmSpending[pm.id] || 0;
    const pct = totalSpending > 0 ? (spent / totalSpending) * 100 : 0;
    return {
      'Payment Method': pm.name,
      'Total Spent (INR)': spent,
      'Percentage (%)': `${pct.toFixed(1)}%`,
    };
  }).sort((a, b) => b['Total Spent (INR)'] - a['Total Spent (INR)']);

  const wsPayment = XLSX.utils.json_to_sheet(pmData);
  wsPayment['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsPayment, 'Payment Methods');

  // 5. Goals Sheet
  const goalsData = goals.map((g) => {
    const progress = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
    return {
      'Goal Name': g.name,
      'Target Amount (INR)': g.target_amount,
      'Current Amount (INR)': g.current_amount,
      'Progress (%)': `${progress.toFixed(1)}%`,
      'Target Deadline': g.deadline || 'No deadline',
      'Monthly Contribution (INR)': g.monthly_contribution,
      'Status': g.status,
    };
  });

  const wsGoals = XLSX.utils.json_to_sheet(goalsData.length > 0 ? goalsData : [
    { 'Goal Name': 'No goals created', 'Target Amount (INR)': 0, 'Current Amount (INR)': 0, 'Progress (%)': '0%', 'Target Deadline': '', 'Monthly Contribution (INR)': 0, 'Status': '' }
  ]);
  wsGoals['!cols'] = [{ wch: 26 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 24 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsGoals, 'Goals');

  // 6. Dashboard High-Level KPI Sheet
  const dashboardData = [
    { 'finTrack Financial Health Report': 'Personal Money Utility' },
    { 'finTrack Financial Health Report': `Generated: ${new Date().toLocaleDateString('en-IN')}` },
    { 'finTrack Financial Health Report': `Scope: ${scope.toUpperCase()} ${dateRangeLabel || ''}` },
    { 'finTrack Financial Health Report': '' },
    { 'finTrack Financial Health Report': `Monthly Income: INR ${income}` },
    { 'finTrack Financial Health Report': `Total Outflow: INR ${totalSpending}` },
    { 'finTrack Financial Health Report': `Net Savings: INR ${savings} (${savingsRate.toFixed(1)}%)` },
    { 'finTrack Financial Health Report': `Budget Capacity Remaining: INR ${budgetRemaining}` },
  ];
  const wsDashboard = XLSX.utils.json_to_sheet(dashboardData, { skipHeader: true });
  wsDashboard['!cols'] = [{ wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsDashboard, 'Dashboard');

  // Filename formatting
  const monthName = MONTH_NAMES[monthlySetting.month - 1];
  const year = monthlySetting.year;
  let filename = `Expense_Tracker_${monthName}_${year}.xlsx`;
  if (scope === 'all') {
    filename = `Expense_Tracker_All_Time_${year}.xlsx`;
  } else if (scope === 'range' && dateRangeLabel) {
    filename = `Expense_Tracker_${dateRangeLabel.replace(/\s+/g, '_')}.xlsx`;
  }

  // Write file in browser
  XLSX.writeFile(wb, filename);
  return filename;
}
