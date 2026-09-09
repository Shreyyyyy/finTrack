'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Smartphone,
  Sliders,
} from 'lucide-react';
import { Expense, Category, PaymentMethod, MonthlySetting, Goal, Profile } from '@/types';
import {
  getExpenses,
  getCategories,
  getPaymentMethods,
  getMonthlySetting,
  getGoals,
  getProfiles,
  DATA_CHANGE_EVENT,
} from '@/lib/data/store';
import { calculateDashboardSummary } from '@/lib/calculations/financial';
import { MONTH_NAMES } from '@/lib/formatting/formatters';
import { CashFlowHeroCard } from '@/components/dashboard/CashFlowHeroCard';
import { BudgetHealthCard } from '@/components/dashboard/BudgetHealthCard';
import { CategorySpendingCard } from '@/components/dashboard/CategorySpendingCard';
import { GoalsPreviewCard } from '@/components/dashboard/GoalsPreviewCard';
import { DailySpendingChart } from '@/components/dashboard/DailySpendingChart';
import { RecentExpenses } from '@/components/dashboard/RecentExpenses';
import { SalaryBudgetModal } from '@/components/dashboard/SalaryBudgetModal';
import { QuickGoalModal } from '@/components/dashboard/QuickGoalModal';
import { PersonSelector } from '@/components/navigation/PersonSelector';
import { BackTapSetupModal } from '@/components/shortcuts/BackTapSetupModal';
import { exportToExcel } from '@/lib/excel/exporter';
import { showToast } from '@/components/ui/Toast';

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // September
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showBackTapModal, setShowBackTapModal] = useState<boolean>(false);
  const [showSalaryModal, setShowSalaryModal] = useState<boolean>(false);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [monthlySetting, setMonthlySetting] = useState<MonthlySetting>({
    id: 'ms-9-2026',
    month: 9,
    year: 2026,
    income: 54000,
    monthly_budget: 35000,
    savings_target: 19000,
  });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      const [expList, catList, pmList, setting, goalList, profList] = await Promise.all([
        getExpenses(selectedUserId),
        getCategories(),
        getPaymentMethods(),
        getMonthlySetting(selectedMonth, selectedYear),
        getGoals(),
        getProfiles(),
      ]);

      setExpenses(expList);
      setCategories(catList);
      setPaymentMethods(pmList);
      setMonthlySetting(setting);
      setGoals(goalList);
      setProfiles(profList);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedUserId]);

  useEffect(() => {
    loadData();
    const handleStoreChange = () => {
      loadData();
    };
    window.addEventListener(DATA_CHANGE_EVENT, handleStoreChange);
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, handleStoreChange);
    };
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

  // Calculations
  const summary = calculateDashboardSummary(expenses, monthlySetting, categories);
  const daysRemaining = Math.max(1, summary.daysInMonth - summary.daysElapsed);

  const handleExportMonth = () => {
    try {
      exportToExcel({
        expenses: expenses.filter((e) => {
          const parts = e.expense_date.split('-');
          return parseInt(parts[0], 10) === selectedYear && parseInt(parts[1], 10) === selectedMonth;
        }),
        categories,
        paymentMethods,
        monthlySetting,
        goals,
        scope: 'month',
      });
      showToast('Excel exported ✓', 'success');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-4 py-4 sm:py-6 md:py-8 space-y-6">
      {/* 0. iPhone Back Tap Quick Setup Banner */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>iPhone Back Tap Integration</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                &lt; 5s Entry
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Double-tap the back of your iPhone to record expenses directly into your database.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowBackTapModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 shadow-sm transition-all active:scale-95"
        >
          Setup Tap
        </button>
      </div>

      {/* 1. Header, Person Selector, Month Navigator & Salary/Budget Setup */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Financial Control Center
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </h1>
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-sm">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Customize Salary & Budget CTA */}
            <button
              onClick={() => setShowSalaryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all active:scale-95 shadow-sm"
              title="Set your monthly salary, spending limit, and savings target"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Set Salary & Budget</span>
            </button>

            {/* Central DB Multi-Person Selector */}
            <PersonSelector
              profiles={profiles}
              selectedUserId={selectedUserId}
              onSelectUser={setSelectedUserId}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExportMonth}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <Link
            href="/add"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </Link>
        </div>
      </div>

      {/* 2. Unified Cash Flow Spectrum Hero Card */}
      <CashFlowHeroCard
        income={summary.income}
        monthlyBudget={summary.monthlyBudget}
        totalSpent={summary.totalSpent}
        savingsTarget={monthlySetting.savings_target}
        daysRemaining={daysRemaining}
        onEditPlan={() => setShowSalaryModal(true)}
      />

      {/* 3. Three Core Financial Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pillar 1: Budget Health & Pace */}
        <BudgetHealthCard
          totalSpent={summary.totalSpent}
          monthlyBudget={summary.monthlyBudget}
          daysElapsed={summary.daysElapsed}
          daysInMonth={summary.daysInMonth}
        />

        {/* Pillar 2: Category Spending & Donut */}
        <CategorySpendingCard
          expenses={expenses}
          categories={categories}
          month={selectedMonth}
          year={selectedYear}
        />

        {/* Pillar 3: Savings Goals Vault */}
        <GoalsPreviewCard
          goals={goals}
          onAddGoalClick={() => setShowGoalModal(true)}
        />
      </div>

      {/* 4. Bottom Analytical Grid: Daily Spending Pulse + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Daily Spending Pulse (compact 1-30 days) */}
        <div className="lg:col-span-2">
          <DailySpendingChart
            expenses={expenses}
            month={selectedMonth}
            year={selectedYear}
          />
        </div>

        {/* Right 1 Col: Recent Transactions with Avatars */}
        <div>
          <RecentExpenses expenses={expenses} limit={6} />
        </div>
      </div>

      {/* Salary & Budget Customization Modal */}
      <SalaryBudgetModal
        isOpen={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        monthlySetting={monthlySetting}
        month={selectedMonth}
        year={selectedYear}
        onSaved={(newSetting) => {
          setMonthlySetting(newSetting);
          loadData();
        }}
      />

      {/* Quick Goal Creation Modal */}
      <QuickGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onGoalSaved={loadData}
      />

      {/* iPhone Back Tap Setup Modal */}
      <BackTapSetupModal
        isOpen={showBackTapModal}
        onClose={() => setShowBackTapModal(false)}
      />
    </div>
  );
}
