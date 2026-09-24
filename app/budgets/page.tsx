'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PieChart as PieChartIcon,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Check,
  AlertCircle,
  Edit2,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Category, Expense, MonthlySetting } from '@/types';
import {
  getCategories,
  getExpenses,
  getMonthlySetting,
  saveCategory,
  saveMonthlySetting,
  DATA_CHANGE_EVENT,
} from '@/lib/data/store';
import { formatINR, formatPercentage, MONTH_NAMES } from '@/lib/formatting/formatters';
import { showToast } from '@/components/ui/Toast';
import { BudgetProgressBar } from '@/components/dashboard/BudgetProgressBar';

export default function BudgetsPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlySetting, setMonthlySetting] = useState<MonthlySetting>({
    id: `ms-${selectedMonth}-${selectedYear}`,
    month: selectedMonth,
    year: selectedYear,
    income: 0,
    monthly_budget: 0,
    savings_target: 0,
  });

  // Filter tab for categories
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'needs' | 'wants' | 'over'>('all');

  // Editing state for overall monthly budget
  const [editingOverall, setEditingOverall] = useState(false);
  const [incomeInput, setIncomeInput] = useState('0');
  const [budgetInput, setBudgetInput] = useState('0');
  const [savingsTargetInput, setSavingsTargetInput] = useState('0');

  // Editing state for individual category budget
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catBudgetInput, setCatBudgetInput] = useState('');

  const loadData = useCallback(async () => {
    const [cats, exp, setting] = await Promise.all([
      getCategories(),
      getExpenses(),
      getMonthlySetting(selectedMonth, selectedYear),
    ]);
    setCategories(cats);
    setExpenses(exp);
    setMonthlySetting(setting);
    setIncomeInput(String(setting.income));
    setBudgetInput(String(setting.monthly_budget));
    setSavingsTargetInput(String(setting.savings_target));
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
    window.addEventListener(DATA_CHANGE_EVENT, loadData);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, loadData);
  }, [loadData]);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  // Filter selected month expenses (excluding income entries)
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!e.expense_date || e.type === 'income') return false;
      const parts = e.expense_date.split('-');
      return parseInt(parts[0], 10) === selectedYear && parseInt(parts[1], 10) === selectedMonth;
    });
  }, [expenses, selectedMonth, selectedYear]);

  const totalSpent = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [monthExpenses]);

  // Category spending aggregation
  const catSpending: Record<string, number> = useMemo(() => {
    const spending: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      const cid = e.category_id || 'other';
      spending[cid] = (spending[cid] || 0) + Number(e.amount);
    });
    return spending;
  }, [monthExpenses]);

  // Needs vs Wants actual spend
  const { needsActual, wantsActual } = useMemo(() => {
    let needs = 0;
    let wants = 0;
    const catMap = new Map(categories.map((c) => [c.id, c]));
    monthExpenses.forEach((e) => {
      const cat = catMap.get(e.category_id || '');
      if (cat?.group === 'needs') needs += Number(e.amount);
      else wants += Number(e.amount);
    });
    return { needsActual: needs, wantsActual: wants };
  }, [monthExpenses, categories]);

  // 50/30/20 Targets from Monthly Income
  const idealNeeds = monthlySetting.income * 0.5;
  const idealWants = monthlySetting.income * 0.3;
  const idealSavings = monthlySetting.income * 0.2;

  // Apply 50/30/20 Auto Allocation across categories
  const handleApply503020Rule = async () => {
    if (monthlySetting.income <= 0) {
      showToast('Please set your monthly income first to compute 50/30/20 targets', 'error');
      setEditingOverall(true);
      return;
    }

    const needsBudget = Math.round(monthlySetting.income * 0.5);
    const wantsBudget = Math.round(monthlySetting.income * 0.3);
    const savingsTarget = Math.round(monthlySetting.income * 0.2);

    const expenseCategories = categories.filter((c) => c.type !== 'income');
    const needsCats = expenseCategories.filter((c) => c.group === 'needs');
    const wantsCats = expenseCategories.filter((c) => c.group !== 'needs');

    const perNeed = needsCats.length > 0 ? Math.round(needsBudget / needsCats.length) : 0;
    const perWant = wantsCats.length > 0 ? Math.round(wantsBudget / wantsCats.length) : 0;

    // Update individual categories
    await Promise.all(
      expenseCategories.map((cat) => {
        const allocated = cat.group === 'needs' ? perNeed : perWant;
        return saveCategory({
          ...cat,
          budget_amount: allocated,
        });
      })
    );

    // Save overall budget settings (Needs + Wants = 80% budget limit)
    await saveMonthlySetting({
      ...monthlySetting,
      monthly_budget: needsBudget + wantsBudget,
      savings_target: savingsTarget,
    });

    loadData();
    showToast('Applied 50/30/20 budget allocations across categories! ✓', 'success');
  };

  // Save overall monthly budget
  const handleSaveOverall = async () => {
    const inc = parseFloat(incomeInput) || 0;
    const bud = parseFloat(budgetInput) || 0;
    const sav = parseFloat(savingsTargetInput) || 0;

    const updated = await saveMonthlySetting({
      ...monthlySetting,
      income: inc,
      monthly_budget: bud,
      savings_target: sav,
    });
    setMonthlySetting(updated);
    setEditingOverall(false);
    showToast('Monthly financial plan updated ✓', 'success');
  };

  // Save single category budget
  const handleSaveCatBudget = async (category: Category) => {
    const newAmount = parseFloat(catBudgetInput) || 0;
    await saveCategory({
      ...category,
      budget_amount: newAmount,
    });
    setEditingCatId(null);
    showToast(`${category.name} budget updated to ${formatINR(newAmount)} ✓`, 'success');
  };

  // Filtered categories for display (only expense categories)
  const displayedCategories = useMemo(() => {
    const expenseOnly = categories.filter((c) => c.type !== 'income');
    if (categoryFilter === 'needs') return expenseOnly.filter((c) => c.group === 'needs');
    if (categoryFilter === 'wants') return expenseOnly.filter((c) => c.group !== 'needs');
    if (categoryFilter === 'over') {
      return expenseOnly.filter((c) => {
        const spent = catSpending[c.id] || 0;
        return c.budget_amount > 0 && spent > c.budget_amount;
      });
    }
    return expenseOnly;
  }, [categories, categoryFilter, catSpending]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-5 md:py-8 space-y-8">
      {/* Top Header & Month Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Budgets & Limits
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              50/30/20 Engine
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Plan category spending caps and track budget utilization in real-time.
          </p>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-sky-100 dark:border-slate-800 p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setEditingOverall(!editingOverall)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{editingOverall ? 'Close' : 'Plan Settings'}</span>
          </button>
        </div>
      </div>

      {/* 50/30/20 Smart Rule Overview Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-lg">
              🎯
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight">
                Harvard 50/30/20 Wealth Blueprint
              </h2>
              <p className="text-xs text-indigo-200/80 font-medium">
                Recommended allocation based on {formatINR(monthlySetting.income)} monthly income.
              </p>
            </div>
          </div>

          <button
            onClick={handleApply503020Rule}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-950 hover:bg-indigo-50 active:scale-95 transition-all shadow-md shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Auto-Allocate 50/30/20</span>
          </button>
        </div>

        {/* 3 Pillars Visual Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Needs */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-indigo-200 font-semibold">
              <span>Needs (50%)</span>
              <span>Target: {formatINR(idealNeeds)}</span>
            </div>
            <div className="text-base font-black text-white">
              {formatINR(needsActual)} <span className="text-xs text-indigo-300 font-normal">spent</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-400 rounded-full"
                style={{
                  width: `${idealNeeds > 0 ? Math.min(100, (needsActual / idealNeeds) * 100) : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Wants */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-pink-200 font-semibold">
              <span>Wants (30%)</span>
              <span>Target: {formatINR(idealWants)}</span>
            </div>
            <div className="text-base font-black text-white">
              {formatINR(wantsActual)} <span className="text-xs text-pink-300 font-normal">spent</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-400 rounded-full"
                style={{
                  width: `${idealWants > 0 ? Math.min(100, (wantsActual / idealWants) * 100) : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Savings */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-emerald-200 font-semibold">
              <span>Savings (20%)</span>
              <span>Target: {formatINR(idealSavings)}</span>
            </div>
            <div className="text-base font-black text-emerald-400">
              {formatINR(Math.max(0, monthlySetting.income - totalSpent))}{' '}
              <span className="text-xs text-emerald-300/80 font-normal">surplus</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full"
                style={{
                  width: `${
                    idealSavings > 0
                      ? Math.min(100, (Math.max(0, monthlySetting.income - totalSpent) / idealSavings) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Overall Monthly Budget Card / Config Drawer */}
      {editingOverall ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-sky-300 dark:border-sky-500/40 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
            Configure {MONTH_NAMES[selectedMonth - 1]} {selectedYear} Financial Plan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 mb-1">
                Monthly Salary / Income
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 mb-1">
                Maximum Spending Budget
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 mb-1">
                Target Savings Goal
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  value={savingsTargetInput}
                  onChange={(e) => setSavingsTargetInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setEditingOverall(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveOverall}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20"
            >
              Save Financial Settings
            </button>
          </div>
        </div>
      ) : (
        <BudgetProgressBar spent={totalSpent} budget={monthlySetting.monthly_budget} />
      )}

      {/* Category-by-Category Budgets Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Category Budgets & Thresholds
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Click &quot;Edit Limit&quot; on any category to set its monthly spending cap.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'needs', label: 'Needs (50%)' },
              { id: 'wants', label: 'Wants (30%)' },
              { id: 'over', label: '⚠️ Over Budget' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  categoryFilter === tab.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {displayedCategories.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No categories match the active filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedCategories.map((cat) => {
              const spent = catSpending[cat.id] || 0;
              const budget = cat.budget_amount || 0;
              const pct = budget > 0 ? (spent / budget) * 100 : 0;
              const isOver = budget > 0 && spent > budget;
              const isNear = budget > 0 && pct >= 80 && pct <= 100;
              const isEditingThis = editingCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border shadow-sm space-y-3 transition-all ${
                    isOver
                      ? 'border-rose-300 dark:border-rose-900/60 shadow-rose-500/5'
                      : isNear
                      ? 'border-amber-300 dark:border-amber-900/60'
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  {/* Top Row: Category Info & Amount */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{cat.name}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              cat.group === 'needs'
                                ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                                : 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300'
                            }`}
                          >
                            {cat.group || 'wants'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          Spent: <span className="font-bold text-slate-900 dark:text-white">{formatINR(spent)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Budget Limit & Edit Trigger */}
                    <div className="text-right">
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            autoFocus
                            value={catBudgetInput}
                            onChange={(e) => setCatBudgetInput(e.target.value)}
                            className="w-24 px-2 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-sky-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                          />
                          <button
                            onClick={() => handleSaveCatBudget(cat)}
                            className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingCatId(cat.id);
                            setCatBudgetInput(String(budget));
                          }}
                          className="group flex flex-col items-end text-right text-xs hover:text-sky-600 transition-colors"
                          title="Click to edit budget"
                        >
                          <div className="font-black text-slate-900 dark:text-white">
                            {budget > 0 ? formatINR(budget) : 'No limit'}
                          </div>
                          <div className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold group-hover:underline">
                            Edit limit
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar & Status */}
                  {budget > 0 ? (
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-medium">
                        <span
                          className={
                            isOver
                              ? 'text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1'
                              : isNear
                              ? 'text-amber-600 dark:text-amber-400 font-semibold'
                              : 'text-slate-600 dark:text-slate-400'
                          }
                        >
                          {isOver && <AlertCircle className="w-3 h-3 inline" />}
                          {formatPercentage(pct)} utilized
                        </span>

                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          {isOver
                            ? `Over by ${formatINR(spent - budget)}`
                            : `${formatINR(budget - spent)} remaining`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 dark:text-slate-500 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      <span>No spending cap set. Click &quot;Edit limit&quot; to protect your wallet.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
