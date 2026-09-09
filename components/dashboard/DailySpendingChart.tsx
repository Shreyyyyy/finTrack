'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Expense } from '@/types';
import { formatINR } from '@/lib/formatting/formatters';

interface DailySpendingChartProps {
  expenses: Expense[];
  month: number;
  year: number;
}

export function DailySpendingChart({ expenses, month, year }: DailySpendingChartProps) {
  // Aggregate daily expenses for this month
  const totalDays = new Date(year, month, 0).getDate();
  const dayTotals: Record<number, number> = {};

  for (let d = 1; d <= totalDays; d++) {
    dayTotals[d] = 0;
  }

  expenses.forEach((e) => {
    if (!e.expense_date) return;
    const parts = e.expense_date.split('-');
    const expYear = parseInt(parts[0], 10);
    const expMonth = parseInt(parts[1], 10);
    const expDay = parseInt(parts[2], 10);
    if (expYear === year && expMonth === month) {
      dayTotals[expDay] = (dayTotals[expDay] || 0) + Number(e.amount);
    }
  });

  const chartData = Object.entries(dayTotals).map(([day, amount]) => ({
    day: `${day}`,
    amount,
  }));

  // Only show up to current day if current month
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const currentDay = now.getDate();
  const filteredData = isCurrentMonth
    ? chartData.filter((d) => parseInt(d.day, 10) <= Math.min(currentDay, totalDays))
    : chartData;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Daily Spending Trend
        </h3>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          Day 1 - {filteredData.length}
        </span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              interval={filteredData.length > 15 ? 2 : 0}
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
                  return (
                    <div className="bg-slate-950 text-white px-3 py-1.5 rounded-xl text-xs font-medium shadow-lg border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Day {payload[0].payload.day}</div>
                      <div className="font-bold text-emerald-400">
                        {formatINR(Number(payload[0].value))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="amount"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
