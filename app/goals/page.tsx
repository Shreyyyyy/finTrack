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
      {/* 1940s Sovereign Treasury Header */}
      <div className="bg-[#fcfaf2] dark:bg-[#1a1714] p-5 sm:p-6 rounded-2xl border-2 border-double border-amber-800/40 dark:border-amber-700/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">🏛️</span>
            <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-amber-950 dark:text-amber-100">
              Central Treasury & Wealth Portfolio
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-amber-200/90 text-amber-950 border border-amber-400/80 shadow-xs">
              EST. 1940 · GOLD STANDARD
            </span>
          </div>
          <p className="text-xs font-serif text-amber-900/80 dark:text-amber-300/80 font-semibold mt-1">
            Chartered asset ledger, deterministic SIP compounding projections through 2036, and war defense runway reserves.
          </p>
        </div>

        <div className="flex items-center gap-2 font-serif">
          <button
            onClick={() => openCreateModal('investment')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-amber-900 hover:bg-amber-950 text-amber-50 shadow-md border border-amber-950 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Issue New Asset Vault</span>
          </button>
        </div>
      </div>

      {/* TOP 4 MASTER 1940s BANKNOTE KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Imperial Gold Banknote - Net Capital */}
        <div className="bg-gradient-to-br from-amber-100/90 via-amber-50 to-white dark:from-stone-900 dark:via-amber-950/40 dark:to-stone-950 rounded-2xl p-4 sm:p-5 border-2 border-amber-600/70 dark:border-amber-500/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 dark:text-amber-300 font-serif">
              👑 Net Capital
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-400 font-mono">
              TOTAL
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-200 tracking-tight font-mono">
              {formatINR(portfolio.totalSavedAndInvested)}
            </div>
            <div className="text-[10px] font-bold text-amber-900/80 dark:text-amber-400/80 mt-1 font-serif">
              Across {goals.length} chartered vaults
            </div>
          </div>
        </div>

        {/* Card 2: Royal Navy Fountain Blue - Equities SIP */}
        <div className="bg-gradient-to-br from-blue-100/90 via-blue-50 to-white dark:from-stone-900 dark:via-blue-950/40 dark:to-stone-950 rounded-2xl p-4 sm:p-5 border-2 border-blue-600/60 dark:border-blue-500/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-950 dark:text-blue-300 font-serif">
              📈 Compound Growth
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-blue-200 text-blue-900 border border-blue-300 font-mono">
              EQUITIES
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-300 tracking-tight font-mono">
              {formatINR(portfolio.totalInvested)}
            </div>
            <div className="text-[10px] font-bold text-blue-800/80 dark:text-blue-400/80 mt-1 font-serif">
              {portfolio.investmentPercentage.toFixed(1)}% ratio · {portfolio.investmentCount} assets
            </div>
          </div>
        </div>

        {/* Card 3: Defense Crimson / Amber - Emergency Safety Net */}
        <div className="bg-gradient-to-br from-rose-100/90 via-rose-50 to-white dark:from-stone-900 dark:via-rose-950/40 dark:to-stone-950 rounded-2xl p-4 sm:p-5 border-2 border-rose-600/60 dark:border-rose-500/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-950 dark:text-rose-300 font-serif">
              🛡️ War Defense
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-200 text-rose-900 border border-rose-300 font-mono">
              RESERVES
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-rose-950 dark:text-rose-300 tracking-tight font-mono">
              {formatINR(portfolio.totalEmergency)}
            </div>
            <div className="text-[10px] font-bold text-rose-800/80 dark:text-rose-400/80 mt-1 font-serif">
              {portfolio.emergencyPercentage.toFixed(1)}% of total reserves
            </div>
          </div>
        </div>

        {/* Card 4: Seafoam Cyan Banknote - Voyage & Goals */}
        <div className="bg-gradient-to-br from-cyan-100/90 via-cyan-50 to-white dark:from-stone-900 dark:via-cyan-950/40 dark:to-stone-950 rounded-2xl p-4 sm:p-5 border-2 border-cyan-600/60 dark:border-cyan-500/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-950 dark:text-cyan-300 font-serif">
              ✈️ Voyages & Goals
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-cyan-200 text-cyan-900 border border-cyan-300 font-mono">
              TRAVEL
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-cyan-900 dark:text-cyan-300 tracking-tight font-mono">
              {formatINR(portfolio.totalTravel)}
            </div>
            <div className="text-[10px] font-bold text-cyan-800/80 dark:text-cyan-400/80 mt-1 font-serif">
              {portfolio.travelPercentage.toFixed(1)}% earmarked for voyages
            </div>
          </div>
        </div>
      </div>

      {/* VINTAGE LEDGER FILTER TABS */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-double border-amber-800/40 dark:border-stone-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none font-serif">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              filterCategory === 'all'
                ? 'bg-amber-900 dark:bg-amber-100 text-amber-50 dark:text-amber-950 shadow-sm border border-amber-950'
                : 'bg-[#faf6ed] dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white border border-amber-800/30 dark:border-stone-800'
            }`}
          >
            All Vaults ({goals.length})
          </button>
          <button
            onClick={() => setFilterCategory('investment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              filterCategory === 'investment'
                ? 'bg-blue-900 text-white shadow-sm border border-blue-950'
                : 'bg-[#faf6ed] dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white border border-amber-800/30 dark:border-stone-800'
            }`}
          >
            <span>📈 Equities & SIP</span>
          </button>
          <button
            onClick={() => setFilterCategory('emergency')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              filterCategory === 'emergency'
                ? 'bg-rose-900 text-white shadow-sm border border-rose-950'
                : 'bg-[#faf6ed] dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white border border-amber-800/30 dark:border-stone-800'
            }`}
          >
            <span>🛡️ War Reserves</span>
          </button>
          <button
            onClick={() => setFilterCategory('travel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              filterCategory === 'travel'
                ? 'bg-cyan-800 text-white shadow-sm border border-cyan-950'
                : 'bg-[#faf6ed] dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white border border-amber-800/30 dark:border-stone-800'
            }`}
          >
            <span>✈️ Voyages</span>
          </button>
          <button
            onClick={() => setFilterCategory('purchase')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              filterCategory === 'purchase'
                ? 'bg-amber-800 text-white shadow-sm border border-amber-950'
                : 'bg-[#faf6ed] dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white border border-amber-800/30 dark:border-stone-800'
            }`}
          >
            <span>🎯 Acquisitions</span>
          </button>
        </div>

        <div className="text-xs font-serif font-bold text-amber-950 dark:text-amber-300">
          Showing {filteredGoals.length} ledger item{filteredGoals.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Goals / Asset Certificates Grid */}
      {filteredGoals.length === 0 ? (
        <div className="bg-[#fcf8ed] dark:bg-[#1a1714] rounded-3xl p-10 border-2 border-dashed border-amber-800/40 text-center space-y-4 font-serif">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-800 dark:text-amber-400 mx-auto border border-amber-300">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-black text-base text-stone-900 dark:text-stone-100">
              {filterCategory === 'all'
                ? 'No Savings or Investment Vaults Registered'
                : `No ${filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1)} Vaults Found`}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto font-serif mt-1">
              Start building your wealth by allocating funds to an emergency reserve, mutual fund SIP, or vacation savings.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              onClick={() => openCreateModal('emergency')}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-800 text-white hover:bg-amber-900 shadow-xs"
            >
              + Emergency Fund
            </button>
            <button
              onClick={() => openCreateModal('investment')}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-900 text-white hover:bg-blue-950 shadow-xs"
            >
              + Mutual Funds / SIP
            </button>
            <button
              onClick={() => openCreateModal('travel')}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-cyan-800 text-white hover:bg-cyan-900 shadow-xs"
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
                className="bg-[#fdfbf6] dark:bg-[#1c1815] rounded-2xl p-5 sm:p-6 border-2 border-double border-amber-800/40 dark:border-amber-700/30 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-600 dark:hover:border-amber-500 transition-all relative overflow-hidden"
              >
                {/* 1940s Serial Watermark */}
                <div className="absolute top-2 right-12 text-[8px] font-mono text-amber-900/40 dark:text-amber-500/30 tracking-widest pointer-events-none select-none">
                  SERIES 1940 · #{goal.id.slice(0, 6).toUpperCase()}
                </div>

                <div>
                  {/* Top bar: Category badge, institution, title & action buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-black ${badge.badgeBg} ${badge.borderBg} border shadow-xs`}
                        >
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>

                        {goal.institution && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-serif font-bold text-stone-600 dark:text-stone-400">
                            <Building2 className="w-3 h-3 text-amber-700" />
                            <span>{goal.institution}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif font-black text-base text-stone-900 dark:text-stone-100 pt-1 tracking-tight">
                        {goal.name}
                      </h3>

                      {goal.deadline && (
                        <div className="flex items-center gap-1 text-[11px] font-serif font-semibold text-stone-600 dark:text-stone-400">
                          <Calendar className="w-3 h-3 text-amber-700" />
                          <span>Maturity Date: {formatDateIndian(goal.deadline)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(goal)}
                        aria-label="Edit goal"
                        className="p-1 rounded text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-amber-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id, goal.name)}
                        aria-label="Delete goal"
                        className="p-1 rounded text-stone-500 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-black font-mono text-stone-900 dark:text-stone-100 tracking-tight">
                        {formatINR(goal.current_amount)}
                      </div>
                      <div className="text-xs font-mono text-stone-600 dark:text-stone-400 font-bold">
                        Target: {formatINR(goal.target_amount)}
                      </div>
                    </div>

                    <div
                      className={`px-2 py-0.5 rounded text-xs font-mono font-black border ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-stone-800 dark:text-stone-300'
                      }`}
                    >
                      {formatPercentage(pct)}
                    </div>
                  </div>

                  {/* Engraved Progress Bar */}
                  <div className="w-full bg-stone-200 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden mt-3 border border-amber-800/30 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone
                          ? 'bg-emerald-600'
                          : catType === 'emergency'
                          ? 'bg-rose-600'
                          : catType === 'travel'
                          ? 'bg-cyan-600'
                          : 'bg-blue-700'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                    />
                  </div>

                  {/* Dynamic Financial Intelligence Box - Parchment Inset */}
                  {catType === 'investment' && goal.deadline && sipProjection && (
                    <div className="mt-3 p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-1 text-xs font-serif">
                      <div className="flex items-center justify-between font-bold text-blue-950 dark:text-blue-300">
                        <span>Horizon: {goal.deadline}</span>
                        <span className="text-blue-900 dark:text-blue-400 font-black font-mono">
                          {formatMonthsDuration(monthsLeft)} ({monthsLeft} mos)
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-black text-stone-900 dark:text-stone-100">
                        <span>Projected @ {goal.expected_cagr || 12}% CAGR</span>
                        <span className="text-blue-800 dark:text-blue-400 font-mono font-black">
                          ~{formatINR(sipProjection.estimatedMaturity)}
                        </span>
                      </div>
                      {goal.monthly_contribution > 0 && (
                        <div className="text-[11px] font-bold text-stone-600 dark:text-stone-400 flex items-center justify-between pt-0.5">
                          <span>Monthly SIP: {formatINR(goal.monthly_contribution)}/mo</span>
                          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">Gain: +{formatINR(sipProjection.wealthGain)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {catType === 'emergency' && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-1 text-xs font-serif">
                      <div className="flex items-center justify-between font-bold text-rose-950 dark:text-rose-300">
                        <span>Runway Coverage:</span>
                        <span className="font-black font-mono text-rose-800 dark:text-rose-400">
                          {runwayCoverage.toFixed(1)} months saved
                        </span>
                      </div>
                      <div className="text-[10px] font-serif text-stone-600 dark:text-stone-400">
                        Target Reserve: {formatINR(goal.target_amount)}
                      </div>
                    </div>
                  )}

                  {(catType === 'travel' || catType === 'purchase') && goal.deadline && (
                    <div className="mt-3 p-3 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900/60 space-y-1 text-xs font-serif">
                      <div className="flex items-center justify-between font-bold text-cyan-950 dark:text-cyan-300">
                        <span>Voyage Date: {goal.deadline}</span>
                        <span className="font-black font-mono text-cyan-900 dark:text-cyan-400">
                          {monthsLeft} mos left
                        </span>
                      </div>
                      {linearNeeded > 0 && (
                        <div className="text-[11px] font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between pt-0.5">
                          <span>Required: {formatINR(linearNeeded)}/mo</span>
                          <span className="font-mono text-stone-900 dark:text-stone-100 font-bold">Plan: {formatINR(goal.monthly_contribution)}/mo</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between text-[11px] font-serif font-semibold text-stone-600 dark:text-stone-400 mt-2.5">
                    <span>{isDone ? 'Matured & Sealed ✓' : `${formatINR(remaining)} to target`}</span>
                    {goal.monthly_contribution > 0 && (
                      <span className="font-bold font-mono text-emerald-800 dark:text-emerald-400">
                        +{formatINR(goal.monthly_contribution)}/mo
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Add / Withdraw Actions - Vintage Stamp Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-amber-800/20 dark:border-stone-800 font-serif">
                  <button
                    onClick={() => {
                      setContributeGoal(goal);
                      setContributeType('deposit');
                      setContributeAmount('');
                    }}
                    className="flex-1 py-2 px-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all shadow-xs"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>+ Deposit</span>
                  </button>

                  <button
                    onClick={() => {
                      setContributeGoal(goal);
                      setContributeType('withdraw');
                      setContributeAmount('');
                    }}
                    className="py-2 px-3 rounded-lg bg-[#faf6ed] hover:bg-amber-100 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-bold border border-amber-800/40 dark:border-stone-700 flex items-center justify-center gap-1 active:scale-95 transition-all shadow-xs"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-700" />
                    <span>- Withdraw</span>
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

      {/* Contribution / Withdrawal Modal - 1940s Treasury Voucher */}
      {contributeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#fcf8ed] dark:bg-[#1a1714] rounded-2xl max-w-sm w-full p-6 shadow-2xl border-2 border-double border-amber-800/60 dark:border-amber-700/50 space-y-4 font-serif">
            <div className="flex items-center justify-between border-b border-amber-800/20 pb-2">
              <h3 className="text-base font-black font-serif text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                <span>{contributeType === 'deposit' ? '💵' : '📜'}</span>
                <span>{contributeType === 'deposit' ? 'Treasury Deposit Voucher' : 'Withdrawal Debit Voucher'}</span>
              </h3>
              <button
                onClick={() => setContributeGoal(null)}
                className="text-stone-500 hover:text-stone-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-700 dark:text-stone-300 font-serif">
              Target Vault: <strong className="text-amber-950 dark:text-amber-200">{contributeGoal.name}</strong>
            </p>

            <form onSubmit={handleContribution} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-stone-200 mb-1">
                  Voucher Amount (₹) *
                </label>
                <input
                  type="number"
                  autoFocus
                  required
                  placeholder="5000"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-stone-900 border border-amber-800/40 dark:border-stone-700 font-mono font-bold text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-stone-200 mb-1">
                  Ledger Memo / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly SIP transfer, Bonus, Flight tickets"
                  value={contributeNote}
                  onChange={(e) => setContributeNote(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-stone-900 border border-amber-800/40 dark:border-stone-700 font-serif text-stone-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="flex-1 py-2 rounded-lg border border-amber-800/40 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-amber-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-2 rounded-lg text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 ${
                    contributeType === 'deposit'
                      ? 'bg-emerald-800 hover:bg-emerald-900'
                      : 'bg-rose-800 hover:bg-rose-900'
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
