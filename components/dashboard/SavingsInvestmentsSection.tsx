'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShieldCheck,
  Plane,
  Coins,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Sparkles,
  Wallet,
  X,
  Building2,
  Calendar,
  Layers,
  Edit3,
  Trash2,
  PieChart,
  DollarSign,
  Info,
  Scale,
} from 'lucide-react';
import { Goal, GoalCategoryType } from '@/types';
import { formatINR, formatPercentage } from '@/lib/formatting/formatters';
import {
  computeSavingsPortfolio,
  computeCashSavingsInvestmentBreakdown,
  getCategoryBadge,
  getGoalCategoryType,
} from '@/lib/formatting/savingsHelpers';
import {
  calculateMonthsRemaining,
  calculateSIPFutureValue,
  calculateEmergencyRunway,
  calculateLinearRequiredMonthly,
  formatMonthsDuration,
} from '@/lib/calculations/wealthCalculator';
import { addGoalTransaction, deleteGoal } from '@/lib/data/store';
import { GoalModalWithCalculator } from './GoalModalWithCalculator';
import { showToast } from '@/components/ui/Toast';

interface SavingsInvestmentsSectionProps {
  goals: Goal[];
  income?: number;
  totalSpent?: number;
  monthlyBudget?: number;
  monthlyBurnRate?: number;
  onRefresh?: () => void;
}

const VAULT_PRESETS: Array<{
  name: string;
  category: GoalCategoryType;
  icon: string;
  suggestedTarget: number;
  institution: string;
}> = [
  {
    name: 'Cash in Hand / Wallet',
    category: 'cash',
    icon: '💵',
    suggestedTarget: 25000,
    institution: 'Liquid Cash / Physical Wallet',
  },
  {
    name: '6-Month Emergency Runway',
    category: 'emergency',
    icon: '🛡️',
    suggestedTarget: 240000,
    institution: 'Bank FD / Liquid Cash',
  },
  {
    name: 'Index & Mutual Funds SIP',
    category: 'investment',
    icon: '📈',
    suggestedTarget: 500000,
    institution: 'Zerodha / Groww',
  },
  {
    name: 'Goa & Vacation Fund',
    category: 'travel',
    icon: '✈️',
    suggestedTarget: 75000,
    institution: 'Travel Vault',
  },
  {
    name: 'Digital Gold / SGB',
    category: 'investment',
    icon: '🪙',
    suggestedTarget: 150000,
    institution: 'RBI Gold Bonds',
  },
];

