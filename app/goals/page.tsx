'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Edit3,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  X,
  TrendingUp,
  ShieldCheck,
  Plane,
  Coins,
  Building2,
  Sparkles,
  Layers,
  Wallet,
} from 'lucide-react';
import { Goal, GoalCategoryType } from '@/types';
import {
  getGoals,
  deleteGoal,
  addGoalTransaction,
  DATA_CHANGE_EVENT,
} from '@/lib/data/store';
import { formatINR, formatPercentage, formatDateIndian } from '@/lib/formatting/formatters';
import {
  computeSavingsPortfolio,
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
import { GoalModalWithCalculator } from '@/components/dashboard/GoalModalWithCalculator';
import { showToast } from '@/components/ui/Toast';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'all' | GoalCategoryType>('all');

  // Modals
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activePresetCategory, setActivePresetCategory] = useState<GoalCategoryType>('investment');

  // Contribution / Withdrawal modal
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [contributeType, setContributeType] = useState<'deposit' | 'withdraw'>('deposit');
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeNote, setContributeNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const list = await getGoals();
      setGoals(list);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener(DATA_CHANGE_EVENT, loadData);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, loadData);
  }, []);

  // Compute portfolio metrics
  const portfolio = useMemo(() => computeSavingsPortfolio(goals), [goals]);

  // Filtered goals
  const filteredGoals = useMemo(() => {
    if (filterCategory === 'all') return goals;
    return goals.filter((g) => getGoalCategoryType(g) === filterCategory);
  }, [goals, filterCategory]);

  const openCreateModal = (presetCategory: GoalCategoryType = 'investment') => {
    setEditingGoal(null);
    setActivePresetCategory(presetCategory);
    setShowGoalModal(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setActivePresetCategory(getGoalCategoryType(goal));
    setShowGoalModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteGoal(id);
      showToast(`Deleted ${name} ✓`, 'info');
      loadData();
    }
  };

  const handleContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal) return;
    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addGoalTransaction(
        contributeGoal.id,
        amount,
        contributeType,
        contributeNote.trim() || undefined
      );
      setContributeGoal(null);
      setContributeAmount('');
      setContributeNote('');
      showToast(
        contributeType === 'deposit'
          ? `Deposit of ${formatINR(amount)} added ✓`
          : `Withdrawal of ${formatINR(amount)} logged ✓`,
        'success'
      );
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Transaction failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-5 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">
              Savings & Investments
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              Auto-Calculator Hub
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-400 font-semibold mt-0.5">
            Auto-calculate SIP compounding till 2036, emergency runway targets, and trip milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openCreateModal('investment')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Asset / Fund</span>
          </button>
        </div>
      </div>

      {/* TOP 4 KPI PORTFOLIO CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Net Saved */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-sky-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider">
              Total Net Saved
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
              {formatINR(portfolio.totalSavedAndInvested)}
            </div>
            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
              Across {goals.length} active vaults
            </div>
          </div>
        </div>

        {/* Invested Assets */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-emerald-100 dark:border-emerald-950/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider">
              Invested Assets
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatINR(portfolio.totalInvested)}
            </div>
            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
              {portfolio.investmentPercentage.toFixed(1)}% of total wealth • {portfolio.investmentCount} assets
            </div>
          </div>
        </div>

        {/* Emergency Funds */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-blue-100 dark:border-blue-950/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider">
              Emergency Funds
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
              {formatINR(portfolio.totalEmergency)}
            </div>
            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
              {portfolio.emergencyPercentage.toFixed(1)}% of total wealth
            </div>
          </div>
        </div>

        {/* Travel Savings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-cyan-100 dark:border-cyan-950/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider">
              Travel Savings
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Plane className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-cyan-700 dark:text-cyan-300 tracking-tight">
              {formatINR(portfolio.totalTravel)}
            </div>
            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
              {portfolio.travelPercentage.toFixed(1)}% of total wealth
            </div>
          </div>
        </div>
      </div>

      {/* FILTER TABS & QUICK ADD */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              filterCategory === 'all'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-white border border-sky-100 dark:border-slate-800'
            }`}
          >
            All Vaults ({goals.length})
          </button>
          <button
            onClick={() => setFilterCategory('investment')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
              filterCategory === 'investment'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-white border border-sky-100 dark:border-slate-800'
            }`}
          >
            <span>📈 Investments</span>
          </button>
          <button
            onClick={() => setFilterCategory('emergency')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
              filterCategory === 'emergency'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-white border border-sky-100 dark:border-slate-800'
            }`}
          >
            <span>🛡️ Emergency</span>
          </button>
          <button
            onClick={() => setFilterCategory('travel')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
              filterCategory === 'travel'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-white border border-sky-100 dark:border-slate-800'
            }`}
          >
            <span>✈️ Travel</span>
          </button>
          <button
            onClick={() => setFilterCategory('purchase')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
              filterCategory === 'purchase'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-white border border-sky-100 dark:border-slate-800'
            }`}
          >
            <span>🎯 Goals & Purchases</span>
          </button>
        </div>

        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
          Showing {filteredGoals.length} item{filteredGoals.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-sky-100 dark:border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-slate-800 flex items-center justify-center text-sky-600 dark:text-sky-400 mx-auto">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-base text-black dark:text-white">
              {filterCategory === 'all'
                ? 'No Savings or Investment Vaults Yet'
                : `No ${filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1)} Vaults Found`}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium mt-1">
              Start building your wealth by allocating funds to an emergency reserve, mutual fund SIP, or vacation savings.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              onClick={() => openCreateModal('emergency')}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-100 dark:border-blue-900"
            >
              + Emergency Fund
            </button>
            <button
              onClick={() => openCreateModal('investment')}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900"
            >
              + Mutual Funds / SIP
            </button>
            <button
              onClick={() => openCreateModal('travel')}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-cyan-50 hover:bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-100 dark:border-cyan-900"
            >
              + Vacation Savings
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => {
            const catType = getGoalCategoryType(goal);
            const badge = getCategoryBadge(catType);
            const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            const isDone = goal.status === 'completed' || pct >= 100;
            const remaining = Math.max(0, goal.target_amount - goal.current_amount);

            // Horizon & Compound Calculations
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
                    monthlyBurn: 40000,
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
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-sky-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Top bar: Category badge, institution, title & action buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black ${badge.badgeBg} ${badge.borderBg} border`}
                        >
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>

                        {goal.institution && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700">
                            <Building2 className="w-2.5 h-2.5" />
                            <span>{goal.institution}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-base text-black dark:text-white pt-0.5">
                        {goal.name}
                      </h3>

                      {goal.deadline && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Target: {formatDateIndian(goal.deadline)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(goal)}
                        aria-label="Edit goal"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-black dark:hover:text-white hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id, goal.name)}
                        aria-label="Delete goal"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-black text-black dark:text-white tracking-tight">
                        {formatINR(goal.current_amount)}
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-400 font-bold">
                        Target: {formatINR(goal.target_amount)}
                      </div>
                    </div>

                    <div
                      className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-sky-100 text-black dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {formatPercentage(pct)}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-sky-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone
                          ? 'bg-emerald-500'
                          : catType === 'emergency'
                          ? 'bg-blue-600'
                          : catType === 'travel'
                          ? 'bg-cyan-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                    />
                  </div>

                  {/* Dynamic Financial Intelligence Box */}
                  {catType === 'investment' && goal.deadline && sipProjection && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                        <span>Horizon: {goal.deadline}</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-black">
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
                        <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between pt-0.5">
                          <span>Monthly SIP: {formatINR(goal.monthly_contribution)}/mo</span>
                          <span>Gain: +{formatINR(sipProjection.wealthGain)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {catType === 'emergency' && (
                    <div className="mt-3 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-blue-900 dark:text-blue-300">
                        <span>Runway Coverage:</span>
                        <span className="font-black text-blue-700 dark:text-blue-400">
                          {runwayCoverage.toFixed(1)} months saved
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        Target: {formatINR(goal.target_amount)} reserve
                      </div>
                    </div>
                  )}

                  {(catType === 'travel' || catType === 'purchase') && goal.deadline && (
                    <div className="mt-3 p-3 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-cyan-900 dark:text-cyan-300">
                        <span>Target Date: {goal.deadline}</span>
                        <span className="font-black text-cyan-700 dark:text-cyan-400">
                          {monthsLeft} mos left
                        </span>
                      </div>
                      {linearNeeded > 0 && (
                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between pt-0.5">
                          <span>Required: {formatINR(linearNeeded)}/mo</span>
                          <span>Plan: {formatINR(goal.monthly_contribution)}/mo</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-400 mt-2">
                    <span>{isDone ? 'Milestone Achieved ✓' : `${formatINR(remaining)} to target`}</span>
                    {goal.monthly_contribution > 0 && (
                      <span className="font-bold text-sky-700 dark:text-sky-400">
                        +{formatINR(goal.monthly_contribution)}/mo
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Add / Withdraw Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-sky-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setContributeGoal(goal);
                      setContributeType('deposit');
                      setContributeAmount('');
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-black bg-sky-50 dark:bg-emerald-950/60 text-sky-800 dark:text-emerald-300 hover:bg-sky-100 dark:hover:bg-emerald-900 transition-colors flex items-center justify-center gap-1 border border-sky-100 dark:border-transparent active:scale-95"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Deposit (+)</span>
                  </button>

                  <button
                    onClick={() => {
                      setContributeGoal(goal);
                      setContributeType('withdraw');
                      setContributeAmount('');
                    }}
                    className="py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 border border-sky-100 dark:border-transparent active:scale-95"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Withdraw (-)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Modal with Deterministic Financial Calculator */}
      <GoalModalWithCalculator
        isOpen={showGoalModal}
        onClose={() => {
          setShowGoalModal(false);
          setEditingGoal(null);
        }}
        onSaved={loadData}
        initialGoal={editingGoal}
        presetCategory={activePresetCategory}
      />

      {/* Contribution / Withdrawal Modal */}
      {contributeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-sky-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-black dark:text-white">
                {contributeType === 'deposit' ? 'Add Deposit (+)' : 'Withdraw Funds (-)'}
              </h3>
              <button
                onClick={() => setContributeGoal(null)}
                className="text-slate-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">
              Vault: <span className="font-bold text-black dark:text-slate-200">{contributeGoal.name}</span>
            </p>

            <form onSubmit={handleContribution} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-black dark:text-slate-300 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  autoFocus
                  required
                  placeholder="5000"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-sky-50/70 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 font-bold text-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black dark:text-slate-300 mb-1">
                  Optional Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly SIP transfer, Bonus, Flight tickets"
                  value={contributeNote}
                  onChange={(e) => setContributeNote(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-sky-50/70 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 font-medium text-black dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-sky-100 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-sky-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50 ${
                    contributeType === 'deposit'
                      ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/20'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  }`}
                >
                  Confirm {contributeType === 'deposit' ? 'Deposit' : 'Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
