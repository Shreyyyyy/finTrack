'use client';

import React, { useMemo } from 'react';
import { Expense, Category, MonthlySetting, Goal } from '@/types';
import { formatINR } from '@/lib/formatting/formatters';
import { HomePagePieChart } from './HomePagePieChart';
import { RecentExpenses } from './RecentExpenses';
import { FinancialPulseWidget } from './FinancialPulseWidget';
import { SavingsInvestmentsSection } from './SavingsInvestmentsSection';
import { Wallet, TrendingDown, PiggyBank, Scale, Sliders, Coins } from 'lucide-react';

interface MobileMinimalOverviewProps {
  expenses: Expense[];
  categories: Category[];
  goals?: Goal[];
  monthlySetting: MonthlySetting;
  selectedMonth: number;
  selectedYear: number;
  totalSpent: number;
  remainingBudget: number;
  safeDailyAllowance: number;
  daysRemaining: number;
  onEditPlan: () => void;
}

export function MobileMinimalOverview({
  expenses,
  categories,
  goals = [],
  monthlySetting,
  selectedMonth,
  selectedYear,
  totalSpent,
  remainingBudget,
  safeDailyAllowance,
  daysRemaining,
  onEditPlan,
}: MobileMinimalOverviewProps) {
  // Monthly committed savings & investments deducted directly from salary
  const totalMonthlyCommitted = useMemo(() => {
    return goals.reduce((sum, g) => {
      if (g.status !== 'paused' && g.category_type !== 'cash') {
        return sum + (Number(g.monthly_contribution) || 0);
      }
      return sum;
    }, 0);
  }, [goals]);

  // True free cash surplus left in hand after deducting both savings/investments and expenses from salary
  const freeCashInHand = Math.max(
    0,
    monthlySetting.income - totalSpent - totalMonthlyCommitted
  );

  return (
    <div className="space-y-4 md:hidden">
      {/* 1. Featured Category Donut & List Breakdown */}
      <HomePagePieChart
        expenses={expenses}
        categories={categories}
        month={selectedMonth}
        year={selectedYear}
        income={monthlySetting.income}
      />

      {/* 1.2 Unified Cash, Savings & Investments Wealth Breakdown */}
      <SavingsInvestmentsSection
        goals={goals}
        income={monthlySetting.income}
        totalSpent={totalSpent}
        monthlyBudget={remainingBudget + totalSpent}
        monthlyBurnRate={totalSpent}
      />

      {/* 1.5 Live Financial Vitality & Habits Pulse */}
      <FinancialPulseWidget
        expenses={expenses}
        income={monthlySetting.income}
        monthlyBudget={monthlySetting.monthly_budget}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      {/* 2. Salary Breakdown Numbers Grid (Salary, Spent, Saved & Invested, Free Cash) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Salary */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-wider">
            <span>Monthly Salary</span>
            <Wallet className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-lg font-black text-black dark:text-white mt-1">
            {formatINR(monthlySetting.income)}
          </div>
          <div className="text-[10px] text-slate-700 dark:text-slate-400 mt-0.5 font-bold">
            Total Monthly Inflow
          </div>
        </div>

        {/* Spent */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-wider">
            <span>Expenses Spent</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg font-black text-rose-600 mt-1">
            {formatINR(totalSpent)}
          </div>
          <div className="text-[10px] text-slate-700 dark:text-slate-400 mt-0.5 font-bold">
            Living Outflow
          </div>
        </div>

        {/* Saved & Invested (Deducted from Salary) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-800 dark:text-emerald-400 uppercase tracking-wider">
            <span>Saved & Invested</span>
            <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatINR(totalMonthlyCommitted)}
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold mt-0.5">
            Deducted from Salary
          </div>
        </div>

        {/* Free Cash in Hand */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-800/60 shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-800 dark:text-sky-400 uppercase tracking-wider">
            <span>Free Cash in Hand</span>
            <PiggyBank className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-lg font-black text-sky-700 dark:text-sky-300 mt-1">
            {formatINR(freeCashInHand)}
          </div>
          <div className="text-[10px] text-sky-700 dark:text-sky-300 font-bold mt-0.5">
            Salary - Saved - Spent
          </div>
        </div>
      </div>

      {/* Adjust Plan quick action button for mobile */}
      <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-white dark:bg-slate-900 text-black dark:text-white border border-sky-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="text-xs font-bold text-black dark:text-white">Monthly Cash Flow Target</div>
          <div className="text-[11px] text-slate-700 dark:text-slate-400 font-medium">
            Daily Safe Allowance: <strong className="text-black dark:text-white">{formatINR(safeDailyAllowance)}/day</strong> ({daysRemaining} days left)
          </div>
        </div>

        <button
          type="button"
          onClick={onEditPlan}
          className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-sm transition-all active:scale-95 flex items-center gap-1 shrink-0"
        >
          <Sliders className="w-3 h-3" />
          <span>Adjust</span>
        </button>
      </div>

      {/* Recent Activity Mini List */}
      <RecentExpenses expenses={expenses} />
    </div>
  );
}
