'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Check,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Goal, GoalCategoryType } from '@/types';
import { formatINR, formatPercentage } from '@/lib/formatting/formatters';
import {
  computeSavingsPortfolio,
  getCategoryBadge,
  getGoalCategoryType,
} from '@/lib/formatting/savingsHelpers';
import {
  saveGoal,
  addGoalTransaction,
  deleteGoal,
  DATA_CHANGE_EVENT,
} from '@/lib/data/store';
import { showToast } from '@/components/ui/Toast';

interface SavingsInvestmentsSectionProps {
  goals: Goal[];
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
    name: '6-Month Emergency Cash',
    category: 'emergency',
    icon: '🛡️',
    suggestedTarget: 180000,
    institution: 'Bank FD / Liquid Cash',
  },
  {
    name: 'Index & Mutual Funds SIP',
    category: 'investment',
    icon: '📈',
    suggestedTarget: 300000,
    institution: 'Zerodha / Groww',
  },
  {
    name: 'Goa & Vacation Fund',
    category: 'travel',
    icon: '✈️',
    suggestedTarget: 75000,
    institution: 'Savings Account',
  },
  {
    name: 'Digital Gold / SGB',
    category: 'investment',
    icon: '🪙',
    suggestedTarget: 100000,
    institution: 'RBI Gold Bonds',
  },
  {
    name: 'Japan & Euro Dream Trip',
    category: 'travel',
    icon: '🌸',
    suggestedTarget: 250000,
    institution: 'Travel Vault',
  },
];

