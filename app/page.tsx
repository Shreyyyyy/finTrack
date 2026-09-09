'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Smartphone,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Expense, Category, PaymentMethod, MonthlySetting, Goal } from '@/types';
import {
  getExpenses,
  getCategories,
  getPaymentMethods,
  getMonthlySetting,
  getGoals,
  DATA_CHANGE_EVENT,
} from '@/lib/data/store';
import { calculateDashboardSummary } from '@/lib/calculations/financial';
import { MONTH_NAMES } from '@/lib/formatting/formatters';
import { useAuth } from '@/components/providers/AuthProvider';
import { CashFlowHeroCard } from '@/components/dashboard/CashFlowHeroCard';
import { BudgetHealthCard } from '@/components/dashboard/BudgetHealthCard';
import { CategorySpendingCard } from '@/components/dashboard/CategorySpendingCard';
import { GoalsPreviewCard } from '@/components/dashboard/GoalsPreviewCard';
import { DailySpendingChart } from '@/components/dashboard/DailySpendingChart';
import { RecentExpenses } from '@/components/dashboard/RecentExpenses';
import { SalaryBudgetModal } from '@/components/dashboard/SalaryBudgetModal';
import { QuickGoalModal } from '@/components/dashboard/QuickGoalModal';
import { BackTapSetupModal } from '@/components/shortcuts/BackTapSetupModal';
import { exportToExcel } from '@/lib/excel/exporter';
import { showToast } from '@/components/ui/Toast';

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const currentUserId = profile?.id || user?.id;

  // Dynamic date state
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showBackTapModal, setShowBackTapModal] = useState<boolean>(false);
  const [showSalaryModal, setShowSalaryModal] = useState<boolean>(false);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);

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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      const [expList, catList, pmList, setting, goalList] = await Promise.all([
        getExpenses(currentUserId),
        getCategories(),
        getPaymentMethods(),
        getMonthlySetting(selectedMonth, selectedYear),
        getGoals(),
      ]);

      setExpenses(expList);
      setCategories(catList);
      setPaymentMethods(pmList);
      setMonthlySetting(setting);
      setGoals(goalList);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, currentUserId]);

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

  const isCurrentMonthView = selectedMonth === currentMonth && selectedYear === currentYear;
  const handleJumpToToday = () => {
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
  };

  // Calculations
  const summary = calculateDashboardSummary(expenses, monthlySetting, categories);
  const daysRemaining = Math.max(1, summary.daysInMonth - summary.daysElapsed);

  // Compute Today's exact spend
  const todayStr = currentDate.toISOString().split('T')[0];
  const todaySpent = expenses
    .filter((e) => e.expense_date === todayStr)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

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
      showToast('Excel report generated successfully ✓', 'success');
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

      {/* 1. Header & Context Controls */}
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

            {/* Month Stepper Navigator */}
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-sm">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Jump to Today Button (if not viewing current month) */}
            {!isCurrentMonthView && (
              <button
                onClick={handleJumpToToday}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
                title="Jump to current month"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>Today</span>
              </button>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleExportMonth}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <Link
            href="/add"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
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
        todaySpent={todaySpent}
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

        {/* Pillar 2: Category Spending with Interactive Donut & Quick Log */}
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

      {/* 4. Daily Spending Pulse */}
      <DailySpendingChart
        expenses={expenses}
        month={selectedMonth}
        year={selectedYear}
      />

      {/* 5. Recent Transactions Feed */}
      <RecentExpenses
        expenses={expenses}
        limit={10}
      />

      {/* Modals */}
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

      <QuickGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onGoalSaved={() => {
          setShowGoalModal(false);
          loadData();
        }}
      />

      <BackTapSetupModal
        isOpen={showBackTapModal}
        onClose={() => setShowBackTapModal(false)}
      />
    </div>
  );
}
