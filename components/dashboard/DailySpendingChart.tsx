'use client';

import React from 'react';
import Link from 'next/link';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Expense } from '@/types';
import { formatINR } from '@/lib/formatting/formatters';
import { PlusCircle, Calendar } from 'lucide-react';

interface DailySpendingChartProps {
  expenses: Expense[];
  month: number;
  year: number;
}

export function DailySpendingChart({ expenses, month, year }: DailySpendingChartProps) {
  const totalDays = new Date(year, month, 0).getDate();
  const dayTotals: Record<number, number> = {};

  for (let d = 1; d <= totalDays; d++) {
    dayTotals[d] = 0;
  }

  let totalMonthSpend = 0;
  expenses.forEach((e) => {
    if (!e.expense_date) return;
    const parts = e.expense_date.split('-');
    const expYear = parseInt(parts[0], 10);
    const expMonth = parseInt(parts[1], 10);
    const expDay = parseInt(parts[2], 10);
    if (expYear === year && expMonth === month) {
      dayTotals[expDay] = (dayTotals[expDay] || 0) + Number(e.amount);
      totalMonthSpend += Number(e.amount);
    }
  });

  const chartData = Object.entries(dayTotals).map(([day, amount]) => ({
    day: `${day}`,
    amount,
  }));

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const currentDay = now.getDate();
  const filteredData = isCurrentMonth
    ? chartData.filter((d) => parseInt(d.day, 10) <= Math.min(currentDay, totalDays))
    : chartData;

  return (
    <div className="bg-[#faf6ed] dark:bg-[#1a1510] rounded-3xl p-5 border-2 border-double border-amber-800/30 dark:border-amber-700/40 shadow-sm space-y-3 text-stone-900 dark:text-amber-100">
      <div className="flex items-center justify-between border-b-2 border-double border-amber-800/20 dark:border-amber-700/30 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 dark:text-amber-400 font-serif">
            ★ DAILY EXPENDITURE TRAJECTORY ★
          </span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-950 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            DAY 1 - {filteredData.length}
          </span>
        </div>
        <span className="text-xs font-serif font-bold text-stone-600 dark:text-stone-400">
          Monthly Ledger
        </span>
      </div>

      {totalMonthSpend === 0 ? (
        <div className="h-44 w-full flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-amber-100/40 dark:bg-stone-900/40 border border-dashed border-amber-800/30 dark:border-amber-700/30">
          <Calendar className="w-8 h-8 text-amber-700 dark:text-amber-400 mb-2 stroke-[1.5]" />
          <p className="text-xs font-serif font-bold text-stone-950 dark:text-amber-200">
            No entries recorded for this ledger month
          </p>
          <p className="text-[11px] font-serif italic text-stone-600 dark:text-stone-400 mt-0.5 max-w-xs">
            Record a voucher to track your daily disbursement trajectory.
          </p>
          <Link
            href="/add"
            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-amber-50 text-xs font-serif font-bold shadow-sm transition-all border border-amber-600/40"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Record First Voucher</span>
          </Link>
        </div>
      ) : (
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#78716c', fontFamily: 'serif' }}
                interval={filteredData.length > 15 ? 2 : 0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#78716c', fontFamily: 'serif' }}
                tickFormatter={(val) => (val >= 1000 ? `₹${val / 1000}k` : `₹${val}`)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#1c1712] text-amber-100 px-3 py-1.5 rounded-xl text-xs font-serif shadow-lg border border-amber-700/60">
                        <div className="text-amber-400/80 text-[10px] font-mono">Day {payload[0].payload.day}</div>
                        <div className="font-mono font-bold text-amber-200">
                          {formatINR(Number(payload[0].value))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="amount" fill="#b8860b" radius={[4, 4, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
