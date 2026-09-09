'use client';

import React from 'react';
import { Expense, Category, MonthlySetting, Goal } from '@/types';
import { formatINR } from '@/lib/formatting/formatters';
import { HomePagePieChart } from './HomePagePieChart';
import { RecentExpenses } from './RecentExpenses';
import { FinancialPulseWidget } from './FinancialPulseWidget';
import { SavingsInvestmentsSection } from './SavingsInvestmentsSection';
import { Wallet, TrendingDown, PiggyBank, Scale, Sliders } from 'lucide-react';

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

      {/* 1.2 Dedicated Savings & Investments Portfolio (Travel, Investments, Emergency Reserve) */}
      <SavingsInvestmentsSection goals={goals} monthlyBurnRate={totalSpent} />

      {/* 1.5 Live Financial Vitality & Habits Pulse */}
      <FinancialPulseWidget
        expenses={expenses}
        income={monthlySetting.income}
        monthlyBudget={monthlySetting.monthly_budget}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      {/* 2. Ultra Minimal Essential Numbers Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-wider">
            <span>Salary</span>
            <Wallet className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-lg font-black text-black dark:text-white mt-1">
            {formatINR(monthlySetting.income)}
          </div>
          <div className="text-[10px] text-slate-700 dark:text-slate-400 mt-0.5 font-bold">Monthly Income</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-wider">
            <span>Spent</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg font-black text-black dark:text-white mt-1">
            {formatINR(totalSpent)}
          </div>
          <div className="text-[10px] text-slate-700 dark:text-slate-400 mt-0.5 font-bold">Total Outflow</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-800 dark:text-emerald-400 uppercase tracking-wider">
            <span>How Much Left</span>
            <PiggyBank className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg font-black text-black dark:text-emerald-400 mt-1">
            {formatINR(remainingBudget)}
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold mt-0.5">
            Safe Remaining
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/60 shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-800 dark:text-amber-400 uppercase tracking-wider">
            <span>Daily Safe</span>
            <Scale className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-lg font-black text-black dark:text-amber-400 mt-1">
            {formatINR(safeDailyAllowance)} <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">/day</span>
          </div>
          <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold mt-0.5">
            For {daysRemaining} days left
          </div>
        </div>
      </div>

      {/* Adjust Plan quick action button for mobile */}
      <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-white dark:bg-slate-900 text-black dark:text-white border border-sky-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="text-xs font-bold text-black dark:text-white">Monthly Cash Flow Target</div>
          <div className="text-[11px] text-slate-700 dark:text-slate-400 font-medium">
            Target Savings: <strong className="text-black dark:text-white">{formatINR(monthlySetting.savings_target)}</strong>
          </div>
        </div>
        <button
          onClick={onEditPlan}
          className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold shrink-0 flex items-center gap-1 active:scale-95 shadow-xs"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Edit Plan</span>
        </button>
      </div>

      {/* 3. Recent Transactions Feed */}
      <RecentExpenses expenses={expenses} limit={6} />
    </div>
  );
}
