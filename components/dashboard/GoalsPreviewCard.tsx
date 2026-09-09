'use client';

import React from 'react';
import Link from 'next/link';
import { Target, ChevronRight, Plus } from 'lucide-react';
import { Goal } from '@/types';
import { formatINR, formatPercentage } from '@/lib/formatting/formatters';

interface GoalsPreviewCardProps {
  goals: Goal[];
  onAddGoalClick?: () => void;
}

export function GoalsPreviewCard({ goals, onAddGoalClick }: GoalsPreviewCardProps) {
  const activeGoals = goals.filter((g) => g.status !== 'completed');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Savings Goals
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onAddGoalClick && (
            <button
              onClick={onAddGoalClick}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-100 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          )}
          <Link
            href="/goals"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>
      </div>

      {activeGoals.length === 0 ? (
        <div className="py-6 text-center space-y-2">
          <p className="text-xs text-slate-400">No active savings goals set.</p>
          {onAddGoalClick ? (
            <button
              onClick={onAddGoalClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Goal</span>
            </button>
          ) : (
            <Link
              href="/goals"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              + Create Savings Goal
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {activeGoals.slice(0, 3).map((goal) => {
            const pct =
              goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            return (
              <div
                key={goal.id}
                className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-900 dark:text-white truncate">{goal.name}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatPercentage(pct)}
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  <span>{formatINR(goal.current_amount)}</span>
                  <span>Target: {formatINR(goal.target_amount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
