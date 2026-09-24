'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { MONTH_NAMES, formatINR } from '@/lib/formatting/formatters';
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
import { FinancialHealthScoreCard } from '@/components/dashboard/FinancialHealthScoreCard';
import { SubscriptionsRadarCard } from '@/components/dashboard/SubscriptionsRadarCard';
import { MonthlyBalanceSheetArchive } from '@/components/dashboard/MonthlyBalanceSheetArchive';
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

  // Total monthly committed contributions to savings & investments deducted from salary
  const totalMonthlyCommitted = useMemo(() => {
    return goals.reduce((sum, g) => {
      if (g.status !== 'paused' && g.category_type !== 'cash') {
        return sum + (Number(g.monthly_contribution) || 0);
      }
      return sum;
    }, 0);
  }, [goals]);

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
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* 1. Subtle, Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/70 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>finTrack</span>
            <span>•</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Financial Overview</span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </h1>

            {/* Subtle Month Stepper */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded text-slate-600 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded text-slate-600 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!isCurrentMonthView && (
              <button
                onClick={handleJumpToToday}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-emerald-400" />
                <span>Today</span>
              </button>
            )}
          </div>
        </div>

        {/* Minimal Header Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowBackTapModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            title="Setup iPhone Back Tap"
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">iPhone Tap</span>
          </button>

          <button
            onClick={handleExportMonth}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export</span>
          </button>

          <Link
            href="/add"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Transaction</span>
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

      {/* OVERVIEW TAB - SUBTLE & SIMPLE */}
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

          {/* TABLET / DESKTOP CLEAN DASHBOARD */}
          <div className="hidden md:block space-y-6">
            {/* Subtle 4-Card KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Spent */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Total Spent</span>
                  <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    {summary.budgetUtilization.toFixed(0)}% of limit
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {formatINR(summary.totalSpent)}
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, summary.budgetUtilization)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      summary.budgetUtilization > 90 ? 'bg-rose-500' : 'bg-slate-900 dark:bg-slate-100'
                    }`}
                  />
                </div>
              </div>

              {/* Card 2: Remaining & Allowance */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Remaining Budget</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {daysRemaining}d left
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {formatINR(summary.remainingBudget)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Safe: <strong className="text-slate-900 dark:text-slate-200 font-semibold">{formatINR(safeDailyAllowance)}</strong>/day
                </div>
              </div>

              {/* Card 3: Inflow */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Monthly Inflow</span>
                  <button
                    onClick={() => setShowSalaryModal(true)}
                    className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                  >
                    Adjust
                  </button>
                </div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {formatINR(summary.income)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {monthExpenses.length} entries registered
                </div>
              </div>

              {/* Card 4: Net Surplus / Savings */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Net Savings</span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {summary.savingsRate.toFixed(0)}% saved
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatINR(summary.netCashflow)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Free operating surplus
                </div>
              </div>
            </div>

            {/* Clean Two-Column Core Layout (7 cols Left, 5 cols Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (7 cols): Cashflow Compass & Daily Trajectory */}
              <div className="lg:col-span-7 space-y-6">
                <CashFlowHeroCard
                  income={summary.income}
                  monthlyBudget={summary.monthlyBudget}
                  totalSpent={summary.totalSpent}
                  savingsTarget={monthlySetting.savings_target}
                  daysRemaining={daysRemaining}
                  todaySpent={todaySpent}
                  monthlyCommittedSavingsInvestments={totalMonthlyCommitted}
                  onEditPlan={() => setShowSalaryModal(true)}
                />

                <DailySpendingChart
                  expenses={expenses}
                  month={selectedMonth}
                  year={selectedYear}
                />
              </div>

              {/* Right Column (5 cols): Category Breakdown & Recent Expenses */}
              <div className="lg:col-span-5 space-y-6">
                <HomePagePieChart
                  expenses={expenses}
                  categories={categories}
                  month={selectedMonth}
                  year={selectedYear}
                  income={summary.income}
                />

                <RecentExpenses expenses={expenses} limit={8} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PORTFOLIO & WEALTH VAULTS TAB */}
      {activeTab === 'portfolio' && (
        <SavingsInvestmentsSection
          goals={goals}
          income={summary.income}
          totalSpent={summary.totalSpent}
          monthlyBudget={summary.monthlyBudget}
          monthlyBurnRate={summary.totalSpent}
          onRefresh={loadData}
        />
      )}

      {/* BALANCE SHEETS & ARCHIVE TAB */}
      {activeTab === 'balance-sheet' && (
        <MonthlyBalanceSheetArchive
          expenses={expenses}
          categories={categories}
          currentSelectedMonth={selectedMonth}
          currentSelectedYear={selectedYear}
          onSelectMonthYear={(m, y) => {
            setSelectedMonth(m);
            setSelectedYear(y);
            showToast(`Active dashboard set to ${MONTH_NAMES[m - 1]} ${y} ✓`, 'success');
          }}
        />
      )}

      {/* ANALYTICS & DEEP DIVES TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7">
              <FinancialHealthScoreCard
                score={summary.financialHealthScore}
                savingsRate={summary.savingsRate}
                budgetUtilization={summary.budgetUtilization}
                needsRatio={summary.income > 0 ? (summary.needsSpent / summary.income) * 100 : 0}
                wantsRatio={summary.income > 0 ? (summary.wantsSpent / summary.income) * 100 : 0}
                recurringTotal={summary.recurringTotal}
              />
            </div>
            <div className="lg:col-span-5">
              <SubscriptionsRadarCard
                expenses={expenses}
                income={summary.income}
              />
            </div>
          </div>

          <FinancialPulseWidget
            expenses={expenses}
            income={summary.income}
            monthlyBudget={summary.monthlyBudget}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />

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
