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
        <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Monthly Salary</span>
            <Wallet className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
            {formatINR(monthlySetting.income)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Total Monthly Inflow
          </div>
        </div>

        {/* Spent */}
        <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Expenses Spent</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg font-black text-rose-600 dark:text-rose-400 tabular-nums">
            {formatINR(totalSpent)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Living Outflow
          </div>
        </div>

        {/* Saved & Invested (Deducted from Salary) */}
        <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-emerald-500/20 dark:border-emerald-500/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-emerald-400 uppercase tracking-wider">
            <span>Saved & Invested</span>
            <Coins className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatINR(totalMonthlyCommitted)}
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
            Deducted from Salary
          </div>
        </div>

        {/* Free Cash in Hand */}
        <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-sky-500/20 dark:border-sky-500/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-sky-400 uppercase tracking-wider">
            <span>Free Cash Surplus</span>
            <PiggyBank className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-lg font-black text-sky-700 dark:text-sky-300 tabular-nums">
            {formatINR(freeCashInHand)}
          </div>
          <div className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
            Liquid Unallocated
          </div>
        </div>
      </div>

      {/* Adjust Plan quick action button for mobile */}
      <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        <div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">Monthly Cash Flow Target</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Daily Safe: <strong className="text-slate-900 dark:text-white font-bold">{formatINR(safeDailyAllowance)}/day</strong> ({daysRemaining}d left)
          </div>
        </div>

        <button
          type="button"
          onClick={onEditPlan}
          className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1 shrink-0"
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
