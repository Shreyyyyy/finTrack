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
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 text-stone-900 dark:text-amber-100">
      {/* 1. 1940s Financial Gazette Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-double border-amber-800/30 dark:border-amber-700/40">
        <div>
          <div className="flex items-center gap-2 flex-wrap text-xs font-serif font-bold text-amber-900 dark:text-amber-400">
            <span>★ THE DAILY FINANCIAL GAZETTE & CASH REGISTER ★</span>
            <span>•</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-950 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              VOL. MCMXL · EST. 1940
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-stone-950 dark:text-amber-50">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear} Statement
            </h1>

            {/* 1940s Stepper */}
            <div className="flex items-center rounded-lg border border-amber-800/30 dark:border-amber-700/40 bg-[#faf6ed] dark:bg-[#1a1510] p-0.5 shadow-2xs">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded text-stone-700 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white hover:bg-amber-200/50 dark:hover:bg-stone-800 transition-colors"
                title="Previous ledger month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded text-stone-700 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white hover:bg-amber-200/50 dark:hover:bg-stone-800 transition-colors"
                title="Next ledger month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!isCurrentMonthView && (
              <button
                onClick={handleJumpToToday}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-serif font-bold border border-amber-800/30 dark:border-amber-700/40 bg-[#faf6ed] dark:bg-[#1a1510] text-amber-950 dark:text-amber-200 hover:bg-amber-200/50 dark:hover:bg-stone-800 transition-colors shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>Today</span>
              </button>
            )}
          </div>
        </div>

        {/* 1940s Header Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto font-serif">
          <button
            onClick={() => setShowBackTapModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-amber-800/25 dark:border-amber-700/30 bg-[#faf6ed] dark:bg-[#1a1510] text-stone-800 dark:text-amber-200 hover:bg-amber-200/40 dark:hover:bg-stone-800 transition-colors shadow-2xs"
            title="Setup iPhone Back Tap"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span className="hidden sm:inline">iPhone Tap</span>
          </button>

          <button
            onClick={handleExportMonth}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-amber-800/25 dark:border-amber-700/30 bg-[#faf6ed] dark:bg-[#1a1510] text-stone-800 dark:text-amber-200 hover:bg-amber-200/40 dark:hover:bg-stone-800 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>Treasury Export</span>
          </button>

          <Link
            href="/add"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-serif font-black bg-amber-800 hover:bg-amber-700 text-amber-50 shadow-md shadow-amber-950/25 border border-amber-600/50 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Record Voucher</span>
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

      {/* OVERVIEW TAB - 1940s VINTAGE CHRONICLE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* MOBILE MINIMAL VIEW (Phone screens) */}
          <MobileMinimalOverview
            expenses={expenses}
            categories={categories}
            monthlySetting={monthlySetting}
            income={summary.income}
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
            {/* 4 COLORFUL 1940s BANKNOTE CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: 1940s Burgundy Banknote - Disbursed Ledger */}
              <div className="bg-gradient-to-br from-rose-100/90 via-rose-50 to-white dark:from-stone-900 dark:via-rose-950/40 dark:to-stone-950 rounded-2xl p-4 sm:p-5 border-2 border-rose-700/50 dark:border-rose-600/40 shadow-sm flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-xs font-serif">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-950 dark:text-rose-300">
                    📜 Disbursed Funds
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    summary.budgetUtilization > 100
                      ? 'bg-rose-200 text-rose-950 border-rose-300'
                      : 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                  }`}>
                    {summary.budgetUtilization.toFixed(0)}% LIMIT
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-mono font-black tracking-tight text-stone-950 dark:text-amber-50">
                  {formatINR(summary.totalSpent)}
                </div>
                <div className="w-full bg-rose-200/60 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, summary.budgetUtilization)}%` }}
                    className="h-full rounded-full bg-[#7a2828] transition-all duration-500"
                  />
                </div>
                <div className="text-[10px] font-serif italic text-stone-600 dark:text-stone-400">
                  Outflow in current cycle
                </div>
              </div>

              {/* Card 2: 1940s Banknote Mint Green - Treasury Allowance */}
              <div className="bg-gradient-to-br from-emerald-100/90 via-emerald-50 to-white dark:from-stone-900 dark:via-emerald-950/40 dark:to-stone-950 rounded-2xl p-4 sm:p-5 border-2 border-emerald-600/60 dark:border-emerald-500/50 shadow-sm flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-xs font-serif">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-300">
                    💵 Treasury Allowance
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-950 border border-emerald-300">
                    {daysRemaining}D LEFT
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-mono font-black tracking-tight text-stone-950 dark:text-amber-50">
                  {formatINR(summary.remainingBudget)}
                </div>
                <div className="text-xs font-serif text-stone-600 dark:text-stone-400">
                  {summary.remainingBudget > 0 ? (
                    <>
                      Safe: <strong className="font-mono font-bold text-stone-900 dark:text-stone-200">{formatINR(safeDailyAllowance)}</strong>/day
                    </>
                  ) : (
                    <span className="text-rose-700 dark:text-rose-400 font-bold">
                      Allowance exhausted
                    </span>
                  )}
                </div>
              </div>

              {/* Card 3: 1940s Imperial Gold Banknote - Gross Inflow */}
              <div className="bg-gradient-to-br from-amber-100/90 via-amber-50 to-white dark:from-stone-900 dark:via-amber-950/40 dark:to-stone-950 rounded-2xl p-4 sm:p-5 border-2 border-amber-600/60 dark:border-amber-500/50 shadow-sm flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-xs font-serif">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 dark:text-amber-300">
                    ⚜️ Monthly Inflow
                  </span>
                  <button
                    onClick={() => setShowSalaryModal(true)}
                    className="text-[10px] font-serif font-bold text-amber-900 dark:text-amber-300 hover:underline"
                  >
                    Adjust Plan
                  </button>
                </div>
                <div className="text-xl sm:text-2xl font-mono font-black tracking-tight text-amber-950 dark:text-amber-100">
                  {formatINR(summary.income)}
                </div>
                <div className="text-xs font-serif italic text-stone-600 dark:text-stone-400">
                  {summary.actualIncome > 0
                    ? `${monthExpenses.length} vouchers (${formatINR(summary.actualIncome)} credited)`
                    : `${monthExpenses.length} vouchers registered`}
                </div>
              </div>

              {/* Card 4: 1940s Retained Surplus / Deficit */}
              <div className={`bg-gradient-to-br ${
                summary.netCashflow < 0
                  ? 'from-rose-100/90 via-rose-50 to-white dark:from-stone-900 dark:via-rose-950/40 dark:to-stone-950 border-rose-700/50 dark:border-rose-600/40'
                  : 'from-teal-100/90 via-teal-50 to-white dark:from-stone-900 dark:via-teal-950/40 dark:to-stone-950 border-teal-600/60 dark:border-teal-500/50'
              } rounded-2xl p-4 sm:p-5 border-2 shadow-sm flex flex-col justify-between space-y-2`}>
                <div className="flex items-center justify-between text-xs font-serif">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    summary.netCashflow < 0 ? 'text-rose-950 dark:text-rose-300' : 'text-teal-950 dark:text-teal-300'
                  }`}>
                    🏛️ Retained Surplus
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    summary.netCashflow < 0
                      ? 'bg-rose-200 text-rose-950 border-rose-300'
                      : 'bg-teal-200 text-teal-950 border-teal-300'
                  }`}>
                    {summary.netCashflow < 0 ? 'DEFICIT' : `${summary.savingsRate.toFixed(0)}% SAVED`}
                  </span>
                </div>
                <div className={`text-xl sm:text-2xl font-mono font-black tracking-tight ${
                  summary.netCashflow < 0 ? 'text-rose-700 dark:text-rose-400' : 'text-[#24543d] dark:text-emerald-400'
                }`}>
                  {formatINR(summary.netCashflow)}
                </div>
                <div className="text-xs font-serif italic text-stone-600 dark:text-stone-400">
                  {summary.netCashflow < 0 ? 'Operating deficit in current cycle' : 'Sovereign operating surplus'}
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
