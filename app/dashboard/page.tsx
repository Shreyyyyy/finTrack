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
import { GoalModalWithCalculator } from '@/components/dashboard/GoalModalWithCalculator';
import { BackTapSetupModal } from '@/components/shortcuts/BackTapSetupModal';
import { HomePagePieChart } from '@/components/dashboard/HomePagePieChart';
import { DashboardTabs, DashboardTabType } from '@/components/dashboard/DashboardTabs';
import { DashboardTransactionsTable } from '@/components/dashboard/DashboardTransactionsTable';
import { MobileMinimalOverview } from '@/components/dashboard/MobileMinimalOverview';
import { FinancialPulseWidget } from '@/components/dashboard/FinancialPulseWidget';
import { SavingsInvestmentsSection } from '@/components/dashboard/SavingsInvestmentsSection';
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
  const [activeTab, setActiveTab] = useState<DashboardTabType>('overview');

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
    window.addEventListener('focus', handleStoreChange);
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, handleStoreChange);
      window.removeEventListener('focus', handleStoreChange);
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

  // Filter expenses belonging to selected month & year
  const monthExpenses = expenses.filter((e) => {
    if (!e.expense_date) return false;
    const parts = e.expense_date.split('-');
    return parseInt(parts[0], 10) === selectedYear && parseInt(parts[1], 10) === selectedMonth;
  });

  // Compute Today's exact spend
  const todayStr = currentDate.toISOString().split('T')[0];
  const todaySpent = expenses
    .filter((e) => e.expense_date === todayStr)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Daily safe allowance calculation
  const safeDailyAllowance =
    summary.remainingBudget > 0 ? summary.remainingBudget / daysRemaining : 0;

  const handleExportMonth = () => {
    try {
      exportToExcel({
        expenses: monthExpenses,
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
    <div className="w-full max-w-[1700px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-6">
      {/* 0. iPhone Back Tap Quick Setup Banner */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-transparent border border-sky-200 dark:border-emerald-500/30 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-sky-600 dark:bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-600/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
              <span>iPhone Back Tap Integration</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-sky-100 dark:bg-emerald-950 text-sky-800 dark:text-emerald-300 border border-sky-200 dark:border-emerald-800">
                &lt; 5s Entry
              </span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-400 font-medium">
              Double-tap the back of your iPhone to record expenses directly into your database.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowBackTapModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 dark:bg-emerald-600 text-white text-xs font-bold shrink-0 shadow-sm transition-all active:scale-95"
        >
          Setup Tap
        </button>
      </div>

      {/* 1. Header & Context Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
              Financial Control Center
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white uppercase">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </h1>

            {/* Month Stepper Navigator */}
            <div className="flex items-center rounded-xl border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-sm">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-black hover:text-sky-600 dark:text-slate-300 dark:hover:text-white hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-black hover:text-sky-600 dark:text-slate-300 dark:hover:text-white hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Jump to Today Button */}
            {!isCurrentMonthView && (
              <button
                onClick={handleJumpToToday}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-black dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
                title="Jump to current month"
              >
                <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-emerald-500" />
                <span>Today</span>
              </button>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleExportMonth}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-black dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-sky-600 dark:text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <Link
            href="/add"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-md shadow-sky-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Navigation Tabs Controller */}
      <DashboardTabs
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        transactionCount={monthExpenses.length}
      />

      {/* 3. TAB CONTENTS */}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* MOBILE MINIMAL VIEW (Phone screens) */}
          <MobileMinimalOverview
            expenses={expenses}
            categories={categories}
            monthlySetting={monthlySetting}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            totalSpent={summary.totalSpent}
            remainingBudget={summary.remainingBudget}
            safeDailyAllowance={safeDailyAllowance}
            daysRemaining={daysRemaining}
            goals={goals}
            onEditPlan={() => setShowSalaryModal(true)}
          />

          {/* LAPTOP / DESKTOP FULL EXPANDED VIEW */}
          <div className="hidden md:block space-y-6">
            {/* Top Hero Layout: Financial Cash Flow Summary (Left) + Interactive Pie Chart (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-between">
                <CashFlowHeroCard
                  income={summary.income}
                  monthlyBudget={summary.monthlyBudget}
                  totalSpent={summary.totalSpent}
                  savingsTarget={monthlySetting.savings_target}
                  daysRemaining={daysRemaining}
                  todaySpent={todaySpent}
                  onEditPlan={() => setShowSalaryModal(true)}
                />
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between">
                <HomePagePieChart
                  expenses={expenses}
                  categories={categories}
                  month={selectedMonth}
                  year={selectedYear}
                  income={summary.income}
                />
              </div>
            </div>

            {/* Savings & Investments Portfolio Command Section */}
            <SavingsInvestmentsSection
              goals={goals}
              monthlyBurnRate={summary.totalSpent}
              onRefresh={loadData}
            />

            {/* Live Financial Vitality & Health Pulse Widget */}
            <FinancialPulseWidget
              expenses={expenses}
              income={summary.income}
              monthlyBudget={summary.monthlyBudget}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />

            {/* Core Pillars Grid - Expanded Full Width */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BudgetHealthCard
                totalSpent={summary.totalSpent}
                monthlyBudget={summary.monthlyBudget}
                daysElapsed={summary.daysElapsed}
                daysInMonth={summary.daysInMonth}
              />

              <CategorySpendingCard
                expenses={expenses}
                categories={categories}
                month={selectedMonth}
                year={selectedYear}
              />

              <GoalsPreviewCard
                goals={goals}
                onAddGoalClick={() => setShowGoalModal(true)}
              />
            </div>

            {/* Daily Spending Pulse */}
            <DailySpendingChart
              expenses={expenses}
              month={selectedMonth}
              year={selectedYear}
            />

            {/* Recent Expenses Feed */}
            <RecentExpenses expenses={expenses} limit={10} />
          </div>
        </div>
      )}

      {/* ANALYTICS MIX TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <HomePagePieChart
            expenses={expenses}
            categories={categories}
            month={selectedMonth}
            year={selectedYear}
            income={summary.income}
          />

          <FinancialPulseWidget
            expenses={expenses}
            income={summary.income}
            monthlyBudget={summary.monthlyBudget}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />

          <DailySpendingChart
            expenses={expenses}
            month={selectedMonth}
            year={selectedYear}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategorySpendingCard
              expenses={expenses}
              categories={categories}
              month={selectedMonth}
              year={selectedYear}
            />

            <BudgetHealthCard
              totalSpent={summary.totalSpent}
              monthlyBudget={summary.monthlyBudget}
              daysElapsed={summary.daysElapsed}
              daysInMonth={summary.daysInMonth}
            />
          </div>
        </div>
      )}

      {/* TRANSACTIONS & TABLES TAB */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <DashboardTransactionsTable
            expenses={monthExpenses}
            categories={categories}
            paymentMethods={paymentMethods}
          />
        </div>
      )}

      {/* SALARY & BUDGET TAB */}
      {activeTab === 'salary' && (
        <div className="space-y-6">
          <CashFlowHeroCard
            income={summary.income}
            monthlyBudget={summary.monthlyBudget}
            totalSpent={summary.totalSpent}
            savingsTarget={monthlySetting.savings_target}
            daysRemaining={daysRemaining}
            todaySpent={todaySpent}
            onEditPlan={() => setShowSalaryModal(true)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BudgetHealthCard
              totalSpent={summary.totalSpent}
              monthlyBudget={summary.monthlyBudget}
              daysElapsed={summary.daysElapsed}
              daysInMonth={summary.daysInMonth}
            />

            <GoalsPreviewCard
              goals={goals}
              onAddGoalClick={() => setShowGoalModal(true)}
            />
          </div>
        </div>
      )}

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

      <GoalModalWithCalculator
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSaved={() => {
          setShowGoalModal(false);
          loadData();
        }}
        monthlyBurnRate={summary.totalSpent}
      />

      <BackTapSetupModal
        isOpen={showBackTapModal}
        onClose={() => setShowBackTapModal(false)}
      />
    </div>
  );
}
