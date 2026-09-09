'use client';

import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { formatINR, formatPercentage } from '@/lib/formatting/formatters';

interface BudgetHealthCardProps {
  totalSpent: number;
  monthlyBudget: number;
  daysElapsed: number;
  daysInMonth: number;
}

export function BudgetHealthCard({
  totalSpent,
  monthlyBudget,
  daysElapsed,
  daysInMonth,
}: BudgetHealthCardProps) {
  const avgDailySpend = daysElapsed > 0 ? Math.round(totalSpent / daysElapsed) : 0;
  const idealDailyBudget = daysInMonth > 0 ? Math.round(monthlyBudget / daysInMonth) : 0;
  const projectedMonthSpend = Math.round(avgDailySpend * daysInMonth);
  const variance = monthlyBudget - projectedMonthSpend;

  // Determine Pace Health
  let status: 'healthy' | 'caution' | 'critical' = 'healthy';
  let statusText = 'Excellent Pace';
  let badgeColor = 'bg-sky-100 text-sky-900 border border-sky-200 dark:bg-emerald-950 dark:text-emerald-300';
  let borderHighlight = 'border-sky-100 dark:border-emerald-500/30';

  if (totalSpent === 0) {
    status = 'healthy';
    statusText = 'On Track (Zero Spend)';
  } else if (projectedMonthSpend > monthlyBudget * 1.2) {
    status = 'critical';
    statusText = 'Over Pace';
    badgeColor = 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300';
    borderHighlight = 'border-rose-300 dark:border-rose-500/40';
  } else if (projectedMonthSpend > monthlyBudget) {
    status = 'caution';
    statusText = 'Near Limit';
    badgeColor = 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300';
    borderHighlight = 'border-amber-300 dark:border-amber-500/40';
  }

  const budgetUsedPct = monthlyBudget > 0 ? Math.min(100, (totalSpent / monthlyBudget) * 100) : 0;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border ${borderHighlight} shadow-sm space-y-4 flex flex-col justify-between`}>
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
            Budget Health & Pace
          </h3>
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${badgeColor}`}>
            {statusText}
          </span>
        </div>

        {/* Big Metric: Daily Average vs Limit */}
        <div className="mt-3 space-y-1">
          <div className="text-[11px] text-slate-700 dark:text-slate-400 font-bold">Average Spending Rate</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-black dark:text-white">
              {formatINR(avgDailySpend)}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
              / day (Target: {formatINR(idealDailyBudget)}/d)
            </span>
          </div>
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-400">
          <span>Month Progress: {daysElapsed} / {daysInMonth} days</span>
          <span>Budget Used: {budgetUsedPct.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-sky-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status === 'critical' ? 'bg-rose-500' : status === 'caution' ? 'bg-amber-500' : 'bg-sky-600 dark:bg-emerald-500'
            }`}
            style={{ width: `${Math.max(2, budgetUsedPct)}%` }}
          />
        </div>
      </div>

      {/* Projection Footer */}
      <div className="p-3 rounded-2xl bg-sky-50 dark:bg-slate-800/50 border border-sky-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div>
          <div className="text-[10px] text-slate-700 dark:text-slate-400 uppercase font-bold">Month-End Projection</div>
          <div className="font-black text-black dark:text-white">
            {formatINR(projectedMonthSpend)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-700 dark:text-slate-400 uppercase font-bold">Estimated Variance</div>
          <div
            className={`font-black ${
              variance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'
            }`}
          >
            {variance >= 0 ? `+${formatINR(variance)} under` : `${formatINR(Math.abs(variance))} over`}
          </div>
        </div>
      </div>
    </div>
  );
}
