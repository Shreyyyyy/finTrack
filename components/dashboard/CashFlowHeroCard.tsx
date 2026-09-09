'use client';

import React from 'react';
import { Sliders, Sparkles, TrendingDown, Clock, Wallet } from 'lucide-react';
import { formatINR } from '@/lib/formatting/formatters';

interface CashFlowHeroCardProps {
  income: number;
  monthlyBudget: number;
  totalSpent: number;
  savingsTarget: number;
  daysRemaining: number;
  todaySpent?: number;
  monthlyCommittedSavingsInvestments?: number;
  onEditPlan: () => void;
}

export function CashFlowHeroCard({
  income,
  monthlyBudget,
  totalSpent,
  savingsTarget,
  daysRemaining,
  todaySpent = 0,
  monthlyCommittedSavingsInvestments = 0,
  onEditPlan,
}: CashFlowHeroCardProps) {
  // Deterministic Financial Logic:
  // Savings & Investments are deducted from monthly salary first!
  const effectiveSavingsInvestments = Math.max(savingsTarget, monthlyCommittedSavingsInvestments);
  const safeRemaining = Math.max(0, monthlyBudget - totalSpent);
  
  // Current free cash surplus in bank = Salary - Spent - (Savings & Investments committed)
  const currentSurplus = Math.max(0, income - totalSpent - monthlyCommittedSavingsInvestments);
  
  const dailyAllowance = daysRemaining > 0 ? Math.round(safeRemaining / daysRemaining) : 0;

  // Spectrum Bar Percentages (relative to Income)
  const spentPct = income > 0 ? Math.min(100, (totalSpent / income) * 100) : 0;
  const savingsPct =
    income > 0 ? Math.min(100 - spentPct, (effectiveSavingsInvestments / income) * 100) : 0;
  const remainingPct = Math.max(0, 100 - spentPct - savingsPct);
  const budgetUsedPct = monthlyBudget > 0 ? Math.min(100, (totalSpent / monthlyBudget) * 100) : 0;
  const surplusPct = income > 0 ? Math.round((currentSurplus / income) * 100) : 0;

  // Clean Zero State: If no salary or budget is configured yet
  if (income === 0 && monthlyBudget === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/[0.08] shadow-xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 dark:bg-sky-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span>Clean Slate • Ready For Your Plan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Set Your Monthly Salary & Budget
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed font-medium">
              No plan configured yet. Enter your real monthly take-home salary and spending limit to calculate your safe daily allowance and track your net savings.
            </p>
          </div>
          <button
            onClick={onEditPlan}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-xl shadow-sky-600/25 active:scale-98 transition-all shrink-0"
          >
            <Sliders className="w-4 h-4" />
            <span>Set Salary & Budget</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/[0.08] shadow-xl shadow-slate-950/5 p-5 sm:p-7 space-y-6">
      {/* Subtle ambient lighting glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 dark:bg-sky-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Top Header: Inflow (Salary) & Plan Action */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Monthly Salary Cash Flow
            </span>
          </div>
          <div className="flex items-baseline gap-2.5 mt-1.5">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {formatINR(income)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Monthly Inflow (Salary)</span>
          </div>
        </div>

        <button
          onClick={onEditPlan}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-white transition-all active:scale-95 self-start sm:self-auto shadow-xs"
          title="Adjust monthly salary, spending budget, and savings target"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Adjust Plan</span>
        </button>
      </div>

      {/* Unified Multi-Segment Cash Flow Spectrum Bar */}
      <div className="space-y-2.5 relative">
        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-white/[0.06] p-0.5 overflow-hidden flex gap-1 shadow-inner">
          {/* Spent segment */}
          {spentPct > 0 && (
            <div
              style={{ width: `${spentPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500 shadow-sm"
              title={`Spent: ${formatINR(totalSpent)} (${spentPct.toFixed(1)}%)`}
            />
          )}

          {/* Saved & Invested from Salary */}
          {savingsPct > 0 && (
            <div
              style={{ width: `${savingsPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-sm"
              title={`Saved & Invested: ${formatINR(effectiveSavingsInvestments)} (${savingsPct.toFixed(1)}%)`}
            />
          )}

          {/* Safe to Spend / Free Remaining */}
          {remainingPct > 0 && (
            <div
              style={{ width: `${remainingPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500 shadow-sm"
              title={`Free Cash: ${formatINR(currentSurplus)} (${remainingPct.toFixed(1)}%)`}
            />
          )}
        </div>

        {/* Cohesive Legend beneath the spectrum bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-0.5">
          <div className="flex items-center justify-between sm:justify-start gap-2 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span className="text-[11px] font-medium truncate">Spent</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
              {formatINR(totalSpent)}{' '}
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                ({spentPct.toFixed(0)}%)
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[11px] font-medium truncate">Saved & Invested</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
              {formatINR(effectiveSavingsInvestments)}{' '}
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                ({savingsPct.toFixed(0)}%)
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shrink-0" />
              <span className="text-[11px] font-medium truncate">Free Cash Left</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
              {formatINR(currentSurplus)}{' '}
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                ({remainingPct.toFixed(0)}%)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 3 Useful & Actionable Daily Compass Cards - Unified Frosted Glass Design */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-200/70 dark:border-white/[0.06]">
        {/* Card 1: Safe Living Budget Remaining */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-2.5 shadow-2xs group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Budget Remaining
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/70 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-white/10">
              {budgetUsedPct.toFixed(0)}% used
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatINR(safeRemaining)}
          </div>

          {/* Micro progress bar */}
          <div className="w-full h-1.5 bg-slate-200/80 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUsedPct > 90 ? 'bg-rose-500' : budgetUsedPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, budgetUsedPct)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
            <span>Spent: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{formatINR(totalSpent)}</strong></span>
            <span>Limit: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{formatINR(monthlyBudget)}</strong></span>
          </div>
        </div>

        {/* Card 2: Daily Safe Spending Compass */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-2.5 shadow-2xs group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Daily Allowance
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              {daysRemaining}d left
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatINR(dailyAllowance)}{' '}
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ day</span>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Safe daily pace for remainder of month
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-200/60 dark:border-white/[0.05]">
            <span>Today spent</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatINR(todaySpent)}
            </span>
          </div>
        </div>

        {/* Card 3: Free Cash Balance (Salary - Saved - Spent) */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-2.5 shadow-2xs group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Free Cash Surplus
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              {surplusPct}% salary
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatINR(currentSurplus)}
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Salary − (Committed + Spent)
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-200/60 dark:border-white/[0.05]">
            <span>Unallocated buffer</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Liquid Cash
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
