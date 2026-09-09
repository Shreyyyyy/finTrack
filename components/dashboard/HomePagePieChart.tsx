'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Expense, Category } from '@/types';
import { formatINR, formatPercentage } from '@/lib/formatting/formatters';
import { PieChart as PieIcon, ListFilter, TrendingUp, Sparkles, Plus } from 'lucide-react';

interface HomePagePieChartProps {
  expenses: Expense[];
  categories: Category[];
  month: number;
  year: number;
  income?: number;
}

export function HomePagePieChart({
  expenses,
  categories,
  month,
  year,
  income = 0,
}: HomePagePieChartProps) {
  const [viewMode, setViewMode] = useState<'donut' | 'pie' | 'list'>('donut');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Filter expenses for current selected month & year
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!e.expense_date) return false;
      const parts = e.expense_date.split('-');
      return parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month;
    });
  }, [expenses, month, year]);

  const totalSpent = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [monthExpenses]);

  // Aggregate category spending or fallback preview if 0 spent
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      const catId = e.category_id || 'other';
      map[catId] = (map[catId] || 0) + (Number(e.amount) || 0);
    });

    const activeList = categories
      .map((cat) => {
        const spent = map[cat.id] || 0;
        const percentage = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
        const incomePercentage = income > 0 ? (spent / income) * 100 : 0;
        return {
          id: cat.id,
          name: cat.name,
          icon: cat.icon || '💰',
          color: cat.color || '#10b981',
          value: spent,
          percentage,
          incomePercentage,
          isPlaceholder: false,
        };
      })
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);

    if (activeList.length > 0) {
      return activeList;
    }

    // Fallback Preview Pie Slices if no expenses recorded yet
    const fallbackColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    return categories.slice(0, 6).map((cat, idx) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon || '💰',
      color: cat.color || fallbackColors[idx % fallbackColors.length],
      value: 1, // equal slice preview
      percentage: 100 / Math.min(categories.length, 6),
      incomePercentage: 0,
      isPlaceholder: true,
    }));
  }, [monthExpenses, categories, totalSpent, income]);

  const isPlaceholderState = totalSpent === 0;
  const topCategory = isPlaceholderState ? null : categoryData[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-sky-100 dark:border-slate-800 shadow-sm space-y-4 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-sky-100 dark:bg-emerald-500/10 text-sky-700 dark:text-emerald-400 flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
              Spending Breakdown Pie
            </h2>
          </div>
          <p className="text-[11px] text-slate-700 dark:text-slate-400 mt-0.5 font-medium">
            {isPlaceholderState
              ? 'Category layout preview • Log expenses to see live %'
              : `${categoryData.length} active spending ${categoryData.length === 1 ? 'category' : 'categories'}`}
          </p>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center gap-1 rounded-xl bg-sky-50 dark:bg-slate-800/80 p-1 border border-sky-100 dark:border-slate-700/60">
          <button
            onClick={() => setViewMode('donut')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition-all ${
              viewMode === 'donut'
                ? 'bg-white dark:bg-slate-900 text-black dark:text-emerald-400 shadow-xs'
                : 'text-slate-700 hover:text-black dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Donut
          </button>
          <button
            onClick={() => setViewMode('pie')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition-all ${
              viewMode === 'pie'
                ? 'bg-white dark:bg-slate-900 text-black dark:text-emerald-400 shadow-xs'
                : 'text-slate-700 hover:text-black dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Pie
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-900 text-black dark:text-emerald-400 shadow-xs'
                : 'text-slate-700 hover:text-black dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center my-2">
        {viewMode !== 'list' ? (
          <div className="relative flex flex-col items-center justify-center">
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={viewMode === 'donut' ? 55 : 0}
                    outerRadius={85}
                    paddingAngle={viewMode === 'donut' ? 3 : 1}
                    onMouseEnter={(_, index) => setActiveCategory(categoryData[index].id)}
                    onMouseLeave={() => setActiveCategory(null)}
                  >
                    {categoryData.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={entry.color}
                        opacity={isPlaceholderState ? 0.45 : 1}
                        stroke={activeCategory === entry.id ? '#ffffff' : 'transparent'}
                        strokeWidth={2}
                        className="transition-all duration-200 cursor-pointer hover:opacity-90"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-950/95 text-white px-3 py-1.5 rounded-xl text-xs shadow-xl border border-slate-800 backdrop-blur-md space-y-1">
                            <div className="font-bold flex items-center gap-1 text-white">
                              <span>{item.icon}</span>
                              <span>{item.name}</span>
                            </div>
                            <div className="text-emerald-400 font-bold">
                              {isPlaceholderState ? '₹0 Spent' : formatINR(item.value)}
                            </div>
                            {!isPlaceholderState && (
                              <div className="text-[10px] text-slate-400">
                                {formatPercentage(item.percentage)} of total spend
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Center Label for Donut View */}
            {viewMode === 'donut' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                  {isPlaceholderState ? 'Total Spent' : 'Spent'}
                </div>
                <div className="text-base sm:text-lg font-black text-black dark:text-white mt-0.5">
                  {formatINR(totalSpent)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {categoryData.map((cat) => (
              <div
                key={cat.id}
                className="p-2 rounded-xl bg-sky-50/70 dark:bg-slate-800/40 border border-sky-100 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.icon}</span>
                  <span className="font-bold text-black dark:text-slate-200">
                    {cat.name}
                  </span>
                </div>
                <div className="font-black text-black dark:text-white">
                  {isPlaceholderState ? '₹0' : formatINR(cat.value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Category Log Chips */}
      <div className="pt-2 border-t border-sky-100 dark:border-slate-800">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-1.5 flex items-center justify-between">
          <span>Quick Category Log</span>
          {isPlaceholderState && (
            <span className="text-sky-700 dark:text-emerald-500 font-bold">+ Tap to add</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.slice(0, 5).map((cat) => (
            <Link
              key={cat.id}
              href={`/add?category=${encodeURIComponent(cat.id)}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-slate-800/80 dark:hover:bg-emerald-950/60 border border-sky-100 dark:border-slate-700/70 text-[11px] font-bold text-black dark:text-slate-300 transition-all active:scale-95 shadow-2xs"
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
