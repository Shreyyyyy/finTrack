'use client';

import React from 'react';
import { Expense, Category } from '@/types';
import { formatINR, formatPercentage } from '@/lib/formatting/formatters';

interface CategorySpendingCardProps {
  expenses: Expense[];
  categories: Category[];
  month: number;
  year: number;
}

export function CategorySpendingCard({
  expenses,
  categories,
  month,
  year,
}: CategorySpendingCardProps) {
  // Filter for month
  const monthExpenses = expenses.filter((e) => {
    if (!e.expense_date) return false;
    const parts = e.expense_date.split('-');
    return parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month;
  });

  const totalSpent = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Group by category
  const catSpending: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    const catId = e.category_id || 'other';
    catSpending[catId] = (catSpending[catId] || 0) + Number(e.amount);
  });

  const sortedCategories = categories
    .map((cat) => ({
      ...cat,
      spent: catSpending[cat.id] || 0,
      percentage: totalSpent > 0 ? ((catSpending[cat.id] || 0) / totalSpent) * 100 : 0,
    }))
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Category Spending
        </h3>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {sortedCategories.length} Active
        </span>
      </div>

      {sortedCategories.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">No categorized spending this month.</p>
      ) : (
        <div className="space-y-3">
          {sortedCategories.slice(0, 5).map((cat) => (
            <div key={cat.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="text-slate-800 dark:text-slate-200">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 dark:text-white font-bold">{formatINR(cat.spent)}</span>
                  <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                    ({formatPercentage(cat.percentage)})
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(3, cat.percentage))}%`,
                    backgroundColor: cat.color || '#10b981',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