export function SavingsInvestmentsSection({
  goals,
  income = 0,
  totalSpent = 0,
  monthlyBudget = 0,
  monthlyBurnRate = 0,
  onRefresh,
}: SavingsInvestmentsSectionProps) {
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activePresetCategory, setActivePresetCategory] = useState<GoalCategoryType>('investment');
  const [selectedFilter, setSelectedFilter] = useState<GoalCategoryType | 'all'>('all');

  // Contribution / Withdrawal modal
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [contributeType, setContributeType] = useState<'deposit' | 'withdraw'>('deposit');
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeNote, setContributeNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute unified Cash, Savings & Investments breakdown
  const breakdown = useMemo(
    () =>
      computeCashSavingsInvestmentBreakdown({
        goals,
        income,
        totalSpent,
        monthlyBurnRate: monthlyBurnRate > 0 ? monthlyBurnRate : totalSpent,
      }),
    [goals, income, totalSpent, monthlyBurnRate]
  );

  // Filtered list
  const filteredGoals = useMemo(() => {
    if (selectedFilter === 'all') return goals;
    return goals.filter((g) => getGoalCategoryType(g) === selectedFilter);
  }, [goals, selectedFilter]);

  const handleOpenAddModal = (defaultCat: GoalCategoryType = 'investment') => {
    setEditingGoal(null);
    setActivePresetCategory(defaultCat);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setActivePresetCategory(getGoalCategoryType(goal));
    setShowAddModal(true);
  };

  const handleDeleteGoal = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteGoal(id);
      showToast(`Deleted ${name} ✓`, 'info');
      onRefresh?.();
    }
  };

  const handleLogTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal) return;
    const amt = parseFloat(contributeAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addGoalTransaction(
        contributeGoal.id,
        amt,
        contributeType,
        contributeNote.trim() || undefined
      );
      showToast(
        contributeType === 'deposit'
          ? `Added +${formatINR(amt)} to ${contributeGoal.name} ✓`
          : `Withdrew -${formatINR(amt)} from ${contributeGoal.name} ✓`,
        'success'
      );
      setContributeGoal(null);
      setContributeAmount('');
      setContributeNote('');
      onRefresh?.();
    } catch (err) {
      console.error(err);
      showToast('Transaction failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#f0f7ff] dark:bg-slate-900/70 rounded-3xl p-5 sm:p-7 border border-sky-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* 1. MASTER HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/25 shrink-0">
            <Coins className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-black dark:text-white tracking-tight">
                Cash, Savings & Investments Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-200 text-sky-950 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                Full Wealth Breakdown
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-400 font-semibold mt-0.5">
              Live breakdown of your liquid cash, safety savings, and compounded investments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenAddModal('investment')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-black shadow-md shadow-sky-600/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Asset / Fund</span>
          </button>

          <Link
            href="/goals"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-black dark:text-slate-200 text-xs font-bold hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span>Command Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. TOP 4 MASTER METRIC CARDS (Total Wealth, Cash, Savings, Investments) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Net Capital */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-sky-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">
              Total Net Wealth
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-700 dark:text-sky-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
              {formatINR(breakdown.totalNetWealth)}
            </div>
            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
              100% Capital • Cash + Savings + Invested
            </div>
          </div>
        </div>

        {/* Card 2: Liquid Cash */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-sky-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-400">
              Liquid Cash
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-black text-sky-700 dark:text-sky-300 tracking-tight">
              {formatINR(breakdown.liquidCash)}
            </div>
            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
              {breakdown.cashPercentage.toFixed(1)}% of wealth • Ready in hand
            </div>
          </div>
        </div>

        {/* Card 3: Dedicated Savings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-blue-200/90 dark:border-blue-950/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-400">
              Dedicated Savings
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
              {formatINR(breakdown.totalSavings)}
            </div>
            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
              {breakdown.savingsPercentage.toFixed(1)}% of wealth • Emergency & Travel
            </div>
          </div>
        </div>

        {/* Card 4: Invested Assets */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-emerald-200/90 dark:border-emerald-950/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Invested Assets
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatINR(breakdown.totalInvestments)}
            </div>
            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
              {breakdown.investmentsPercentage.toFixed(1)}% of wealth • Mutual Funds & Gold
            </div>
          </div>
        </div>
      </div>

      {/* 3. TRI-PILLAR WEALTH RATIO SPECTRUM BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-sky-100 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="font-black text-black dark:text-white flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-sky-600" />
            <span>Asset Allocation: Cash vs Savings vs Investments</span>
          </span>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
            Total Capital: {formatINR(breakdown.totalNetWealth)}
          </span>
        </div>

        {/* The Multi-Segment Spectrum Bar */}
        <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 overflow-hidden flex gap-1 shadow-inner">
          {breakdown.cashPercentage > 0 && (
            <div
              style={{ width: `${breakdown.cashPercentage}%` }}
              className="bg-sky-500 h-full rounded-full transition-all duration-500"
              title={`Cash: ${formatINR(breakdown.liquidCash)} (${breakdown.cashPercentage.toFixed(1)}%)`}
            />
          )}
          {breakdown.savingsPercentage > 0 && (
            <div
              style={{ width: `${breakdown.savingsPercentage}%` }}
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              title={`Savings: ${formatINR(breakdown.totalSavings)} (${breakdown.savingsPercentage.toFixed(1)}%)`}
            />
          )}
          {breakdown.investmentsPercentage > 0 && (
            <div
              style={{ width: `${breakdown.investmentsPercentage}%` }}
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              title={`Investments: ${formatINR(breakdown.totalInvestments)} (${breakdown.investmentsPercentage.toFixed(1)}%)`}
            />
          )}
        </div>

        {/* Legend beneath the spectrum bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-500 inline-block shrink-0" />
            <span className="text-slate-700 dark:text-slate-300">
              💵 Liquid Cash: <strong className="text-black dark:text-white">{formatINR(breakdown.liquidCash)}</strong> ({breakdown.cashPercentage.toFixed(1)}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block shrink-0" />
            <span className="text-slate-700 dark:text-slate-300">
              🛡️ Dedicated Savings: <strong className="text-black dark:text-white">{formatINR(breakdown.totalSavings)}</strong> ({breakdown.savingsPercentage.toFixed(1)}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shrink-0" />
            <span className="text-slate-700 dark:text-slate-300">
              📈 Invested Assets: <strong className="text-black dark:text-white">{formatINR(breakdown.totalInvestments)}</strong> ({breakdown.investmentsPercentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* 4. THE 3 DEEP-DIVE PILLAR BREAKDOWN CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: 💵 Cash & Liquidity Deep Dive */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-100 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">💵</span>
                <h3 className="font-black text-sm text-black dark:text-white">Liquid Cash Position</h3>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                {breakdown.cashPercentage.toFixed(0)}% Ratio
              </span>
            </div>

            <div className="text-2xl font-black text-sky-700 dark:text-sky-300">
              {formatINR(breakdown.liquidCash)}
            </div>

            <div className="space-y-1.5 text-xs pt-1 border-t border-sky-100 dark:border-slate-800">
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-400">
                <span>Monthly Income (Inflow):</span>
                <span className="font-bold text-black dark:text-white">{formatINR(income)}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-400">
                <span>Month Spent (Outflow):</span>
                <span className="font-bold text-rose-600">{formatINR(totalSpent)}</span>
              </div>
              <div className="flex justify-between font-bold text-black dark:text-white pt-1 border-t border-sky-50 dark:border-slate-800">
                <span>Unspent Cash Surplus:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {formatINR(breakdown.operationalCashSurplus)}
                </span>
              </div>
              {breakdown.cashVaults > 0 && (
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-400">
                  <span>Cash in Hand Vaults:</span>
                  <span className="font-bold text-black dark:text-white">{formatINR(breakdown.cashVaults)}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddModal('cash')}
            className="w-full py-2 rounded-xl text-xs font-black bg-sky-50 hover:bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition-colors flex items-center justify-center gap-1 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Cash / Bank Vault</span>
          </button>
        </div>

        {/* Pillar 2: 🛡️ Dedicated Savings Reserves Deep Dive */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-blue-100 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛡️</span>
                <h3 className="font-black text-sm text-black dark:text-white">Savings & Reserves</h3>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {breakdown.savingsPercentage.toFixed(0)}% Ratio
              </span>
            </div>

            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {formatINR(breakdown.totalSavings)}
            </div>

            <div className="space-y-1.5 text-xs pt-1 border-t border-blue-100 dark:border-slate-800">
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-400">
                <span>Emergency Safety Net:</span>
                <span className="font-bold text-black dark:text-white">{formatINR(breakdown.emergencyFunds)}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-400">
                <span>Living Runway Coverage:</span>
                <span className="font-black text-blue-600 dark:text-blue-400">
                  {breakdown.emergencyRunwayMonths > 0 ? `${breakdown.emergencyRunwayMonths.toFixed(1)} months` : '0 months'}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-400">
                <span>Travel & Vacation Saved:</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">{formatINR(breakdown.travelSavings)}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-400">
                <span>Goal & Purchase Reserves:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{formatINR(breakdown.goalPurchases)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddModal('emergency')}
            className="w-full py-2 rounded-xl text-xs font-black bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors flex items-center justify-center gap-1 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Emergency / Trip Fund</span>
          </button>
        </div>

        {/* Pillar 3: 📈 Investments & Mutual Funds Deep Dive */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-emerald-100 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                <h3 className="font-black text-sm text-black dark:text-white">Investments & Growth</h3>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {breakdown.investmentsPercentage.toFixed(0)}% Ratio
              </span>
            </div>

            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatINR(breakdown.totalInvestments)}
            </div>

            <div className="space-y-1.5 text-xs pt-1 border-t border-emerald-100 dark:border-slate-800">
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-400">
                <span>Invested Capital:</span>
                <span className="font-bold text-black dark:text-white">{formatINR(breakdown.totalInvestments)}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-400">
                <span>Active Portfolios:</span>
                <span className="font-bold text-black dark:text-white">{breakdown.investmentCount} vaults</span>
              </div>
              <div className="flex justify-between font-bold text-black dark:text-white pt-1 border-t border-emerald-50 dark:border-slate-800">
                <span>Committed Monthly SIP:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  +{formatINR(breakdown.totalMonthlySIP)}/mo
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <span>Auto-compounded returns:</span>
                <span className="font-bold text-emerald-600">Calculated till 2036+</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddModal('investment')}
            className="w-full py-2 rounded-xl text-xs font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center justify-center gap-1 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Mutual Fund / SIP</span>
          </button>
        </div>
      </div>

      {/* 5. FILTER TABS & VAULT CARDS */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/80 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              selectedFilter === 'all'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white border border-sky-100 dark:border-slate-700'
            }`}
          >
            All Vaults ({goals.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('cash')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
              selectedFilter === 'cash'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white border border-sky-100 dark:border-slate-700'
            }`}
          >
            <span>💵 Cash Vaults</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('investment')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
              selectedFilter === 'investment'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white border border-sky-100 dark:border-slate-700'
            }`}
          >
            <span>📈 Investments</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('emergency')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
              selectedFilter === 'emergency'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white border border-sky-100 dark:border-slate-700'
            }`}
          >
            <span>🛡️ Emergency</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('travel')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
              selectedFilter === 'travel'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white border border-sky-100 dark:border-slate-700'
            }`}
          >
            <span>✈️ Travel</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('purchase')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
              selectedFilter === 'purchase'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white border border-sky-100 dark:border-slate-700'
            }`}
          >
            <span>🎯 Goals & Purchases</span>
          </button>
        </div>

        <div className="text-xs font-bold text-slate-700 dark:text-slate-400">
          Showing {filteredGoals.length} of {goals.length} vaults
        </div>
      </div>

      {/* 6. INDIVIDUAL VAULT CARDS GRID */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-sky-100 dark:border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-slate-800 flex items-center justify-center text-sky-600 dark:text-sky-400 mx-auto">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-sm text-black dark:text-white">
              {selectedFilter === 'all'
                ? 'No Savings or Investment Vaults Yet'
                : `No ${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Vaults Found`}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium mt-1">
              Add a vault for your cash in hand, 6-month emergency runway, or mutual fund SIP.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleOpenAddModal('cash')}
              className="px-3.5 py-1.5 rounded-xl bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-900 text-xs font-black hover:bg-sky-100 transition-colors"
            >
              + Cash in Hand
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('emergency')}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-black hover:bg-blue-100 transition-colors"
            >
              + Emergency Runway
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('investment')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-xs font-black hover:bg-emerald-100 transition-colors"
            >
              + Mutual Funds / SIP
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('travel')}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900 text-xs font-black hover:bg-cyan-100 transition-colors"
            >
              + Travel Fund
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => {
            const catType = getGoalCategoryType(goal);
            const badge = getCategoryBadge(catType);
            const pct =
              goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            const isCompleted = goal.status === 'completed' || pct >= 100;

            // Calculations
            const monthsLeft = calculateMonthsRemaining(goal.deadline);
            const sipProjection =
              catType === 'investment' && goal.deadline
                ? calculateSIPFutureValue({
                    monthlyInvestment: goal.monthly_contribution || 0,
                    months: monthsLeft,
                    annualRatePct: goal.expected_cagr || 12,
                    currentAmount: goal.current_amount || 0,
                  })
                : null;

            const runwayCoverage =
              catType === 'emergency'
                ? calculateEmergencyRunway({
                    currentAmount: goal.current_amount || 0,
                    monthlyBurn: monthlyBurnRate > 0 ? monthlyBurnRate : 40000,
                  })
                : 0;

            const linearNeeded =
              (catType === 'travel' || catType === 'purchase') && goal.deadline
                ? calculateLinearRequiredMonthly({
                    targetAmount: goal.target_amount,
                    currentAmount: goal.current_amount,
                    months: monthsLeft,
                  })
                : 0;

            return (
              <div
                key={goal.id}
                className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3.5 hover:border-sky-300 transition-all"
              >
                <div>
                  {/* Top line: Badge, institution, Edit & Delete */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${badge.badgeBg} ${badge.borderBg}`}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>

                      {goal.institution && (
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{goal.institution}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(goal)}
                        title="Edit Vault & Calculations"
                        className="p-1 rounded-lg text-slate-400 hover:text-black dark:hover:text-white hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal.id, goal.name)}
                        title="Delete Vault"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-black text-sm text-black dark:text-white truncate">
                    {goal.name}
                  </h3>

                  {/* Current Balance */}
                  <div className="mt-2 flex items-baseline justify-between">
                    <div>
                      <div className="text-lg sm:text-xl font-black text-black dark:text-white tracking-tight">
                        {formatINR(goal.current_amount)}
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-400 font-bold">
                        Target: {formatINR(goal.target_amount)}
                      </div>
                    </div>

                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-sky-100 text-sky-900 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {pct.toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-sky-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        catType === 'cash'
                          ? 'bg-sky-500'
                          : catType === 'investment'
                          ? 'bg-emerald-500'
                          : catType === 'emergency'
                          ? 'bg-blue-600'
                          : catType === 'travel'
                          ? 'bg-cyan-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                    />
                  </div>

                  {/* DYNAMIC FINANCIAL INTELLIGENCE AUTO-CALCULATION BLOCK */}
                  {catType === 'investment' && goal.deadline && sipProjection && (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          <span>Horizon: {goal.deadline}</span>
                        </span>
                        <span className="font-black text-emerald-700 dark:text-emerald-400">
                          {formatMonthsDuration(monthsLeft)} ({monthsLeft} mos)
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-black text-black dark:text-white">
                        <span>Projected @ {goal.expected_cagr || 12}% CAGR</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">
                          ~{formatINR(sipProjection.estimatedMaturity)}
                        </span>
                      </div>
                      {goal.monthly_contribution > 0 && (
                        <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between pt-0.5">
                          <span>Monthly SIP: {formatINR(goal.monthly_contribution)}/mo</span>
                          <span>Gain: +{formatINR(sipProjection.wealthGain)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {catType === 'emergency' && (
                    <div className="mt-3 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between font-bold text-blue-900 dark:text-blue-300">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          <span>Runway Coverage:</span>
                        </span>
                        <span className="font-black text-blue-700 dark:text-blue-400">
                          {runwayCoverage.toFixed(1)} months saved
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        Based on {formatINR(monthlyBurnRate > 0 ? monthlyBurnRate : 40000)}/mo living expense
                      </div>
                    </div>
                  )}

                  {(catType === 'travel' || catType === 'purchase') && goal.deadline && (
                    <div className="mt-3 p-2.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between font-bold text-cyan-900 dark:text-cyan-300">
                        <span className="flex items-center gap-1">
                          <Plane className="w-3 h-3 text-cyan-600" />
                          <span>Trip Date: {goal.deadline}</span>
                        </span>
                        <span className="font-black text-cyan-700 dark:text-cyan-400">
                          {monthsLeft} mos left
                        </span>
                      </div>
                      {linearNeeded > 0 && (
                        <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between pt-0.5">
                          <span>Needed: {formatINR(linearNeeded)}/mo</span>
                          <span>Plan: {formatINR(goal.monthly_contribution)}/mo</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Quick Action Deposit / Withdraw */}
                <div className="flex items-center gap-2 pt-2 border-t border-sky-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setContributeGoal(goal);
                      setContributeType('deposit');
                      setContributeAmount('');
                    }}
                    className="flex-1 py-2 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-black dark:text-white text-xs font-black border border-sky-200/70 dark:border-slate-700 flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Deposit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setContributeGoal(goal);
                      setContributeType('withdraw');
                      setContributeAmount('');
                    }}
                    className="flex-1 py-2 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-black dark:text-white text-xs font-black border border-sky-200/70 dark:border-slate-700 flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    <span>- Withdraw</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. MODAL: Create or Edit Vault with Deterministic Financial Calculator */}
      <GoalModalWithCalculator
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingGoal(null);
        }}
        onSaved={onRefresh}
        initialGoal={editingGoal}
        presetCategory={activePresetCategory}
        monthlyBurnRate={monthlyBurnRate > 0 ? monthlyBurnRate : totalSpent}
      />

      {/* 8. MODAL: Deposit / Withdraw Log */}
      {contributeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-sky-100 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-sky-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    contributeType === 'deposit'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {contributeType === 'deposit' ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <h3 className="font-black text-sm text-black dark:text-white">
                  {contributeType === 'deposit' ? 'Add Deposit' : 'Withdraw Funds'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setContributeGoal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-700 dark:text-slate-400 font-bold">
                Target Vault:{' '}
                <span className="font-black text-black dark:text-white">{contributeGoal.name}</span>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                Current Balance: {formatINR(contributeGoal.current_amount)}
              </p>
            </div>

            <form onSubmit={handleLogTransaction} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-black dark:text-slate-300 mb-1">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">₹</span>
                  <input
                    type="number"
                    autoFocus
                    required
                    min="1"
                    step="any"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                    placeholder="5000"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-sky-50/50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-black dark:text-slate-300 mb-1">
                  Note / Memo (Optional)
                </label>
                <input
                  type="text"
                  value={contributeNote}
                  onChange={(e) => setContributeNote(e.target.value)}
                  placeholder="e.g. Monthly SIP transfer, Bonus, Flight tickets"
                  className="w-full px-3 py-2 rounded-xl bg-sky-50/50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="px-4 py-2 rounded-xl border border-sky-200 dark:border-slate-700 text-xs font-bold text-black dark:text-slate-300 hover:bg-sky-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50 ${
                    contributeType === 'deposit'
                      ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/20'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  }`}
                >
                  {isSubmitting
                    ? 'Recording...'
                    : contributeType === 'deposit'
                    ? 'Confirm Deposit'
                    : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
