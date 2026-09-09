'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Expense, Category } from '@/types';
import { formatINR, formatPercentage, MONTH_NAMES } from '@/lib/formatting/formatters';
import { CircleDot, List, Plus, Sparkles, TrendingUp, ArrowUpRight } from 'lucide-react';

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
  // Only two view modes: 'donut' and 'list' (pie chart removed)
  const [viewMode, setViewMode] = useState<'donut' | 'list'>('donut');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Filter expenses for selected month & year
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

  // Aggregate category spending
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    const countMap: Record<string, number> = {};

    monthExpenses.forEach((e) => {
      const catId = e.category_id || 'other';
      map[catId] = (map[catId] || 0) + (Number(e.amount) || 0);
      countMap[catId] = (countMap[catId] || 0) + 1;
    });

    return categories
      .map((cat) => {
        const spent = map[cat.id] || 0;
        const count = countMap[cat.id] || 0;
        const percentage = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
        const incomePercentage = income > 0 ? (spent / income) * 100 : 0;
        return {
          id: cat.id,
          name: cat.name,
          icon: cat.icon || '💰',
          color: cat.color || '#0284c7',
          value: spent,
          count,
          percentage,
          incomePercentage,
        };
      })
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [monthExpenses, categories, totalSpent, income]);

  // Active category details for dynamic donut center hole
  const activeItem = useMemo(() => {
    if (!hoveredCategory) return null;
    return categoryData.find((c) => c.id === hoveredCategory) || null;
  }, [hoveredCategory, categoryData]);

  const hasData = categoryData.length > 0;
  const monthName = MONTH_NAMES[month - 1] || 'Month';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-sky-100 dark:border-slate-800 shadow-sm space-y-4 h-full flex flex-col justify-between">
      {/* Header with Title and Mode Switcher */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-2xs">
              <CircleDot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                Category Spending
              </h2>
              <p className="text-[11px] text-slate-800 dark:text-slate-400 font-bold">
                {hasData
                  ? `${categoryData.length} ${categoryData.length === 1 ? 'category' : 'categories'} in ${monthName}`
                  : `${monthName} ${year} Overview`}
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle: Only Donut and List */}
        <div className="flex items-center gap-1 rounded-2xl bg-sky-100/70 dark:bg-slate-800/80 p-1 border border-sky-200/70 dark:border-slate-700/60 shadow-inner-xs">
          <button
            type="button"
            onClick={() => setViewMode('donut')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewMode === 'donut'
                ? 'bg-white dark:bg-slate-900 text-black dark:text-white shadow-xs border border-sky-200/60 dark:border-slate-700'
                : 'text-slate-700 hover:text-black dark:text-slate-400 dark:hover:text-white font-bold'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Donut</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-900 text-black dark:text-white shadow-xs border border-sky-200/60 dark:border-slate-700'
                : 'text-slate-700 hover:text-black dark:text-slate-400 dark:hover:text-white font-bold'
            }`}
          >
            <List className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center my-1">
        {!hasData ? (
          /* Professional Clean Empty State */
          <div className="py-8 sm:py-10 text-center space-y-4 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-sky-100 dark:text-slate-800 stroke-dasharray-[4,4]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                <span className="text-xl">✨</span>
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mt-1">
                  0 Outflow
                </span>
                <span className="text-xs font-black text-black dark:text-white">₹0 Spent</span>
              </div>
            </div>

            <div className="space-y-1 max-w-xs">
              <h4 className="text-xs font-black text-black dark:text-white">
                No spending logged in {monthName}
              </h4>
              <p className="text-[11px] text-slate-700 dark:text-slate-400 font-medium">
                Add an expense to activate your dynamic category breakdown.
              </p>
            </div>

            <Link
              href="/add"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-black shadow-md shadow-sky-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log First Expense</span>
            </Link>
          </div>
        ) : viewMode === 'donut' ? (
          /* Interactive Donut View */
          <div className="space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="h-56 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={66}
                      outerRadius={96}
                      paddingAngle={3}
                      onMouseEnter={(_, index) => setHoveredCategory(categoryData[index].id)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      {categoryData.map((entry) => {
                        const isSelected = hoveredCategory === entry.id;
                        return (
                          <Cell
                            key={entry.id}
                            fill={entry.color}
                            stroke={isSelected ? '#0284c7' : 'transparent'}
                            strokeWidth={isSelected ? 3 : 0}
                            opacity={hoveredCategory ? (isSelected ? 1 : 0.4) : 1}
                            className="transition-all duration-200 cursor-pointer"
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-slate-950/95 text-white px-3.5 py-2 rounded-2xl text-xs shadow-2xl border border-slate-800 backdrop-blur-md space-y-1">
                              <div className="font-black flex items-center gap-1.5 text-white">
                                <span>{item.icon}</span>
                                <span>{item.name}</span>
                              </div>
                              <div className="text-sky-400 font-black text-sm">
                                {formatINR(item.value)}
                              </div>
                              <div className="text-[10px] text-slate-300 font-medium">
                                {formatPercentage(item.percentage)} of total spend
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Dynamic Center Label */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-all duration-200 max-w-[120px]">
                {activeItem ? (
                  <div className="animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-base sm:text-lg mb-0.5">{activeItem.icon}</div>
                    <div className="text-xs sm:text-sm font-black text-black dark:text-white truncate">
                      {formatINR(activeItem.value)}
                    </div>
                    <div className="text-[10px] font-black text-sky-700 dark:text-sky-400">
                      {formatPercentage(activeItem.percentage)}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                      Total Spent
                    </div>
                    <div className="text-base sm:text-xl font-black text-black dark:text-white mt-0.5 tracking-tight">
                      {formatINR(totalSpent)}
                    </div>
                    {income > 0 && (
                      <div className="text-[9px] font-bold text-slate-700 dark:text-slate-400 mt-0.5">
                        {((totalSpent / income) * 100).toFixed(0)}% of income
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Category Legend Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {categoryData.slice(0, 4).map((cat) => {
                const isHovered = hoveredCategory === cat.id;
                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setHoveredCategory(cat.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isHovered
                        ? 'bg-sky-100/90 dark:bg-slate-800 border-sky-300 dark:border-slate-600 shadow-xs scale-102'
                        : 'bg-sky-50/60 dark:bg-slate-800/40 border-sky-100 dark:border-slate-800 hover:border-sky-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm shrink-0">{cat.icon}</span>
                      <span className="text-xs font-bold text-black dark:text-white truncate">
                        {cat.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-black dark:text-white">
                        {formatINR(cat.value)}
                      </div>
                      <div className="text-[10px] font-bold text-sky-700 dark:text-sky-400">
                        {formatPercentage(cat.percentage)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Highly Structured & Professional List View */
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {categoryData.map((cat, idx) => (
              <div
                key={cat.id}
                className="p-3 rounded-2xl bg-sky-50/70 dark:bg-slate-800/50 border border-sky-100 dark:border-slate-800 hover:border-sky-200 dark:hover:border-slate-700 transition-colors group space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-black text-slate-500 w-4 text-center">
                      #{idx + 1}
                    </span>
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-xs"
                      style={{
                        backgroundColor: cat.color ? `${cat.color}20` : '#e0f2fe',
                      }}
                    >
                      {cat.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-black text-xs text-black dark:text-white truncate">
                        {cat.name}
                      </div>
                      <div className="text-[10px] text-slate-700 dark:text-slate-400 font-bold">
                        {cat.count} {cat.count === 1 ? 'transaction' : 'transactions'} · {formatPercentage(cat.percentage)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-xs font-black text-black dark:text-white">
                        {formatINR(cat.value)}
                      </div>
                      {income > 0 && (
                        <div className="text-[9px] text-slate-600 dark:text-slate-400 font-medium">
                          {cat.incomePercentage.toFixed(1)}% of income
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/add?category=${encodeURIComponent(cat.id)}`}
                      className="p-1 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Add expense to this category"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Relative Spending Bar */}
                <div className="w-full h-1.5 bg-sky-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Category Log Chips */}
      <div className="pt-2.5 border-t border-sky-100 dark:border-slate-800">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-400 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Quick Log Category</span>
          </span>
          <Link
            href="/add"
            className="text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-0.5 font-bold text-[10px]"
          >
            <span>Custom</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.slice(0, 5).map((cat) => (
            <Link
              key={cat.id}
              href={`/add?category=${encodeURIComponent(cat.id)}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-sky-100 dark:border-slate-700/70 text-[11px] font-black text-black dark:text-slate-200 transition-all active:scale-95 shadow-2xs"
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
