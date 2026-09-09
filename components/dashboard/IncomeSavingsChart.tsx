'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { Expense, MonthlySetting } from '@/types';
import { formatINR } from '@/lib/formatting/formatters';
import { BarChart3, TrendingUp, Sparkles } from 'lucide-react';

interface IncomeSavingsChartProps {
  expenses: Expense[];
  monthlySetting: MonthlySetting;
  month: number;
  year: number;
}

export function IncomeSavingsChart({
  expenses,
  monthlySetting,
  month,
  year,
}: IncomeSavingsChartProps) {
  const [chartView, setChartView] = useState<'breakdown' | 'burnDown'>('breakdown');

  const income = Number(monthlySetting.income || 80000);
  const budget = Number(monthlySetting.monthly_budget || 50000);

  // Compute month's actual spent
  const monthExpenses = expenses.filter((e) => {
    if (!e.expense_date) return false;
    const parts = e.expense_date.split('-');
    return parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month;
  });
  const totalSpent = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const currentSavings = Math.max(0, income - totalSpent);

  // 1. Flow Breakdown Data
  const breakdownData = [
    { name: 'Salary / Income', amount: income, color: '#10b981' },
    { name: 'Max Budget', amount: budget, color: '#f59e0b' },
    { name: 'Actual Spent', amount: totalSpent, color: '#f43f5e' },
    { name: 'Current Savings', amount: currentSavings, color: '#06b6d4' },
  ];

  // 2. Cumulative Burn-Down Trajectory Data
  const totalDays = new Date(year, month, 0).getDate();
  const dailySpendMap: Record<number, number> = {};
  for (let i = 1; i <= totalDays; i++) dailySpendMap[i] = 0;

  monthExpenses.forEach((e) => {
    const day = parseInt(e.expense_date.split('-')[2], 10);
    if (day) dailySpendMap[day] = (dailySpendMap[day] || 0) + Number(e.amount);
  });

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const currentDay = now.getDate();

  let runningSpend = 0;
  const burnDownData = [];
  const maxDay = isCurrentMonth ? Math.min(currentDay, totalDays) : totalDays;

  for (let d = 1; d <= maxDay; d++) {
    runningSpend += dailySpendMap[d] || 0;
    const idealBudgetAtDay = Math.round((budget / totalDays) * d);
    burnDownData.push({
      day: `Day ${d}`,
      spent: runningSpend,
      targetPace: idealBudgetAtDay,
    });
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Salary, Budget & Savings Analytics
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Real-time visual comparison of your cash flow and savings rate
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 self-start sm:self-auto text-[11px] font-bold">
          <button
            onClick={() => setChartView('breakdown')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              chartView === 'breakdown'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Salary vs Savings
          </button>
          <button
            onClick={() => setChartView('burnDown')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              chartView === 'burnDown'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Budget Pace Curve
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-60 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartView === 'breakdown' ? (
            <BarChart
              data={breakdownData}
              margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
            >
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(val) => (val >= 1000 ? `₹${val / 1000}k` : `₹${val}`)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-xl border border-slate-800">
                        <div className="text-slate-400 text-[10px]">{data.name}</div>
                        <div className="font-bold text-base" style={{ color: data.color }}>
                          {formatINR(Number(data.amount))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {breakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart
              data={burnDownData}
              margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                interval={burnDownData.length > 10 ? 2 : 0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(val) => (val >= 1000 ? `₹${val / 1000}k` : `₹${val}`)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const current = payload[0].payload;
                    return (
                      <div className="bg-slate-950 text-white p-3 rounded-2xl text-xs space-y-1 shadow-xl border border-slate-800">
                        <div className="text-slate-400 text-[10px]">{current.day}</div>
                        <div className="font-bold text-emerald-400">
                          Spent: {formatINR(current.spent)}
                        </div>
                        <div className="text-[11px] text-amber-400">
                          Target Pace: {formatINR(current.targetPace)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="spent"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#spendGradient)"
                name="Cumulative Spend"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Key Takeaway */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Salary: {formatINR(income)}</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span>Saved: {formatINR(currentSavings)}</span>
          </span>
        </div>

        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Savings Rate: {income > 0 ? ((currentSavings / income) * 100).toFixed(1) : 0}%</span>
        </div>
      </div>
    </div>
  );
}
