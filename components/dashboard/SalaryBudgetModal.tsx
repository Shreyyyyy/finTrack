'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Wallet, PiggyBank, Target, Sparkles, TrendingUp } from 'lucide-react';
import { MonthlySetting } from '@/types';
import { saveMonthlySetting } from '@/lib/data/store';
import { formatINR, MONTH_NAMES } from '@/lib/formatting/formatters';
import { showToast } from '@/components/ui/Toast';

interface SalaryBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlySetting: MonthlySetting;
  month: number;
  year: number;
  onSaved: (newSetting: MonthlySetting) => void;
}

const SALARY_PRESETS = [50000, 75000, 100000, 150000, 200000];

export function SalaryBudgetModal({
  isOpen,
  onClose,
  monthlySetting,
  month,
  year,
  onSaved,
}: SalaryBudgetModalProps) {
  const [income, setIncome] = useState<string>('');
  const [budget, setBudget] = useState<string>('');
  const [savingsTarget, setSavingsTarget] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (monthlySetting) {
      setIncome(monthlySetting.income > 0 ? String(monthlySetting.income) : '');
      setBudget(monthlySetting.monthly_budget > 0 ? String(monthlySetting.monthly_budget) : '');
      setSavingsTarget(monthlySetting.savings_target > 0 ? String(monthlySetting.savings_target) : '');
    }
  }, [monthlySetting, isOpen]);

  if (!isOpen) return null;

  const numIncome = parseFloat(income) || 0;
  const numBudget = parseFloat(budget) || 0;
  const numSavings = parseFloat(savingsTarget) || 0;
  const projectedSavings = Math.max(0, numIncome - numBudget);
  const savingsRate = numIncome > 0 ? (projectedSavings / numIncome) * 100 : 0;

  const handleApplyBudgetPct = (pct: number) => {
    const calculatedBudget = Math.round(numIncome * pct);
    setBudget(String(calculatedBudget));
    setSavingsTarget(String(Math.max(0, numIncome - calculatedBudget)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated: MonthlySetting = {
        ...monthlySetting,
        id: monthlySetting.id || `ms-${month}-${year}`,
        month,
        year,
        income: numIncome,
        monthly_budget: numBudget,
        savings_target: numSavings,
      };

      await saveMonthlySetting(updated);
      onSaved(updated);
      showToast(`${MONTH_NAMES[month - 1]} salary & targets updated ✓`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to save targets', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-sky-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base text-black dark:text-white">
                Customize Salary & Savings Targets
              </h2>
              <p className="text-[11px] text-slate-800 dark:text-slate-400 font-semibold">
                {MONTH_NAMES[month - 1]} {year} Plan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-black dark:hover:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {/* 1. Monthly Salary / Inflow */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-black dark:text-slate-300 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-sky-600" />
              <span>Monthly Salary / Inflow (₹)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-black text-slate-500">₹</span>
              <input
                type="number"
                min="0"
                step="any"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="76827"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-sky-50/50 dark:bg-slate-800 text-base font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SALARY_PRESETS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setIncome(String(val))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                    numIncome === val
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-sky-50 dark:bg-slate-800/80 border-sky-200 dark:border-slate-700 text-black dark:text-slate-300 hover:border-sky-400'
                  }`}
                >
                  {formatINR(val)}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Monthly Budget Limit */}
          <div className="space-y-2 pt-2 border-t border-sky-100 dark:border-slate-800">
            <label className="block text-xs font-black text-black dark:text-slate-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-500" />
              <span>Monthly Spending Limit (₹)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-black text-slate-500">₹</span>
              <input
                type="number"
                min="0"
                step="any"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="50000"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-sky-50/50 dark:bg-slate-800 text-base font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            {/* Rule of thumb buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-bold mr-1">Quick:</span>
              {[0.4, 0.5, 0.6, 0.7].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleApplyBudgetPct(pct)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100/70 dark:bg-slate-800 text-black dark:text-slate-300 hover:bg-sky-200/80 dark:hover:bg-slate-700"
                >
                  {Math.round(pct * 100)}% of Salary
                </button>
              ))}
            </div>
          </div>

          {/* 3. Monthly Savings Target */}
          <div className="space-y-2 pt-2 border-t border-sky-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-black dark:text-slate-300 flex items-center gap-1.5">
                <PiggyBank className="w-3.5 h-3.5 text-sky-600" />
                <span>Target Savings (₹)</span>
              </label>
              <button
                type="button"
                onClick={() => setSavingsTarget(String(projectedSavings))}
                className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
              >
                Set to Remaining ({formatINR(projectedSavings)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-black text-slate-500">₹</span>
              <input
                type="number"
                min="0"
                step="any"
                value={savingsTarget}
                onChange={(e) => setSavingsTarget(e.target.value)}
                placeholder="30000"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-sky-50/50 dark:bg-slate-800 text-base font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </div>

          {/* Real-time Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-sky-100/60 via-sky-50 to-white dark:from-emerald-500/10 dark:via-teal-500/5 border border-sky-200 dark:border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-sky-900 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Projected Monthly Outcome</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2 rounded-xl bg-white/90 dark:bg-slate-800/70 shadow-xs">
                <div className="text-[10px] text-slate-700 dark:text-slate-400 uppercase font-black">Salary</div>
                <div className="text-xs sm:text-sm font-black text-black dark:text-white">
                  {formatINR(numIncome)}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white/90 dark:bg-slate-800/70 shadow-xs">
                <div className="text-[10px] text-slate-700 dark:text-slate-400 uppercase font-black">Max Spend</div>
                <div className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                  {formatINR(numBudget)}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white/90 dark:bg-slate-800/70 shadow-xs">
                <div className="text-[10px] text-slate-700 dark:text-slate-400 uppercase font-black">Savings Rate</div>
                <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {savingsRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-sky-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 text-black dark:text-slate-300 text-xs font-bold hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-black shadow-md shadow-sky-600/20 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Targets'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
