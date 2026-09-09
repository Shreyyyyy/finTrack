'use client';

import React from 'react';
import { formatINR, formatPercentage } from '@/lib/formatting/formatters';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface BudgetProgressBarProps {
  spent: number;
  budget: number;
  label?: string;
}

export function BudgetProgressBar({ spent, budget, label = 'Monthly Budget' }: BudgetProgressBarProps) {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const isOverBudget = percentage > 100;
  const isNearBudget = percentage >= 85 && percentage <= 100;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-sky-100 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
            {label}
          </span>
          <div className="text-xl sm:text-2xl font-black text-black dark:text-white mt-0.5">
            {formatINR(spent)}{' '}
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
              / {formatINR(budget)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              isOverBudget
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                : isNearBudget
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
            }`}
          >
            {isOverBudget ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            <span>{formatPercentage(percentage)}</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
            {isOverBudget
              ? `Exceeded by ${formatINR(spent - budget)}`
              : `${formatINR(budget - spent)} remaining`}
          </div>
        </div>
      </div>

      {/* Track and Fill */}
      <div className="w-full bg-sky-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOverBudget
              ? 'bg-gradient-to-r from-rose-500 to-rose-600'
              : isNearBudget
              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(2, percentage))}%` }}
        />
      </div>
    </div>
  );
}
