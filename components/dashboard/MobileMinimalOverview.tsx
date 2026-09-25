'use client';

import React, { useMemo } from 'react';
import { Expense, Category, MonthlySetting, Goal } from '@/types';
import { formatINR } from '@/lib/formatting/formatters';
import { HomePagePieChart } from './HomePagePieChart';
import { RecentExpenses } from './RecentExpenses';
import { Wallet, TrendingDown, PiggyBank, Sliders, Coins } from 'lucide-react';

interface MobileMinimalOverviewProps {
  expenses: Expense[];
  categories: Category[];
  goals?: Goal[];
  monthlySetting: MonthlySetting;
  income?: number;
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
  income,
  selectedMonth,
  selectedYear,
  totalSpent,
  remainingBudget,
  safeDailyAllowance,
  daysRemaining,
  onEditPlan,
}: MobileMinimalOverviewProps) {
  const effectiveInflow = income !== undefined ? income : monthlySetting.income;

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
    effectiveInflow - totalSpent - totalMonthlyCommitted
  );

  return (
    <div className="space-y-4 md:hidden">
      {/* 1. Featured Category Donut & List Breakdown */}
      <HomePagePieChart
        expenses={expenses}
        categories={categories}
        month={selectedMonth}
        year={selectedYear}
        income={effectiveInflow}
      />

      {/* 2. 1940s Banknote Numbers Grid (Salary, Spent, Saved & Invested, Free Cash) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Salary - Gilded Amber */}
        <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-stone-900/60 border border-amber-800/30 dark:border-amber-700/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-serif font-black text-amber-950 dark:text-amber-300 uppercase tracking-wider">
            <span>Monthly Inflow</span>
            <Wallet className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="text-lg font-mono font-black text-stone-950 dark:text-amber-50 tabular-nums">
            {formatINR(effectiveInflow)}
          </div>
          <div className="text-[10px] font-serif italic text-stone-600 dark:text-stone-400">
            Treasury Inflow
          </div>
        </div>

        {/* Spent - Burgundy */}
        <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-stone-900/60 border border-rose-800/30 dark:border-rose-700/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-serif font-black text-rose-950 dark:text-rose-300 uppercase tracking-wider">
            <span>Disbursed</span>
            <TrendingDown className="w-3.5 h-3.5 text-[#7a2828] dark:text-rose-400" />
          </div>
          <div className="text-lg font-mono font-black text-[#7a2828] dark:text-rose-400 tabular-nums">
            {formatINR(totalSpent)}
          </div>
          <div className="text-[10px] font-serif italic text-stone-600 dark:text-stone-400">
            Living Outflow
          </div>
        </div>

        {/* Saved & Invested - Hunter Green */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-stone-900/60 border border-emerald-800/30 dark:border-emerald-700/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-serif font-black text-emerald-950 dark:text-emerald-300 uppercase tracking-wider">
            <span>Vault Reserves</span>
            <Coins className="w-3.5 h-3.5 text-[#24543d] dark:text-emerald-400" />
          </div>
          <div className="text-lg font-mono font-black text-[#24543d] dark:text-emerald-400 tabular-nums">
            {formatINR(totalMonthlyCommitted)}
          </div>
          <div className="text-[10px] font-serif italic text-stone-600 dark:text-stone-400">
            Committed Wealth
          </div>
        </div>

        {/* Free Cash in Hand - Mint Gold */}
        <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-stone-900/60 border border-amber-800/30 dark:border-amber-700/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[10px] font-serif font-black text-amber-950 dark:text-amber-300 uppercase tracking-wider">
            <span>Free Surplus</span>
            <PiggyBank className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="text-lg font-mono font-black text-amber-900 dark:text-amber-200 tabular-nums">
            {formatINR(freeCashInHand)}
          </div>
          <div className="text-[10px] font-serif italic text-stone-600 dark:text-stone-400">
            Liquid Buffer
          </div>
        </div>
      </div>

      {/* Adjust Plan quick action button for mobile */}
      <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#faf6ed] dark:bg-[#1a1510] border-2 border-double border-amber-800/30 dark:border-amber-700/40 shadow-xs">
        <div>
          <div className="text-xs font-serif font-black text-stone-950 dark:text-amber-100">Treasury Cash Target</div>
          <div className="text-[11px] font-serif text-stone-600 dark:text-stone-400">
            Safe: <strong className="font-mono font-bold text-stone-900 dark:text-amber-200">{formatINR(safeDailyAllowance)}/day</strong> ({daysRemaining}d left)
          </div>
        </div>

        <button
          type="button"
          onClick={onEditPlan}
          className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-amber-50 text-xs font-serif font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1 shrink-0 border border-amber-600/50"
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
