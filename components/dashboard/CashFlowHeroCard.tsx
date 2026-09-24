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
    <div className="relative overflow-hidden rounded-3xl bg-[#faf6ed] dark:bg-[#1a1510] border-2 border-double border-amber-800/30 dark:border-amber-700/40 text-stone-950 dark:text-amber-100 shadow-md p-5 sm:p-7 space-y-6">
      {/* Top Header: Inflow (Salary) & Plan Action */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-double border-amber-800/20 dark:border-amber-700/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 dark:text-amber-400 font-serif">
              ★ CENTRAL CASH FLOW & INFLOW LEDGER ★
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-950 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              SERIES 1940
            </span>
          </div>
          <div className="flex items-baseline gap-2.5 mt-1.5">
            <span className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-stone-950 dark:text-amber-50">
              {formatINR(income)}
            </span>
            <span className="text-xs font-serif text-stone-600 dark:text-stone-400 italic">Monthly Treasury Inflow</span>
          </div>
        </div>

        <button
          onClick={onEditPlan}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-amber-50 border border-amber-600/50 text-xs font-serif font-bold shadow-xs active:scale-95 transition-all self-start sm:self-auto"
          title="Adjust monthly salary, spending budget, and savings target"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Adjust Treasury Plan</span>
        </button>
      </div>

      {/* Unified Multi-Segment Cash Flow Spectrum Bar - 1940s Banknote Gauge */}
      <div className="space-y-2.5 relative">
        <div className="h-3 w-full rounded-full bg-amber-200/50 dark:bg-stone-900 p-0.5 overflow-hidden flex gap-1 border border-amber-800/20 dark:border-amber-700/30 shadow-inner">
          {/* Spent segment - Burgundy */}
          {spentPct > 0 && (
            <div
              style={{ width: `${spentPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-[#7a2828] to-[#993333] transition-all duration-500 shadow-sm"
              title={`Spent: ${formatINR(totalSpent)} (${spentPct.toFixed(1)}%)`}
            />
          )}

          {/* Saved & Invested from Salary - Banknote Mint */}
          {savingsPct > 0 && (
            <div
              style={{ width: `${savingsPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-[#24543d] to-[#2d6a4f] transition-all duration-500 shadow-sm"
              title={`Saved & Invested: ${formatINR(effectiveSavingsInvestments)} (${savingsPct.toFixed(1)}%)`}
            />
          )}

          {/* Safe to Spend / Free Remaining - Antique Brass Gold */}
          {remainingPct > 0 && (
            <div
              style={{ width: `${remainingPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-[#b8860b] to-[#c5a059] transition-all duration-500 shadow-sm"
              title={`Free Cash: ${formatINR(currentSurplus)} (${remainingPct.toFixed(1)}%)`}
            />
          )}
        </div>

        {/* Legend beneath the spectrum bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-0.5 font-serif">
          <div className="flex items-center justify-between sm:justify-start gap-2 text-stone-700 dark:text-stone-300">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7a2828] shrink-0" />
              <span className="text-[11px] font-bold truncate">Disbursed Funds</span>
            </div>
            <span className="font-mono font-bold text-stone-950 dark:text-amber-100 tabular-nums shrink-0">
              {formatINR(totalSpent)}{' '}
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">
                ({spentPct.toFixed(0)}%)
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2 text-stone-700 dark:text-stone-300">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#24543d] shrink-0" />
              <span className="text-[11px] font-bold truncate">Committed Reserves</span>
            </div>
            <span className="font-mono font-bold text-stone-950 dark:text-amber-100 tabular-nums shrink-0">
              {formatINR(effectiveSavingsInvestments)}{' '}
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">
                ({savingsPct.toFixed(0)}%)
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2 text-stone-700 dark:text-stone-300">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b8860b] shrink-0" />
              <span className="text-[11px] font-bold truncate">Free Liquid Cash</span>
            </div>
            <span className="font-mono font-bold text-stone-950 dark:text-amber-100 tabular-nums shrink-0">
              {formatINR(currentSurplus)}{' '}
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">
                ({remainingPct.toFixed(0)}%)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 3 Useful & Actionable Daily Compass Cards - 1940s Banknote Ledgers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t-2 border-double border-amber-800/20 dark:border-amber-700/30">
        {/* Card 1: Safe Living Budget Remaining */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-900/60 border border-amber-800/20 dark:border-amber-700/30 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-[#7a2828]" />
              <span className="text-[10px] font-serif font-black uppercase tracking-wider text-amber-950 dark:text-amber-300">
                Budget Remaining
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-200/80 dark:bg-amber-950 text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              {budgetUsedPct.toFixed(0)}% used
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-mono font-black text-stone-950 dark:text-amber-50 tracking-tight">
            {formatINR(safeRemaining)}
          </div>

          {/* Micro progress bar */}
          <div className="w-full h-1.5 bg-amber-200/60 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUsedPct > 90 ? 'bg-[#7a2828]' : budgetUsedPct > 70 ? 'bg-amber-600' : 'bg-[#24543d]'
              }`}
              style={{ width: `${Math.min(100, budgetUsedPct)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-serif text-stone-600 dark:text-stone-400 pt-0.5">
            <span>Spent: <strong className="font-mono font-bold text-stone-900 dark:text-stone-200">{formatINR(totalSpent)}</strong></span>
            <span>Limit: <strong className="font-mono font-bold text-stone-900 dark:text-stone-200">{formatINR(monthlyBudget)}</strong></span>
          </div>
        </div>

        {/* Card 2: Daily Safe Spending Compass */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-900/60 border border-amber-800/20 dark:border-amber-700/30 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span className="text-[10px] font-serif font-black uppercase tracking-wider text-amber-950 dark:text-amber-300">
                Daily Allowance
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-200/80 dark:bg-amber-950 text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              {daysRemaining}d left
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-mono font-black text-stone-950 dark:text-amber-50 tracking-tight">
            {formatINR(dailyAllowance)}{' '}
            <span className="text-xs font-serif font-bold text-stone-500 dark:text-stone-400">/ day</span>
          </div>

          <div className="text-[11px] font-serif italic text-stone-600 dark:text-stone-400 truncate">
            Safe daily expenditure quota
          </div>

          <div className="flex items-center justify-between text-[11px] font-serif text-stone-600 dark:text-stone-400 pt-0.5 border-t border-amber-800/10 dark:border-amber-700/20">
            <span>Today spent</span>
            <span className="font-mono font-bold text-stone-900 dark:text-stone-200">
              {formatINR(todaySpent)}
            </span>
          </div>
        </div>

        {/* Card 3: Free Cash Balance (Salary - Saved - Spent) */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-900/60 border border-amber-800/20 dark:border-amber-700/30 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#24543d]" />
              <span className="text-[10px] font-serif font-black uppercase tracking-wider text-amber-950 dark:text-amber-300">
                Free Cash Surplus
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {surplusPct}% inflow
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-mono font-black text-[#24543d] dark:text-emerald-400 tracking-tight">
            {formatINR(currentSurplus)}
          </div>

          <div className="text-[11px] font-serif italic text-stone-600 dark:text-stone-400 truncate">
            Inflow − (Committed + Spent)
          </div>

          <div className="flex items-center justify-between text-[11px] font-serif text-stone-600 dark:text-stone-400 pt-0.5 border-t border-amber-800/10 dark:border-amber-700/20">
            <span>Unallocated buffer</span>
            <span className="font-mono font-bold text-[#24543d] dark:text-emerald-400">
              Liquid Cash
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
