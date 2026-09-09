'use client';

import React from 'react';
import { Sliders, TrendingDown, Clock, PiggyBank, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatINR, formatPercentage } from '@/lib/formatting/formatters';

interface CashFlowHeroCardProps {
  income: number;
  monthlyBudget: number;
  totalSpent: number;
  savingsTarget: number;
  daysRemaining: number;
  todaySpent?: number;
  onEditPlan: () => void;
}

export function CashFlowHeroCard({
  income,
  monthlyBudget,
  totalSpent,
  savingsTarget,
  daysRemaining,
  todaySpent = 0,
  onEditPlan,
}: CashFlowHeroCardProps) {
  // Deterministic Financial Logic:
  // Remaining to Spend = max(0, monthlyBudget - totalSpent)
  // Current Surplus (Cash left in bank) = max(0, income - totalSpent)
  // Planned Savings = max(0, income - monthlyBudget)
  // Daily Allowance = Remaining to Spend / daysRemaining
  const safeRemaining = Math.max(0, monthlyBudget - totalSpent);
  const plannedSavings = Math.max(0, income - monthlyBudget);
  const currentSurplus = Math.max(0, income - totalSpent);
  const dailyAllowance = daysRemaining > 0 ? Math.round(safeRemaining / daysRemaining) : 0;
  const todayRemaining = Math.max(0, dailyAllowance - todaySpent);

  // Spectrum Bar Percentages (relative to Income)
  const spentPct = income > 0 ? Math.min(100, (totalSpent / income) * 100) : 0;
  const remainingPct = income > 0 ? Math.min(100 - spentPct, (safeRemaining / income) * 100) : 0;
  const savingsPct = Math.max(0, 100 - spentPct - remainingPct);
  const budgetUsedPct = monthlyBudget > 0 ? Math.min(100, (totalSpent / monthlyBudget) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-2xl p-5 sm:p-7 space-y-6">
      {/* Subtle background glow accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Top Header: Inflow (Salary) & Plan Action */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Monthly Cash Flow Plan</span>
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
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-xs font-bold text-slate-100 hover:text-white transition-all active:scale-95 self-start sm:self-auto shadow-md"
          title="Adjust monthly salary, spending budget, and savings target"
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span>Adjust Plan</span>
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
              title={`Target Savings: ${formatINR(plannedSavings)}`}
            />
          )}
        </div>

        {/* Legend beneath the spectrum bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-400 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Spent: {formatINR(totalSpent)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Safe to Spend: {formatINR(safeRemaining)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Target Savings: {formatINR(plannedSavings)}</span>
          </div>
        </div>
      </div>

      {/* 3 Useful & Actionable Daily Compass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-800/80">
        {/* Card 1: Safe Living Budget Remaining */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Remaining Budget</span>
            <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {formatINR(safeRemaining)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Spent: {formatINR(totalSpent)}</span>
            <span className="font-semibold text-slate-300">
              {budgetUsedPct.toFixed(1)}% of {formatINR(monthlyBudget)}
            </span>
          </div>
        </div>

        {/* Card 2: Daily Safe Spending Compass (Most Useful Everyday Metric) */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-amber-300 font-bold uppercase tracking-wider">
            <span>Daily Allowance</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">
            {formatINR(dailyAllowance)} <span className="text-xs font-bold text-amber-400/80">/ day</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-amber-300/80 pt-0.5">
            <span>For {daysRemaining} days left</span>
            <span className="font-bold text-amber-200">
              Today: {formatINR(todaySpent)}
            </span>
          </div>
        </div>

        {/* Card 3: Net Cash Balance & Target Savings */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-emerald-300 font-bold uppercase tracking-wider">
            <span>Current Net Surplus</span>
            <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300">
            {formatINR(currentSurplus)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-emerald-300/80 pt-0.5">
            <span>Goal: {formatINR(plannedSavings)}</span>
            <span className="font-bold text-emerald-200">
              {income > 0 ? ((currentSurplus / income) * 100).toFixed(0) : 0}% retained
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
