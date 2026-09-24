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
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  Sparkles,
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
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [monthlySetting, setMonthlySetting] = useState<MonthlySetting>({
    id: `ms-${currentMonth}-${currentYear}`,
    month: currentMonth,
    year: currentYear,
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
        getMonthlySetting(currentMonth, currentYear),
      ]);
      setExpenses(exp);
      setCategories(cat);
      setPaymentMethods(pm);
      setMonthlySetting(setting);
    }
    load();
  }, [currentMonth, currentYear]);

  // Filter items according to period
  const filteredItems = useMemo(() => {
    const todayStr = now.toISOString().split('T')[0];

    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

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
        return parseInt(parts[0], 10) === currentYear && parseInt(parts[1], 10) === currentMonth;
      }

      if (selectedPeriod === 'Last Month') {
        const parts = e.expense_date.split('-');
        return parseInt(parts[0], 10) === prevYear && parseInt(parts[1], 10) === prevMonth;
      }

      if (selectedPeriod === 'This Year') {
        const parts = e.expense_date.split('-');
        return parseInt(parts[0], 10) === currentYear;
      }

      if (selectedPeriod === 'Custom Range') {
        if (customStart && e.expense_date < customStart) return false;
        if (customEnd && e.expense_date > customEnd) return false;
        return true;
      }

      return true;
    });
  }, [expenses, selectedPeriod, customStart, customEnd, currentMonth, currentYear, now]);

  // Separate Expenses and Incomes
  const periodExpenses = useMemo(() => filteredItems.filter((e) => e.type !== 'income'), [filteredItems]);
  const periodIncomes = useMemo(() => filteredItems.filter((e) => e.type === 'income'), [filteredItems]);

  // Cashflow Metrics
  const totalOutflow = useMemo(
    () => periodExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [periodExpenses]
  );

  const totalInflow = useMemo(() => {
    const recordedIncome = periodIncomes.reduce((sum, e) => sum + Number(e.amount), 0);
    // If user hasn't explicitly logged income transactions this month but has monthlySetting.income, reflect that
    if (recordedIncome === 0 && selectedPeriod === 'This Month') {
      return monthlySetting.income;
    }
    return recordedIncome;
  }, [periodIncomes, selectedPeriod, monthlySetting.income]);

  const netCashflow = totalInflow - totalOutflow;
  const savingsRate = totalInflow > 0 ? (netCashflow / totalInflow) * 100 : 0;
  const txCount = filteredItems.length;

  // Category Distribution for Donut Chart (Expenses only)
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    periodExpenses.forEach((e) => {
      const catId = e.category_id || 'other';
      map[catId] = (map[catId] || 0) + Number(e.amount);
    });

    return categories
      .filter((c) => c.type !== 'income')
      .map((cat) => ({
        name: cat.name,
        icon: cat.icon,
        color: cat.color || '#10b981',
        value: map[cat.id] || 0,
      }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [periodExpenses, categories]);

  // Payment Method Distribution for Bar Chart
  const paymentData = useMemo(() => {
    const map: Record<string, number> = {};
    periodExpenses.forEach((e) => {
      const pmId = e.payment_method_id || 'other';
      map[pmId] = (map[pmId] || 0) + Number(e.amount);
    });

    return paymentMethods
      .map((pm) => ({
        name: pm.name,
        amount: map[pm.id] || 0,
      }))
      .filter((p) => p.amount > 0);
  }, [periodExpenses, paymentMethods]);

  // 50/30/20 Needs vs Wants breakdown for Period
  const { needsTotal, wantsTotal, recurringTotal } = useMemo(() => {
    let needs = 0;
    let wants = 0;
    let recurring = 0;
    const catMap = new Map(categories.map((c) => [c.id, c]));

    periodExpenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      const cat = catMap.get(e.category_id || '');
      if (cat?.group === 'needs') needs += amt;
      else wants += amt;

      if (e.is_recurring || cat?.name.toLowerCase().includes('subscription')) {
        recurring += amt;
      }
    });

    return { needsTotal: needs, wantsTotal: wants, recurringTotal: recurring };
  }, [periodExpenses, categories]);

  // Deterministic Mathematical Forecasting (Current Month)
  const forecasting = useMemo(() => {
    const { daysElapsed, totalDays } = getMonthDaysInfo(currentMonth, currentYear);
    const currentMonthExpenses = expenses.filter((e) => {
      if (!e.expense_date || e.type === 'income') return false;
      const parts = e.expense_date.split('-');
      return parseInt(parts[0], 10) === currentYear && parseInt(parts[1], 10) === currentMonth;
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
  }, [expenses, monthlySetting, currentMonth, currentYear]);

  // Month-over-Month Comparison
  const monthlyComparison = useMemo(() => {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const prevMonthExpenses = expenses.filter((e) => {
      if (!e.expense_date || e.type === 'income') return false;
      const parts = e.expense_date.split('-');
      return parseInt(parts[0], 10) === prevYear && parseInt(parts[1], 10) === prevMonth;
    });
    const currMonthExpenses = expenses.filter((e) => {
      if (!e.expense_date || e.type === 'income') return false;
      const parts = e.expense_date.split('-');
      return parseInt(parts[0], 10) === currentYear && parseInt(parts[1], 10) === currentMonth;
    });

    const prevTotal = prevMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const currTotal = currMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const overallDelta = calculateDelta(currTotal, prevTotal);

    return {
      prevMonthName: MONTH_NAMES[prevMonth - 1],
      currMonthName: MONTH_NAMES[currentMonth - 1],
      prevTotal,
      currTotal,
      overallDelta,
    };
  }, [expenses, currentMonth, currentYear]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-5 md:py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Financial Analytics
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Deterministic (Zero AI)
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Cashflow inflows vs outflows, 50/30/20 proportions, and mathematical burn rate.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {PERIODS.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPeriod === period
                  ? 'bg-sky-600 text-white shadow-sm'
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
            <label className="block text-[10px] uppercase font-bold text-slate-700 dark:text-slate-400 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-700 dark:text-slate-400 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            />
          </div>
        </div>
      )}

      {/* Top Stat Cards: Cashflow & Financial Pulse */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Inflows (Income)"
          value={formatINR(totalInflow)}
          subtext={`${selectedPeriod} Inflow`}
          icon={<ArrowUpRight className="w-4 h-4 text-emerald-500" />}
          variant="emerald"
        />
        <StatCard
          label="Total Outflows (Spend)"
          value={formatINR(totalOutflow)}
          subtext={`${selectedPeriod} Spending`}
          icon={<ArrowDownLeft className="w-4 h-4 text-rose-500" />}
        />
        <StatCard
          label="Net Cashflow"
          value={formatINR(netCashflow)}
          subtext={`Savings Rate: ${formatPercentage(savingsRate)}`}
          icon={<Target className="w-4 h-4 text-sky-500" />}
          variant={netCashflow >= 0 ? 'emerald' : 'rose'}
        />
        <StatCard
          label="Recurring Fixed Burn"
          value={formatINR(recurringTotal)}
          subtext="Subscriptions & commitments"
          icon={<Repeat className="w-4 h-4 text-amber-500" />}
        />
      </div>

      {/* 50/30/20 & Burn Rate Split */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Needs Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-400">
            <span>Essential Needs</span>
            <span className="text-sky-600 dark:text-sky-400">Target ~50%</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatINR(needsTotal)}
          </div>
          <p className="text-[11px] text-slate-500">
            {totalOutflow > 0 ? ((needsTotal / totalOutflow) * 100).toFixed(1) : 0}% of your total spending.
          </p>
        </div>

        {/* Wants Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-400">
            <span>Lifestyle Wants</span>
            <span className="text-pink-600 dark:text-pink-400">Target ~30%</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatINR(wantsTotal)}
          </div>
          <p className="text-[11px] text-slate-500">
            {totalOutflow > 0 ? ((wantsTotal / totalOutflow) * 100).toFixed(1) : 0}% of your total spending.
          </p>
        </div>

        {/* Daily Burn Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-400">
            <span>Daily Burn Rate</span>
            <span className="text-emerald-600 dark:text-emerald-400">{forecasting.daysElapsed}d passed</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatINR(forecasting.avgDaily)}
            <span className="text-xs text-slate-500 font-normal"> / day</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Projected month-end spend: {formatINR(forecasting.projected)}
          </p>
        </div>
      </div>

      {/* Charts Section: Donut & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300">
              Spending by Category
            </h3>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
              {categoryData.length} Categories Active
            </span>
          </div>

          {categoryData.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">No expense activity in this period.</p>
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
                    formatter={(value) => (
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-300">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Payment Methods Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300">
              Spending by Payment Method
            </h3>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
              {paymentData.length} Methods
            </span>
          </div>

          {paymentData.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">No payment activity in this period.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
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
                  <Bar dataKey="amount" fill="#0284c7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Month-over-Month Comparison Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300">
            Month-over-Month Variance ({monthlyComparison.prevMonthName} vs {monthlyComparison.currMonthName})
          </h3>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              monthlyComparison.overallDelta.isIncrease
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}
          >
            {monthlyComparison.overallDelta.isIncrease ? '▲ +' : '▼ -'}
            {Math.abs(monthlyComparison.overallDelta.percentage).toFixed(1)}% vs last month
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-500 uppercase font-bold">{monthlyComparison.prevMonthName} Total</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {formatINR(monthlyComparison.prevTotal)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-500 uppercase font-bold">{monthlyComparison.currMonthName} Total</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {formatINR(monthlyComparison.currTotal)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Net Difference</span>
            <div
              className={`text-xl font-black mt-1 ${
                monthlyComparison.overallDelta.deltaAmount > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {monthlyComparison.overallDelta.deltaAmount > 0 ? '+' : ''}
              {formatINR(monthlyComparison.overallDelta.deltaAmount)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
