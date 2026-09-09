'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Expense, Category } from '@/types';
import { formatINR, formatPercentage } from '@/lib/formatting/formatters';
import { CircleDot, List, PlusCircle } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'bars' | 'donut'>('bars');

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

  const pieData = sortedCategories.map((c) => ({
    name: c.name,
    icon: c.icon,
    value: c.spent,
    color: c.color || '#0284c7',
  }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-sky-100 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-slate-400">
          Category Spending
        </h3>

        {sortedCategories.length > 0 && (
          <div className="flex items-center gap-1 rounded-xl bg-sky-100/70 dark:bg-slate-800 p-0.5 border border-sky-200/70 dark:border-transparent">
            <button
              onClick={() => setViewMode('bars')}
              className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                viewMode === 'bars'
                  ? 'bg-white dark:bg-slate-900 text-black dark:text-white shadow-xs font-black'
                  : 'text-slate-700 hover:text-black dark:text-slate-400 font-bold'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[10px]">List</span>
            </button>
            <button
              onClick={() => setViewMode('donut')}
              className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                viewMode === 'donut'
                  ? 'bg-white dark:bg-slate-900 text-black dark:text-white shadow-xs font-black'
                  : 'text-slate-700 hover:text-black dark:text-slate-400 font-bold'
              }`}
              title="Donut Chart View"
            >
              <CircleDot className="w-3.5 h-3.5" />
              <span className="text-[10px]">Donut</span>
            </button>
          </div>
        )}
      </div>

      {sortedCategories.length === 0 ? (
        <div className="py-4 text-center space-y-3">
          <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">
            No spending recorded for this month yet.
          </p>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Quick Log by Category:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/add?category=${encodeURIComponent(cat.id)}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-emerald-950/40 border border-sky-100 dark:border-slate-700/80 text-xs font-bold text-black dark:text-slate-300 transition-all active:scale-95 shadow-2xs"
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : viewMode === 'donut' ? (
        <div className="space-y-3">
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-950 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg border border-slate-800">
                          <div>
                            {item.icon} {item.name}
                          </div>
                          <div className="text-emerald-400">{formatINR(item.value)}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-2 justify-center pt-1">
            {sortedCategories.slice(0, 4).map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-1 text-[11px] text-slate-800 dark:text-slate-400 font-semibold"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color || '#10b981' }}
                />
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCategories.slice(0, 5).map((cat) => (
            <div key={cat.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="text-black dark:text-slate-200 font-bold">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-black dark:text-white font-black">
                    {formatINR(cat.spent)}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-500">
                    ({formatPercentage(cat.percentage)})
                  </span>
                </div>
              </div>
              <div className="w-full bg-sky-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
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
