'use client';

import React, { useState, useMemo } from 'react';
import {
  Flame,
  Award,
  Zap,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Sparkles,
  Sliders,
  RotateCcw,
  CheckCircle2,
  Activity,
  TrendingDown
} from 'lucide-react';
import { Expense } from '@/types';
import { formatINR } from '@/lib/formatting/formatters';

interface FinancialPulseWidgetProps {
  expenses: Expense[];
  income: number;
  monthlyBudget: number;
  selectedMonth: number;
  selectedYear: number;
}

export function FinancialPulseWidget({
  expenses,
  income,
  monthlyBudget,
  selectedMonth,
  selectedYear,
}: FinancialPulseWidgetProps) {
  const [activeTab, setActiveTab] = useState<'vitality' | 'radar' | 'simulator'>('vitality');

  // Filter expenses for current selected month & year
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!e.expense_date) return false;
      const [y, m] = e.expense_date.split('-').map((v) => parseInt(v, 10));
      return y === selectedYear && m === selectedMonth;
    });
  }, [expenses, selectedMonth, selectedYear]);

  const totalSpent = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [monthExpenses]);

  // Calendar metrics
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === selectedYear && today.getMonth() + 1 === selectedMonth;
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const currentDay = isCurrentMonth ? Math.min(daysInMonth, Math.max(1, today.getDate())) : daysInMonth;
  const daysRemaining = isCurrentMonth ? Math.max(0, daysInMonth - currentDay) : 0;

  // Day-by-day mapping
  const { daysSpentMap, spendPerDayMap } = useMemo(() => {
    const spentSet = new Set<number>();
    const spendMap: Record<number, number> = {};

    monthExpenses.forEach((e) => {
      const parts = e.expense_date.split('-');
      if (parts.length >= 3) {
        const day = parseInt(parts[2], 10);
        spentSet.add(day);
        spendMap[day] = (spendMap[day] || 0) + Number(e.amount);
      }
    });

    return { daysSpentMap: spentSet, spendPerDayMap: spendMap };
  }, [monthExpenses]);

  // No-spend days count
  let noSpendDays = 0;
  for (let d = 1; d <= currentDay; d++) {
    if (!daysSpentMap.has(d)) {
      noSpendDays++;
    }
  }

  // Active consecutive daily tracking streak
  let currentLoggingStreak = 0;
  for (let d = currentDay; d >= 1; d--) {
    if (daysSpentMap.has(d)) {
      currentLoggingStreak++;
    } else {
      break;
    }
  }

  // Burn rates & velocity
  const avgDailyBurn = currentDay > 0 ? Math.round(totalSpent / currentDay) : 0;
  const projectedMonthEndSpend = Math.round(totalSpent + (avgDailyBurn * daysRemaining));
  const projectedMonthEndSavings = Math.max(0, income - projectedMonthEndSpend);
  const remainingCashInHand = Math.max(0, income - totalSpent);
  const runwayDaysLeft = avgDailyBurn > 0 ? Math.floor(remainingCashInHand / avgDailyBurn) : 99;

  // Simulator state: allow user to slide daily burn
  const [simulatedDailyBurn, setSimulatedDailyBurn] = useState<number | null>(null);
  const effectiveSimulatedBurn = simulatedDailyBurn !== null ? simulatedDailyBurn : avgDailyBurn;
  const simulatedRemainingSpend = effectiveSimulatedBurn * daysRemaining;
  const simulatedTotalSpend = totalSpent + simulatedRemainingSpend;
  const simulatedSavings = Math.max(0, income - simulatedTotalSpend);
  const simulatedVariance = projectedMonthEndSpend - simulatedTotalSpend;

  // Financial Vitality Score (0 - 100)
  let healthScore = 85;
  if (monthlyBudget > 0) {
    const budgetPct = (totalSpent / monthlyBudget) * 100;
    if (budgetPct > 100) {
      healthScore -= Math.min(45, (budgetPct - 100) * 1.5);
    } else if (budgetPct > 80) {
      healthScore -= 10;
    }
  }

  if (income > 0) {
    const savingsPct = ((income - totalSpent) / income) * 100;
    if (savingsPct < 10) healthScore -= 15;
    else if (savingsPct >= 30) healthScore += 5;
  }

  if (monthExpenses.length > 5) healthScore += 5;
  const clampedScore = Math.max(15, Math.min(99, Math.round(healthScore)));

  // Last 7 days radar data
  const last7DaysData = useMemo(() => {
    const daysToShow = Math.min(7, currentDay);
    const startDay = Math.max(1, currentDay - daysToShow + 1);
    const days = [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let d = startDay; d <= currentDay; d++) {
      const dateObj = new Date(selectedYear, selectedMonth - 1, d);
      const spent = spendPerDayMap[d] || 0;
      days.push({
        dayNumber: d,
        dayName: dayNames[dateObj.getDay()],
        spent,
        isZeroSpend: spent === 0,
        isHighSpend: avgDailyBurn > 0 && spent > avgDailyBurn * 1.5,
      });
    }
    return days;
  }, [currentDay, selectedMonth, selectedYear, spendPerDayMap, avgDailyBurn]);

  // Milestone Badges
  const badges = [
    {
      id: 'streak',
      title: `${currentLoggingStreak > 0 ? `${currentLoggingStreak}-Day` : 'Log'} Streak`,
      desc: currentLoggingStreak > 2 ? 'Flawless daily record' : 'Keep logging daily',
      icon: Flame,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      earned: currentLoggingStreak >= 1,
    },
    {
      id: 'disciplined',
      title: `${noSpendDays} Zero-Spend Days`,
      desc: `${Math.round((noSpendDays / Math.max(1, currentDay)) * 100)}% of month zero-spend`,
      icon: Award,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      earned: noSpendDays >= 2,
    },
    {
      id: 'shield',
      title: clampedScore >= 80 ? 'Budget Fortified' : 'Active Watch',
      desc: `${clampedScore}/100 Health Index`,
      icon: ShieldCheck,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
      earned: clampedScore >= 70,
    },
  ];

  // Spent bar percentage
  const budgetBarSpendPct = monthlyBudget > 0 ? Math.min(100, Math.round((totalSpent / monthlyBudget) * 100)) : 0;
  const budgetBarProjectedPct = monthlyBudget > 0
    ? Math.min(100 - budgetBarSpendPct, Math.max(0, Math.round(((projectedMonthEndSpend - totalSpent) / monthlyBudget) * 100)))
    : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 text-white border border-slate-800/90 shadow-2xl p-5 sm:p-6 transition-all">
      {/* Dynamic ambient backdrop glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="relative space-y-5">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/25 shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Live Financial Vitality & Insights
                </h3>
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span>Live</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Actionable health metrics, habit tracking & spending velocity
              </p>
            </div>
          </div>

          {/* Interactive Navigation Pills */}
          <div className="flex items-center p-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-semibold self-start sm:self-auto shadow-inner">
            <button
              onClick={() => setActiveTab('vitality')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'vitality'
                  ? 'bg-emerald-600 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Vitality & Forecast</span>
            </button>
            <button
              onClick={() => setActiveTab('radar')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'radar'
                  ? 'bg-emerald-600 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Streaks & Radar</span>
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'simulator'
                  ? 'bg-emerald-600 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Runway Simulator</span>
            </button>
          </div>
        </div>

        {/* ================= VIEW 1: VITALITY & FORECAST ================= */}
        {activeTab === 'vitality' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Vitality Gauge Card */}
              <div className="md:col-span-5 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-4">
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800 stroke-current"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`${
                        clampedScore >= 80
                          ? 'text-emerald-400'
                          : clampedScore >= 60
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      } stroke-current transition-all duration-1000 ease-out`}
                      strokeWidth="3.5"
                      strokeDasharray={`${clampedScore}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-white">{clampedScore}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                      /100
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Health Index
                  </div>
                  <div className="text-sm font-black text-white">
                    {clampedScore >= 85
                      ? 'Fortified Wealth Rhythm'
                      : clampedScore >= 70
                      ? 'Stable Financial Health'
                      : 'Pacing Alert'}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {clampedScore >= 80
                      ? 'Spending trajectory is safely below thresholds with strong surplus.'
                      : 'Outflow is close to pace limit. Restrict discretionary spends.'}
                  </p>
                </div>
              </div>

              {/* Micro Metrics Cluster */}
              <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    <span>Zero-Spend Days</span>
                  </div>
                  <div className="text-lg font-black text-white">{noSpendDays} Days</div>
                  <div className="text-[10px] text-emerald-400/90 font-medium">
                    {currentDay > 0 ? `${Math.round((noSpendDays / currentDay) * 100)}% spend-free` : 'Start tracking'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-teal-400" />
                    <span>Daily Burn</span>
                  </div>
                  <div className="text-lg font-black text-white">{formatINR(avgDailyBurn)}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Over {currentDay} active days</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1 col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>Active Streak</span>
                  </div>
                  <div className="text-lg font-black text-white">{currentLoggingStreak} Days</div>
                  <div className="text-[10px] text-amber-400/90 font-medium">
                    {currentLoggingStreak >= 3 ? 'Consistency on fire 🔥' : 'Log daily entries'}
                  </div>
                </div>
              </div>
            </div>

            {/* Month-End Spend & Surplus Projection Bar */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">Month-End Outflow Projection</span>
                  <span className="text-[11px] text-slate-400">
                    ({daysRemaining} days remaining in month)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">
                    Projected: <span className="font-bold text-white">{formatINR(projectedMonthEndSpend)}</span>
                  </span>
                  {income > 0 && (
                    <span className="text-emerald-400 font-bold">
                      Surplus: {formatINR(projectedMonthEndSavings)}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Dual-Tone Bar */}
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden flex">
                {/* Spent so far */}
                <div
                  className="bg-emerald-500 h-full transition-all duration-700"
                  style={{ width: `${budgetBarSpendPct}%` }}
                  title={`Spent to date: ${formatINR(totalSpent)} (${budgetBarSpendPct}%)`}
                />
                {/* Projected for remaining days */}
                <div
                  className="bg-emerald-400/35 border-l border-emerald-300/40 h-full transition-all duration-700 repeating-linear-gradient"
                  style={{ width: `${budgetBarProjectedPct}%` }}
                  title={`Projected remaining spend: ${formatINR(projectedMonthEndSpend - totalSpent)}`}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>Spent: {formatINR(totalSpent)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400/40 inline-block" />
                  <span>Projected pace: +{formatINR(projectedMonthEndSpend - totalSpent)}</span>
                </span>
                {monthlyBudget > 0 && (
                  <span>Budget Limit: {formatINR(monthlyBudget)}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 2: STREAKS & 7-DAY RADAR ================= */}
        {activeTab === 'radar' && (
          <div className="space-y-4">
            {/* 7-Day Micro Heatmap Dots Row */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Past 7-Day Spending Radar</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Green = Zero Spend Day (Disciplined)
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {last7DaysData.map((item) => (
                  <div
                    key={item.dayNumber}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                      item.isZeroSpend
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : item.isHighSpend
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-white/[0.03] border-white/10 text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      {item.dayName}
                    </span>
                    <span className="text-xs font-black my-1 text-white">
                      {item.dayNumber}
                    </span>
                    <span className="text-[10px] font-bold">
                      {item.isZeroSpend ? '₹0' : formatINR(item.spent)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievement Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {badges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      badge.earned
                        ? 'bg-white/[0.03] border-white/15 shadow-sm'
                        : 'bg-white/[0.01] border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${badge.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {badge.earned && (
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Unlocked</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <div className="text-xs font-bold text-white">{badge.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {badge.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= VIEW 3: RUNWAY & WHAT-IF SIMULATOR ================= */}
        {activeTab === 'simulator' && (
          <div className="space-y-4">
            {/* Top 3 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Cash Surplus in Hand
                </div>
                <div className="text-xl font-black text-emerald-400">
                  {formatINR(remainingCashInHand)}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Net liquid savings remaining from this month&apos;s income.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Actual Daily Burn
                </div>
                <div className="text-xl font-black text-amber-400">
                  {formatINR(avgDailyBurn)} <span className="text-xs font-semibold text-slate-400">/ day</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Based on {monthExpenses.length} logged transactions this month.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Runway at Current Pace
                </div>
                <div className="text-xl font-black text-teal-300">
                  {runwayDaysLeft > 60 ? '60+ Days' : `${runwayDaysLeft} Days`}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Estimated buffer before liquid savings are depleted.
                </p>
              </div>
            </div>

            {/* Interactive "What-If" Spending Simulator */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-emerald-500/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      Interactive Daily Burn Simulator
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Drag to simulate: what happens if you adjust daily spend for remaining {daysRemaining} days?
                    </div>
                  </div>
                </div>

                {simulatedDailyBurn !== null && (
                  <button
                    onClick={() => setSimulatedDailyBurn(null)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 self-start sm:self-auto transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Actual</span>
                  </button>
                )}
              </div>

              {/* Slider Control */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Simulated Daily Outflow:</span>
                  <span className="text-base font-black text-emerald-400">
                    {formatINR(effectiveSimulatedBurn)} <span className="text-xs font-normal text-slate-400">/ day</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(5000, avgDailyBurn * 3, Math.round((monthlyBudget || 30000) / 10))}
                  step="50"
                  value={effectiveSimulatedBurn}
                  onChange={(e) => setSimulatedDailyBurn(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>₹0 / day</span>
                  <span>Actual: {formatINR(avgDailyBurn)}</span>
                  <span>{formatINR(Math.max(5000, avgDailyBurn * 3, Math.round((monthlyBudget || 30000) / 10)))} / day</span>
                </div>
              </div>

              {/* Simulation Result Callout */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Simulated Month-End Spend
                  </div>
                  <div className="text-sm font-black text-white mt-0.5">
                    {formatINR(simulatedTotalSpend)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Projected Savings
                  </div>
                  <div className="text-sm font-black text-emerald-400 mt-0.5">
                    {formatINR(simulatedSavings)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Savings Impact
                  </div>
                  <div className="text-sm font-black mt-0.5 flex items-center gap-1">
                    {simulatedVariance > 0 ? (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <TrendingUp className="w-3.5 h-3.5" /> +{formatINR(simulatedVariance)} saved
                      </span>
                    ) : simulatedVariance < 0 ? (
                      <span className="text-rose-400 flex items-center gap-0.5">
                        <TrendingDown className="w-3.5 h-3.5" /> -{formatINR(Math.abs(simulatedVariance))} surplus
                      </span>
                    ) : (
                      <span className="text-slate-400">Neutral (Same pace)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