export function SavingsInvestmentsSection({
  goals,
  monthlyBurnRate = 0,
  onRefresh,
}: SavingsInvestmentsSectionProps) {
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<GoalCategoryType | 'all'>('all');
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [contributeType, setContributeType] = useState<'deposit' | 'withdraw'>('deposit');
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeNote, setContributeNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for New Vault
  const [vaultName, setVaultName] = useState('');
  const [vaultCategory, setVaultCategory] = useState<GoalCategoryType>('investment');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [institution, setInstitution] = useState('');
  const [monthlyDeposit, setMonthlyDeposit] = useState('');

  // Compute portfolio metrics
  const portfolio = useMemo(
    () => computeSavingsPortfolio(goals, monthlyBurnRate),
    [goals, monthlyBurnRate]
  );

  // Filtered list
  const filteredGoals = useMemo(() => {
    if (selectedPreset === 'all') return goals;
    return goals.filter((g) => getGoalCategoryType(g) === selectedPreset);
  }, [goals, selectedPreset]);

  const handleOpenAddModal = (defaultCat?: GoalCategoryType) => {
    setVaultName('');
    setVaultCategory(defaultCat || 'investment');
    setCurrentAmount('');
    setTargetAmount('');
    setInstitution('');
    setMonthlyDeposit('');
    setShowAddModal(true);
  };

  const handleApplyPreset = (preset: (typeof VAULT_PRESETS)[0]) => {
    setVaultName(preset.name);
    setVaultCategory(preset.category);
    setTargetAmount(String(preset.suggestedTarget));
    setInstitution(preset.institution);
  };

  const handleSaveVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultName.trim()) {
      showToast('Please enter a vault name', 'error');
      return;
    }

    const current = parseFloat(currentAmount) || 0;
    const target = parseFloat(targetAmount) || current || 10000;
    const monthly = parseFloat(monthlyDeposit) || 0;

    setIsSubmitting(true);
    try {
      await saveGoal({
        name: vaultName.trim(),
        category_type: vaultCategory,
        institution: institution.trim() || undefined,
        current_amount: current,
        target_amount: target,
        monthly_contribution: monthly,
        status: current >= target && target > 0 ? 'completed' : 'in_progress',
      });

      showToast(`Added ${vaultName} to portfolio ✓`, 'success');
      setShowAddModal(false);
      onRefresh?.();
    } catch (err) {
      console.error(err);
      showToast('Failed to save vault', 'error');
    } finally {
      setIsSubmitting(false);
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
          ? `Deposited ${formatINR(amt)} into ${contributeGoal.name} ✓`
          : `Withdrew ${formatINR(amt)} from ${contributeGoal.name} ✓`,
        'success'
      );
      setContributeGoal(null);
      setContributeAmount('');
      setContributeNote('');
      onRefresh?.();
    } catch (err) {
      console.error(err);
      showToast('Failed to log transaction', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-sky-100 dark:border-slate-800 shadow-sm space-y-6">
      {/* 1. Header with Title & Quick Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-2xs">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-black dark:text-white tracking-tight uppercase">
                Savings & Investments Portfolio
              </h2>
              <p className="text-xs text-slate-700 dark:text-slate-400 font-bold">
                Live balances for investments, emergency reserve, and travel funds
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleOpenAddModal('investment')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Asset / Fund</span>
          </button>

          <Link
            href="/goals"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-sky-200 dark:border-slate-700 text-xs font-bold text-black dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span>All Vaults</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Key Portfolio KPI Cards (The Exact 3 Pillars + Total) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Wealth / Saved */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-sky-50/50 to-blue-50/40 dark:from-slate-800/80 dark:to-slate-900 border border-sky-200/90 dark:border-slate-700 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">
            <span>Total Net Saved</span>
            <Coins className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-black dark:text-white">
            {formatINR(portfolio.totalSavedAndInvested)}
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">
            Across {portfolio.totalVaultsCount} active accounts
          </div>
        </div>

        {/* Invested Amount */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-400">
            <span>Invested Assets</span>
            <span className="text-base">📈</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-black dark:text-white">
            {formatINR(portfolio.totalInvested)}
          </div>
          <div className="text-[10px] text-blue-700 dark:text-blue-300 font-bold flex items-center justify-between">
            <span>{portfolio.investmentCount} investments</span>
            <span>{portfolio.investmentPercentage.toFixed(0)}% share</span>
          </div>
        </div>

        {/* Emergency Funds */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            <span>Emergency Fund</span>
            <span className="text-base">🛡️</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-black dark:text-white">
            {formatINR(portfolio.totalEmergency)}
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-between">
            <span>
              {portfolio.emergencyRunwayMonths > 0
                ? `${portfolio.emergencyRunwayMonths} mo runway`
                : 'Liquid buffer'}
            </span>
            <span>{portfolio.emergencyPercentage.toFixed(0)}% share</span>
          </div>
        </div>

        {/* Travel Savings */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-900/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-400">
            <span>Saved for Travel</span>
            <span className="text-base">✈️</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-black dark:text-white">
            {formatINR(portfolio.totalTravel)}
          </div>
          <div className="text-[10px] text-sky-700 dark:text-sky-300 font-bold flex items-center justify-between">
            <span>{portfolio.travelCount} trip funds</span>
            <span>{portfolio.travelPercentage.toFixed(0)}% share</span>
          </div>
        </div>
      </div>

      {/* 3. Wealth Allocation Progress Distribution Bar */}
      {portfolio.totalSavedAndInvested > 0 && (
        <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-slate-800/40 border border-sky-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-300">
            <span>Wealth Allocation Distribution</span>
            <span className="text-slate-600 dark:text-slate-400 font-bold text-[11px]">
              100% of Saved Net Worth
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-sky-200/50 dark:bg-slate-700 overflow-hidden flex">
            {portfolio.totalInvested > 0 && (
              <div
                style={{ width: `${portfolio.investmentPercentage}%` }}
                className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500"
                title={`Investments: ${formatINR(portfolio.totalInvested)} (${portfolio.investmentPercentage.toFixed(1)}%)`}
              />
            )}
            {portfolio.totalEmergency > 0 && (
              <div
                style={{ width: `${portfolio.emergencyPercentage}%` }}
                className="h-full bg-emerald-500 transition-all duration-500"
                title={`Emergency: ${formatINR(portfolio.totalEmergency)} (${portfolio.emergencyPercentage.toFixed(1)}%)`}
              />
            )}
            {portfolio.totalTravel > 0 && (
              <div
                style={{ width: `${portfolio.travelPercentage}%` }}
                className="h-full bg-sky-500 transition-all duration-500"
                title={`Travel: ${formatINR(portfolio.totalTravel)} (${portfolio.travelPercentage.toFixed(1)}%)`}
              />
            )}
            {portfolio.otherPercentage > 0 && (
              <div
                style={{ width: `${portfolio.otherPercentage}%` }}
                className="h-full bg-amber-500 transition-all duration-500"
                title={`Other: ${portfolio.otherPercentage.toFixed(1)}%`}
              />
            )}
          </div>

          {/* Legend row */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-bold">
            <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Invested: {formatINR(portfolio.totalInvested)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Emergency: {formatINR(portfolio.totalEmergency)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sky-900 dark:text-sky-300">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Travel: {formatINR(portfolio.totalTravel)}</span>
            </div>
            {portfolio.totalPurchases + portfolio.totalOther > 0 && (
              <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Other: {formatINR(portfolio.totalPurchases + portfolio.totalOther)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Vault Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {(
          [
            { id: 'all', label: 'All Vaults', icon: '💎' },
            { id: 'investment', label: 'Investments', icon: '📈' },
            { id: 'emergency', label: 'Emergency Fund', icon: '🛡️' },
            { id: 'travel', label: 'Travel & Trips', icon: '✈️' },
            { id: 'purchase', label: 'Goals & Purchases', icon: '🎯' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedPreset(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedPreset === tab.id
                ? 'bg-sky-600 text-white shadow-xs font-black'
                : 'bg-sky-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-100 border border-sky-100 dark:border-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 5. Vaults Cards Grid or Clean Empty Starter */}
      {filteredGoals.length === 0 ? (
        <div className="py-8 px-4 rounded-3xl bg-sky-50/40 dark:bg-slate-800/30 border border-dashed border-sky-200 dark:border-slate-800 text-center space-y-4">
          <div className="max-w-sm mx-auto space-y-1">
            <h4 className="text-sm font-black text-black dark:text-white">
              No vaults found in this category
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">
              Start tracking your savings and investments with 1 click:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-xl mx-auto pt-1">
            <button
              type="button"
              onClick={() => {
                handleApplyPreset(VAULT_PRESETS[0]);
                setShowAddModal(true);
              }}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 hover:border-emerald-400 text-left transition-all active:scale-95 shadow-2xs space-y-1"
            >
              <span className="text-lg">🛡️</span>
              <div className="text-xs font-black text-black dark:text-white">Emergency Fund</div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                6-Month Reserve
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                handleApplyPreset(VAULT_PRESETS[1]);
                setShowAddModal(true);
              }}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 hover:border-blue-400 text-left transition-all active:scale-95 shadow-2xs space-y-1"
            >
              <span className="text-lg">📈</span>
              <div className="text-xs font-black text-black dark:text-white">Investments</div>
              <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold">
                Mutual Funds & Stocks
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                handleApplyPreset(VAULT_PRESETS[2]);
                setShowAddModal(true);
              }}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 hover:border-sky-400 text-left transition-all active:scale-95 shadow-2xs space-y-1"
            >
              <span className="text-lg">✈️</span>
              <div className="text-xs font-black text-black dark:text-white">Travel Savings</div>
              <div className="text-[10px] text-sky-700 dark:text-sky-400 font-bold">
                Goa & Vacations
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredGoals.map((goal) => {
            const catType = getGoalCategoryType(goal);
            const badge = getCategoryBadge(catType);
            const pct =
              goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            const isCompleted = goal.status === 'completed' || pct >= 100;

            return (
              <div
                key={goal.id}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-3.5 hover:border-sky-200 transition-colors"
              >
                <div>
                  {/* Top line badge and institution */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
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

                  <h3 className="font-black text-sm text-black dark:text-white truncate">
                    {goal.name}
                  </h3>

                  {/* Current Balance */}
                  <div className="mt-2 flex items-baseline justify-between">
                    <div>
                      <div className="text-lg font-black text-black dark:text-white">
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
                        catType === 'investment'
                          ? 'bg-blue-600'
                          : catType === 'emergency'
                          ? 'bg-emerald-500'
                          : catType === 'travel'
                          ? 'bg-sky-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                    />
                  </div>
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
                    className="flex-1 py-1.5 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-black dark:text-white text-[11px] font-black border border-sky-200/70 dark:border-slate-700 flex items-center justify-center gap-1 active:scale-95 transition-all"
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
                    className="flex-1 py-1.5 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-black dark:text-white text-[11px] font-black border border-sky-200/70 dark:border-slate-700 flex items-center justify-center gap-1 active:scale-95 transition-all"
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

      {/* 6. MODAL: Add New Savings Vault / Investment Fund */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-sky-100 dark:border-slate-800 shadow-2xl p-6 space-y-5 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-sky-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-black dark:text-white">
                    Add Savings or Investment Fund
                  </h3>
                  <p className="text-[11px] text-slate-700 dark:text-slate-400 font-medium">
                    Create a dedicated vault for travel, investments, or safety reserves
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVault} className="space-y-4">
              {/* Category / Vault Type Selection */}
              <div>
                <label className="block text-xs font-black text-black dark:text-slate-300 mb-1.5">
                  Fund Purpose / Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'investment', label: 'Investment', icon: '📈' },
                      { id: 'emergency', label: 'Emergency', icon: '🛡️' },
                      { id: 'travel', label: 'Travel', icon: '✈️' },
                      { id: 'purchase', label: 'Dream Goal', icon: '🎯' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVaultCategory(item.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 flex items-center gap-2 ${
                        vaultCategory === item.id
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-sky-50/70 dark:bg-slate-800 border-sky-200 dark:border-slate-700 text-black dark:text-slate-300'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs font-black">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Presets Strip */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">
                  Quick Ideas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {VAULT_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-slate-800/80 border border-sky-200 dark:border-slate-700 text-[11px] font-bold text-black dark:text-slate-300 hover:border-sky-500 transition-colors"
                    >
                      {p.icon} {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fund Name */}
              <div>
                <label className="block text-xs font-black text-black dark:text-slate-300 mb-1">
                  Vault Name / Fund Title
                </label>
                <input
                  type="text"
                  value={vaultName}
                  onChange={(e) => setVaultName(e.target.value)}
                  placeholder="e.g. Zerodha Index SIP, Goa Vacation, Emergency Cash"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              {/* Balances */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black dark:text-slate-300 mb-1">
                    Current Saved / Invested Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      placeholder="50000"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-sky-50/50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-black dark:text-slate-300 mb-1">
                    Target Goal Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="150000"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-sky-50/50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Institution and Monthly SIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black dark:text-slate-300 mb-1">
                    Platform / Bank / Location
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Zerodha, Groww, HDFC, Cash"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black dark:text-slate-300 mb-1">
                    Monthly Contribution / SIP (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={monthlyDeposit}
                      onChange={(e) => setMonthlyDeposit(e.target.value)}
                      placeholder="5000"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-sky-50/50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-sky-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-sky-200 dark:border-slate-700 text-xs font-bold text-black dark:text-slate-300 hover:bg-sky-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-black shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Create Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: Instant Deposit / Withdraw */}
      {contributeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-sky-100 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-sky-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm text-black dark:text-white">
                  {contributeType === 'deposit' ? 'Add Funds to Vault' : 'Withdraw from Vault'}
                </h3>
                <p className="text-[11px] text-slate-700 dark:text-slate-400 font-medium">
                  {contributeGoal.name} · Current: {formatINR(contributeGoal.current_amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setContributeGoal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogTransaction} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-sky-100/70 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setContributeType('deposit')}
                  className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    contributeType === 'deposit'
                      ? 'bg-white dark:bg-slate-900 text-black dark:text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Deposit (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setContributeType('withdraw')}
                  className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    contributeType === 'withdraw'
                      ? 'bg-white dark:bg-slate-900 text-black dark:text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                  <span>Withdraw (-)</span>
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-black text-black dark:text-slate-300 mb-1">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-black text-slate-500">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-sky-50/50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-base font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-black text-black dark:text-slate-300 mb-1">
                  Note / Reason (Optional)
                </label>
                <input
                  type="text"
                  value={contributeNote}
                  onChange={(e) => setContributeNote(e.target.value)}
                  placeholder="e.g. Monthly SIP, Ticket booking, Emergency clinic"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-100 dark:border-slate-800">
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
