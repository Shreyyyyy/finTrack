'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Target,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Expense, Category, PaymentMethod, MonthlySetting } from '@/types';
import { getExpenses, getCategories, getPaymentMethods, getMonthlySetting } from '@/lib/data/store';
import {
  formatINR,
  formatPercentage,
  MONTH_NAMES,
  getMonthDaysInfo,
} from '@/lib/formatting/formatters';
import { calculateDelta } from '@/lib/calculations/financial';
import { StatCard } from '@/components/dashboard/StatCard';

const PERIODS = ['Today', 'This Week', 'This Month', 'Last Month', 'This Year', 'Custom Range'] as const;
type Period = (typeof PERIODS)[number];

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [monthlySetting, setMonthlySetting] = useState<MonthlySetting>({
    id: 'ms-9-2026',
    month: 9,
    year: 2026,
    income: 0,
    monthly_budget: 0,
    savings_target: 0,
  });

  useEffect(() => {
    async function load() {
      const [exp, cat, pm, setting] = await Promise.all([
        getExpenses(),
        getCategories(),
        getPaymentMethods(),
        getMonthlySetting(9, 2026),
      ]);
      setExpenses(exp);
      setCategories(cat);
      setPaymentMethods(pm);
      setMonthlySetting(setting);
    }
    load();
  }, []);

  // Filter expenses according to period
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return expenses.filter((e) => {
      if (!e.expense_date) return false;

      if (selectedPeriod === 'Today') {
        return e.expense_date === todayStr;
      }

      if (selectedPeriod === 'This Week') {
        const expDate = new Date(e.expense_date + 'T00:00:00');
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        return expDate >= startOfWeek;
      }

      if (selectedPeriod === 'This Month') {
        const parts = e.expense_date.split('-');
        return parseInt(parts[0], 10) === 2026 && parseInt(parts[1], 10) === 9;
      }

      if (selectedPeriod === 'Last Month') {
        const parts = e.expense_date.split('-');
        return parseInt(parts[0], 10) === 2026 && parseInt(parts[1], 10) === 8;
      }

      if (selectedPeriod === 'This Year') {
        const parts = e.expense_date.split('-');
        return parseInt(parts[0], 10) === 2026;
      }

      if (selectedPeriod === 'Custom Range') {
        if (customStart && e.expense_date < customStart) return false;
        if (customEnd && e.expense_date > customEnd) return false;
        return true;
      }

      return true;
    });
  }, [expenses, selectedPeriod, customStart, customEnd]);

  // Aggregate Metrics
  const totalSpending = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [filteredExpenses]
  );

  const txCount = filteredExpenses.length;

  // Category Distribution for Donut Chart
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      const catId = e.category_id || 'other';
      map[catId] = (map[catId] || 0) + Number(e.amount);
    });

    return categories
      .map((cat) => ({
        name: cat.name,
        icon: cat.icon,
        color: cat.color || '#10b981',
        value: map[cat.id] || 0,
      }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses, categories]);

  // Payment Method Distribution for Bar Chart
  const paymentData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      const pmId = e.payment_method_id || 'other';
      map[pmId] = (map[pmId] || 0) + Number(e.amount);
    });

    return paymentMethods
      .map((pm) => ({
        name: pm.name,
        amount: map[pm.id] || 0,
      }))
      .filter((p) => p.amount > 0);
  }, [filteredExpenses, paymentMethods]);

  // Month-over-Month Comparison (August 2026 vs September 2026)
  const monthlyComparison = useMemo(() => {
    const augExpenses = expenses.filter((e) => {
      const parts = e.expense_date.split('-');
      return parseInt(parts[0], 10) === 2026 && parseInt(parts[1], 10) === 8;
    });
    const sepExpenses = expenses.filter((e) => {
      const parts = e.expense_date.split('-');
      return parseInt(parts[0], 10) === 2026 && parseInt(parts[1], 10) === 9;
    });

    const augTotal = augExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const sepTotal = sepExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const overallDelta = calculateDelta(sepTotal, augTotal);

    // Category breakdown comparison
    const catComp = categories.map((cat) => {
      const augCat = augExpenses
        .filter((e) => e.category_id === cat.id)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const sepCat = sepExpenses
        .filter((e) => e.category_id === cat.id)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const delta = calculateDelta(sepCat, augCat);
      return {
        category: cat,
        augAmount: augCat,
        sepAmount: sepCat,
        delta,
      };
    }).filter((c) => c.augAmount > 0 || c.sepAmount > 0);

    return {
      augTotal,
      sepTotal,
      overallDelta,
      categories: catComp,
    };
  }, [expenses, categories]);

  // Deterministic Mathematical Forecasting (Current Month)
  const forecasting = useMemo(() => {
    const { daysElapsed, totalDays } = getMonthDaysInfo(9, 2026);
    const currentMonthExpenses = expenses.filter((e) => {
      const parts = e.expense_date.split('-');
      return parseInt(parts[0], 10) === 2026 && parseInt(parts[1], 10) === 9;
    });
    const currentSpent = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const avgDaily = daysElapsed > 0 ? currentSpent / daysElapsed : 0;
    const projected = avgDaily * totalDays;
    const monthlyBudget = monthlySetting.monthly_budget;
    const projectedDiff = projected - monthlyBudget;

    return {
      currentSpent,
      daysElapsed,
      totalDays,
      avgDaily,
      projected,
      monthlyBudget,
      projectedDiff,
    };
  }, [expenses, monthlySetting]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-5 md:py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Spending Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deterministic insights & mathematical breakdowns (Zero AI).
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {PERIODS.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedPeriod === period
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Range Inputs */}
      {selectedPeriod === 'Custom Range' && (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Period Spend"
          value={formatINR(totalSpending)}
          subtext={`${selectedPeriod}`}
          icon={<TrendingDown className="w-4 h-4 text-emerald-500" />}
        />
        <StatCard
          label="Transactions"
          value={String(txCount)}
          subtext="Total recorded entries"
          icon={<CreditCard className="w-4 h-4 text-sky-500" />}
        />
        <StatCard
          label="Daily Average (Sep)"
          value={formatINR(forecasting.avgDaily)}
          subtext="Based on 9 days elapsed"
          icon={<BarChart3 className="w-4 h-4 text-amber-500" />}
        />
        <StatCard
          label="Projected Month End"
          value={formatINR(forecasting.projected)}
          subtext={
            forecasting.projectedDiff > 0
              ? `${formatINR(forecasting.projectedDiff)} over limit`
              : `${formatINR(Math.abs(forecasting.projectedDiff))} under limit`
          }
          icon={<Target className="w-4 h-4 text-teal-500" />}
          variant={forecasting.projectedDiff > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Charts Section: Donut & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Spending by Category
            </h3>
            <span className="text-xs text-slate-400">{categoryData.length} Categories</span>
          </div>

          {categoryData.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">No data for this period.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatINR(Number(value)), 'Spent']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Payment Methods Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Spending by Payment Method
            </h3>
            <span className="text-xs text-slate-400">{paymentData.length} Methods</span>
          </div>

          {paymentData.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">No data for this period.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(val) => `₹${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val) => [formatINR(Number(val)), 'Spent']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Month-over-Month Comparison Table (Section 18) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Month-over-Month Comparison
            </h3>
            <p className="text-xs text-slate-500">August 2026 vs September 2026 (Pure deterministic math)</p>
          </div>

          {/* Overall Change Badge */}
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-slate-500">Overall:</div>
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                monthlyComparison.overallDelta.isIncrease
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
              }`}
            >
              {monthlyComparison.overallDelta.isIncrease ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>
                {monthlyComparison.overallDelta.isIncrease ? '+' : ''}
                {formatPercentage(monthlyComparison.overallDelta.percentage)} ({formatINR(monthlyComparison.overallDelta.deltaAmount)})
              </span>
            </div>
          </div>
        </div>

        {/* Category Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {monthlyComparison.categories.map(({ category, augAmount, sepAmount, delta }) => (
            <div
              key={category.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{category.icon}</span>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{category.name}</div>
                  <div className="text-[11px] text-slate-400">
                    Aug: {formatINR(augAmount)} → Sep: {formatINR(sepAmount)}
                  </div>
                </div>
              </div>

              <div
                className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                  delta.isIncrease
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {delta.isIncrease ? '+' : ''}
                {formatPercentage(delta.percentage)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deterministic Mathematical Forecasting Card (Section 20) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Mathematical Month-End Projection (Zero AI)
          </h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Based strictly on your spending pace in September 2026:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Current Spend</div>
            <div className="text-lg font-black text-white mt-1">{formatINR(forecasting.currentSpent)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{forecasting.daysElapsed} days elapsed</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Daily Average</div>
            <div className="text-lg font-black text-amber-400 mt-1">{formatINR(forecasting.avgDaily)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">₹/day in Sep</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Projected Total</div>
            <div className="text-lg font-black text-emerald-400 mt-1">{formatINR(forecasting.projected)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">30-day projection</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Budget Limit</div>
            <div className="text-lg font-black text-white mt-1">{formatINR(forecasting.monthlyBudget)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Target cap</div>
          </div>
        </div>
      </div>
    </div>
  );
}
