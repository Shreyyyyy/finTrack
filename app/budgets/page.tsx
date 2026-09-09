'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Plus, Check, AlertCircle, Edit2, ShieldAlert } from 'lucide-react';
import { Category, Expense, MonthlySetting } from '@/types';
import {
  getCategories,
  getExpenses,
  getMonthlySetting,
  saveCategory,
  saveMonthlySetting,
  DATA_CHANGE_EVENT,
} from '@/lib/data/store';
import { formatINR, formatPercentage } from '@/lib/formatting/formatters';
import { showToast } from '@/components/ui/Toast';
import { BudgetProgressBar } from '@/components/dashboard/BudgetProgressBar';

export default function BudgetsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlySetting, setMonthlySetting] = useState<MonthlySetting>({
    id: 'ms-9-2026',
    month: 9,
    year: 2026,
    income: 80000,
    monthly_budget: 50000,
    savings_target: 30000,
  });

  // Editing state for overall monthly budget
  const [editingOverall, setEditingOverall] = useState(false);
  const [incomeInput, setIncomeInput] = useState('80000');
  const [budgetInput, setBudgetInput] = useState('50000');
  const [savingsTargetInput, setSavingsTargetInput] = useState('30000');

  // Editing state for individual category budget
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catBudgetInput, setCatBudgetInput] = useState('');

  const loadData = async () => {
    const [cats, exp, setting] = await Promise.all([
      getCategories(),
      getExpenses(),
      getMonthlySetting(9, 2026),
    ]);
    setCategories(cats);
    setExpenses(exp);
    setMonthlySetting(setting);
    setIncomeInput(String(setting.income));
    setBudgetInput(String(setting.monthly_budget));
    setSavingsTargetInput(String(setting.savings_target));
  };

  useEffect(() => {
    loadData();
    window.addEventListener(DATA_CHANGE_EVENT, loadData);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, loadData);
  }, []);

  // Filter current month expenses
  const monthExpenses = expenses.filter((e) => {
    if (!e.expense_date) return false;
    const parts = e.expense_date.split('-');
    return parseInt(parts[0], 10) === 2026 && parseInt(parts[1], 10) === 9;
  });

  const totalSpent = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Category spending aggregation
  const catSpending: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    const cid = e.category_id || 'other';
    catSpending[cid] = (catSpending[cid] || 0) + Number(e.amount);
  });

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
    showToast('Monthly budget updated ✓', 'success');
  };

  // Save single category budget
  const handleSaveCatBudget = async (category: Category) => {
    const newAmount = parseFloat(catBudgetInput) || 0;
    await saveCategory({
      ...category,
      budget_amount: newAmount,
    });
    setEditingCatId(null);
    showToast(`${category.name} budget updated ✓`, 'success');
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-5 md:py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Budgets & Limits
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            September 2026 · Planned financial limits and category caps.
          </p>
        </div>

        <button
          onClick={() => setEditingOverall(!editingOverall)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>{editingOverall ? 'Cancel' : 'Edit Monthly Limit'}</span>
        </button>
      </div>

      {/* Overall Monthly Budget Card */}
      {editingOverall ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-emerald-500/40 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Configure September 2026 Financial Plan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Salary / Income
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Maximum Spending Budget
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Savings Goal
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={savingsTargetInput}
                  onChange={(e) => setSavingsTargetInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setEditingOverall(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveOverall}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
            >
              Save Financial Settings
            </button>
          </div>
        </div>
      ) : (
        <BudgetProgressBar spent={totalSpent} budget={monthlySetting.monthly_budget} />
      )}

      {/* Category-by-Category Budgets (Section 14) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Category Budgets
            </h2>
            <p className="text-xs text-slate-500">
              Individual category limits with utilization warnings.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const spent = catSpending[cat.id] || 0;
            const budget = cat.budget_amount || 0;
            const pct = budget > 0 ? (spent / budget) * 100 : 0;
            const isOver = pct > 100;
            const isNear = pct >= 85 && pct <= 100;

            const isEditingThis = editingCatId === cat.id;

            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                {/* Top Row: Category Info & Amount */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {cat.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Spent: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatINR(spent)}</span>
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
                          className="w-20 px-2 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                        />
                        <button
                          onClick={() => handleSaveCatBudget(cat)}
                          className="p-1 rounded-lg bg-emerald-600 text-white"
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
                        className="group flex items-center gap-1 text-right text-xs hover:text-emerald-600 transition-colors"
                        title="Click to edit budget"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {budget > 0 ? formatINR(budget) : 'No limit'}
                          </div>
                          <div className="text-[10px] text-slate-400 group-hover:underline">
                            Edit limit
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {budget > 0 && (
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver
                            ? 'bg-rose-500'
                            : isNear
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
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
                            : 'text-slate-500 dark:text-slate-400'
                        }
                      >
                        {isOver && <AlertCircle className="w-3 h-3 inline" />}
                        {formatPercentage(pct)} used
                      </span>

                      <span className="text-slate-400">
                        {isOver
                          ? `Exceeded by ${formatINR(spent - budget)}`
                          : `${formatINR(budget - spent)} remaining`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
