'use client';

import React from 'react';
import { Sliders, TrendingDown, Clock, PiggyBank, Sparkles, ShieldCheck } from 'lucide-react';
import { formatINR, formatPercentage } from '@/lib/formatting/formatters';

interface CashFlowHeroCardProps {
  income: number;
  monthlyBudget: number;
  totalSpent: number;
  savingsTarget: number;
  daysRemaining: number;
  onEditPlan: () => void;
}

export function CashFlowHeroCard({
  income,
  monthlyBudget,
  totalSpent,
  savingsTarget,
  daysRemaining,
  onEditPlan,
}: CashFlowHeroCardProps) {
  // Financial Logic:
  // Salary = Living Budget + Planned Savings
  // Safe Remaining = max(0, monthlyBudget - totalSpent)
  // Daily Allowance = Safe Remaining / daysRemaining
  const safeRemaining = Math.max(0, monthlyBudget - totalSpent);
  const plannedSavings = Math.max(0, income - monthlyBudget);
  const actualSavings = Math.max(0, income - totalSpent);
  const dailyAllowance = daysRemaining > 0 ? Math.round(safeRemaining / daysRemaining) : 0;

  // Spectrum Bar Percentages (relative to Income)
  const spentPct = income > 0 ? Math.min(100, (totalSpent / income) * 100) : 0;
  const remainingPct = income > 0 ? Math.min(100 - spentPct, (safeRemaining / income) * 100) : 0;
  const savingsPct = Math.max(0, 100 - spentPct - remainingPct);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl p-5 sm:p-7 space-y-6">
      {/* Background glow accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Top Row: Salary & Quick Edit Button */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Monthly Financial Plan</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2.5 mt-1">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {formatINR(income)}
            </span>
            <span className="text-xs text-slate-400 font-medium">Monthly Inflow (Salary)</span>
          </div>
        </div>

        <button
          onClick={onEditPlan}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all active:scale-95 self-start sm:self-auto shadow-sm"
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span>Edit Salary & Budget</span>
        </button>
      </div>

      {/* Unified Multi-Segment Cash Flow Spectrum Bar */}
      <div className="space-y-2 relative">
        <div className="h-3.5 w-full rounded-full bg-slate-800/80 p-0.5 overflow-hidden flex gap-1 shadow-inner">
          {/* Spent segment */}
          {spentPct > 0 && (
            <div
              style={{ width: `${spentPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500"
              title={`Spent: ${formatINR(totalSpent)}`}
            />
          )}

          {/* Safe to Spend Remaining */}
          {remainingPct > 0 && (
            <div
              style={{ width: `${remainingPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-500"
              title={`Remaining to spend: ${formatINR(safeRemaining)}`}
            />
          )}

          {/* Planned Savings */}
          {savingsPct > 0 && (
            <div
              style={{ width: `${savingsPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              title={`Planned Savings: ${formatINR(plannedSavings)}`}
            />
          )}
        </div>

        {/* Legend beneath the spectrum bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-400 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Spent: {formatINR(totalSpent)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Safe to Spend: {formatINR(safeRemaining)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Target Savings: {formatINR(plannedSavings)}</span>
          </div>
        </div>
      </div>

      {/* 3 Core Actionable Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
        {/* Metric 1: Spent So Far */}
        <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Spent This Month</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {formatINR(totalSpent)}
          </div>
          <div className="text-[11px] text-slate-400">
            {formatPercentage(monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0)} of ₹{Math.round(monthlyBudget / 1000)}k limit
          </div>
        </div>

        {/* Metric 2: Safe Daily Allowance (Most useful metric!) */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold uppercase tracking-wider">
            <span>Safe Daily Allowance</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300">
            {formatINR(dailyAllowance)} <span className="text-xs font-bold text-amber-400/80">/ day</span>
          </div>
          <div className="text-[11px] text-amber-300/80">
            For the next {daysRemaining} days of this month
          </div>
        </div>

        {/* Metric 3: Planned Savings */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-emerald-300 font-bold uppercase tracking-wider">
            <span>Target Savings</span>
            <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300">
            {formatINR(plannedSavings)}
          </div>
          <div className="text-[11px] text-emerald-300/80">
            {income > 0 ? ((plannedSavings / income) * 100).toFixed(1) : 0}% of your monthly income
          </div>
        </div>
      </div>
    </div>
  );
}
