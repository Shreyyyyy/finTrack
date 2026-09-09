'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Expense, Category } from '@/types';
import { formatINR, formatPercentage, MONTH_NAMES } from '@/lib/formatting/formatters';
import { CircleDot, List, Plus, ArrowUpRight } from 'lucide-react';

interface HomePagePieChartProps {
  expenses: Expense[];
  categories: Category[];
  month: number;
  year: number;
  income?: number;
}

const LUXURY_PALETTE = [
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#3b82f6', // Sky/Blue
];

export function HomePagePieChart({
  expenses,
  categories,
  month,
  year,
  income = 0,
}: HomePagePieChartProps) {
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

    const activeList = categories
      .map((cat, idx) => {
        const spent = map[cat.id] || 0;
        const count = countMap[cat.id] || 0;
        const percentage = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
        const incomePercentage = income > 0 ? (spent / income) * 100 : 0;
        const fallbackColor = LUXURY_PALETTE[idx % LUXURY_PALETTE.length];
        return {
          id: cat.id,
          name: cat.name,
          icon: cat.icon || '💰',
          color: cat.color || fallbackColor,
          value: spent,
          count,
          percentage,
          incomePercentage,
        };
      })
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);

    // If there is spending under an unmapped category
    if (map['other'] && !activeList.some((c) => c.id === 'other')) {
      const spent = map['other'];
      const count = countMap['other'] || 0;
      activeList.push({
        id: 'other',
        name: 'Other',
        icon: '💰',
        color: '#64748b',
        value: spent,
        count,
        percentage: totalSpent > 0 ? (spent / totalSpent) * 100 : 0,
        incomePercentage: income > 0 ? (spent / income) * 100 : 0,
      });
    }

    return activeList;
  }, [monthExpenses, categories, totalSpent, income]);

  // Active category details for dynamic donut center hole
  const activeItem = useMemo(() => {
    if (!hoveredCategory) return null;
    return categoryData.find((c) => c.id === hoveredCategory) || null;
  }, [hoveredCategory, categoryData]);

  const hasData = categoryData.length > 0;
  const monthName = MONTH_NAMES[month - 1] || 'Month';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/[0.08] shadow-xl shadow-slate-950/5 p-5 sm:p-7 space-y-5 h-full flex flex-col justify-between">
      {/* Subtle ambient lighting glows */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 dark:bg-sky-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header with Title and Mode Switcher */}
      <div className="relative flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-sm shadow-sky-500/50" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Category Spending
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            {hasData
              ? `${categoryData.length} ${categoryData.length === 1 ? 'category' : 'categories'} in ${monthName}`
              : `${monthName} ${year} Overview`}
          </div>
        </div>

        {/* View Mode Toggle: Donut and List */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] p-1 border border-slate-200/80 dark:border-white/10 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('donut')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'donut'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5 text-sky-500" />
            <span>Donut</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5 text-sky-500" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 flex flex-col justify-center my-0.5">
        {!hasData ? (
          /* Clean Empty State */
          <div className="py-8 sm:py-10 text-center space-y-4 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-100 dark:text-white/[0.05] stroke-dasharray-[4,4]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                <span className="text-xl">✨</span>
                <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mt-1">
                  0 Outflow
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white">₹0 Spent</span>
              </div>
            </div>

            <div className="space-y-1 max-w-xs">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                No spending logged in {monthName}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Add an expense to activate your dynamic category breakdown.
              </p>
            </div>

            <Link
              href="/add"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log First Expense</span>
            </Link>
          </div>
        ) : viewMode === 'donut' ? (
          /* Interactive Donut View */
          <div className="space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="h-52 sm:h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {/* Background faint ring track */}
                    <Pie
                      data={[{ value: 1 }]}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={94}
                      isAnimationActive={false}
                      className="fill-slate-100 dark:fill-white/[0.04]"
                    />
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={94}
                      paddingAngle={categoryData.length > 1 ? 3 : 0}
                      onMouseEnter={(_, index) => setHoveredCategory(categoryData[index].id)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      {categoryData.map((entry) => {
                        const isSelected = hoveredCategory === entry.id;
                        return (
                          <Cell
                            key={entry.id}
                            fill={entry.color}
                            stroke={isSelected ? '#ffffff' : 'transparent'}
                            strokeWidth={isSelected ? 2 : 0}
                            opacity={hoveredCategory ? (isSelected ? 1 : 0.45) : 1}
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
                            <div className="bg-slate-900/95 text-white px-3.5 py-2 rounded-xl text-xs shadow-2xl border border-white/10 backdrop-blur-md space-y-1">
                              <div className="font-bold flex items-center gap-1.5 text-white">
                                <span>{item.icon}</span>
                                <span>{item.name}</span>
                              </div>
                              <div className="text-sky-400 font-black text-sm tabular-nums">
                                {formatINR(item.value)}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {formatPercentage(item.percentage)} of monthly spend
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
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-all duration-200 max-w-[130px]">
                {activeItem ? (
                  <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center">
                    <span className="text-lg mb-0.5">{activeItem.icon}</span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                      {activeItem.name}
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                      {formatINR(activeItem.value)}
                    </span>
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                      {formatPercentage(activeItem.percentage)}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Total Spent
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums mt-0.5">
                      {formatINR(totalSpent)}
                    </span>
                    {income > 0 && (
                      <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                        {((totalSpent / income) * 100).toFixed(0)}% of income
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Ranked Category Rows with Micro Progress Bars */}
            <div className="space-y-2 pt-0.5">
              {categoryData.slice(0, 3).map((cat) => {
                const isHovered = hoveredCategory === cat.id;
                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setHoveredCategory(cat.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isHovered
                        ? 'bg-slate-100/90 dark:bg-white/[0.08] border-slate-300 dark:border-white/20 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center text-xs shrink-0 shadow-2xs">
                          {cat.icon}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {cat.count} {cat.count === 1 ? 'tx' : 'txs'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                          {formatINR(cat.value)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200/70 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
                          {cat.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Micro progress line */}
                    <div className="w-full h-1 bg-slate-200/60 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(3, cat.percentage)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Structured List View */
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {categoryData.map((cat, idx) => (
              <div
                key={cat.id}
                className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/15 transition-all group space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 w-4 text-center">
                      #{idx + 1}
                    </span>
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-2xs"
                      style={{
                        backgroundColor: cat.color ? `${cat.color}20` : '#e0f2fe',
                      }}
                    >
                      {cat.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {cat.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {cat.count} {cat.count === 1 ? 'transaction' : 'transactions'} · {formatPercentage(cat.percentage)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                        {formatINR(cat.value)}
                      </div>
                      {income > 0 && (
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
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
                <div className="w-full h-1.5 bg-slate-200/60 dark:bg-white/[0.06] rounded-full overflow-hidden">
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
      <div className="pt-2.5 border-t border-slate-200/70 dark:border-white/[0.06]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center justify-between">
          <span>Quick Log</span>
          <Link
            href="/add"
            className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 font-medium text-[10px]"
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
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200/60 dark:border-white/[0.06] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all active:scale-95 shadow-2xs"
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
