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
    <div className="w-full bg-[#fcf8ed] dark:bg-[#181410] rounded-3xl p-5 sm:p-7 border-2 border-double border-amber-700/50 dark:border-amber-600/40 shadow-xl space-y-6 text-stone-900 dark:text-amber-100">
      {/* 1. MASTER 1940s VINTAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b-2 border-double border-amber-800/30 dark:border-amber-700/40">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-900/30 text-2xl shrink-0 font-serif border border-amber-500/40">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 dark:text-amber-400 font-serif">
                ★ CENTRAL TREASURY LEDGER ★
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200/90 text-amber-950 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-serif">
                Est. 1940
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-950 dark:text-amber-50 tracking-tight font-serif mt-0.5">
              1940s Wealth & Capital Portfolio
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-serif italic mt-0.5">
              Sovereign balance of liquid cash, defense reserves, and compounded enterprise assets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenAddModal('investment')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-700 active:scale-95 text-white text-xs font-black font-serif shadow-md transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ New Wealth Asset</span>
          </button>

          <Link
            href="/goals"
            className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-amber-700/40 text-stone-900 dark:text-amber-200 text-xs font-bold font-serif hover:bg-amber-100/60 dark:hover:bg-stone-800 transition-colors"
          >
            <span>Portfolio Command</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. TOP 4 COLORFUL 1940s BANKNOTE CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Imperial Gilded Gold - Total Net Wealth */}
        <div className="bg-gradient-to-br from-amber-100/90 via-amber-50 to-white dark:from-stone-900 dark:via-amber-950/40 dark:to-stone-950 rounded-2xl p-4 sm:p-5 border-2 border-amber-600/60 dark:border-amber-500/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 dark:text-amber-300 font-serif">
              ⚜️ Net Wealth
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300 font-mono">
              TOTAL
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-100 tracking-tight font-mono">
              {formatINR(breakdown.totalNetWealth)}
            </div>
            <div className="text-[10px] font-bold text-amber-800/80 dark:text-amber-400/80 mt-1 font-serif">
              Cash + Reserves + Invested
            </div>
          </div>
        </div>

        {/* Card 2: 1940s Banknote Mint Green - Liquid Treasury Cash */}
        <div className="bg-gradient-to-br from-emerald-100/90 via-emerald-50 to-white dark:from-stone-900 dark:via-emerald-950/40 dark:to-stone-950 rounded-2xl p-4 sm:p-5 border-2 border-emerald-600/60 dark:border-emerald-500/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-300 font-serif">
              💵 Treasury Cash
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 border border-emerald-300 font-mono">
              LIQUID
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-300 tracking-tight font-mono">
              {formatINR(breakdown.liquidCash)}
            </div>
            <div className="text-[10px] font-bold text-emerald-800/80 dark:text-emerald-400/80 mt-1 font-serif">
              {breakdown.cashPercentage.toFixed(1)}% ratio · Free in hand
            </div>
          </div>
        </div>

        {/* Card 3: Wartime Defense Crimson - Safety Reserves */}
        <div className="bg-gradient-to-br from-rose-100/90 via-rose-50 to-white dark:from-stone-900 dark:via-rose-950/40 dark:to-stone-950 rounded-2xl p-4 sm:p-5 border-2 border-rose-600/60 dark:border-rose-500/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-950 dark:text-rose-300 font-serif">
              🛡️ Defense Reserve
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-200 text-rose-900 border border-rose-300 font-mono">
              SAFETY
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-rose-900 dark:text-rose-300 tracking-tight font-mono">
              {formatINR(breakdown.totalSavings)}
            </div>
            <div className="text-[10px] font-bold text-rose-800/80 dark:text-rose-400/80 mt-1 font-serif">
              {breakdown.savingsPercentage.toFixed(1)}% ratio · Emergency net
            </div>
          </div>
        </div>

        {/* Card 4: Royal Navy Fountain Blue - Compounded Enterprise Equities */}
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
              {formatINR(breakdown.totalInvestments)}
            </div>
            <div className="text-[10px] font-bold text-blue-800/80 dark:text-blue-400/80 mt-1 font-serif">
              {breakdown.investmentsPercentage.toFixed(1)}% ratio · SIPs & Stocks
            </div>
          </div>
        </div>
      </div>

      {/* 3. TRI-PILLAR WEALTH RATIO SPECTRUM BAR - 1940s BANKNOTE CURRENCY GAUGE */}
      <div className="bg-[#fcfaf2] dark:bg-[#1a1714] rounded-2xl p-4 sm:p-5 border-2 border-double border-amber-800/40 dark:border-amber-700/40 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
          <span className="font-black text-stone-900 dark:text-stone-100 flex items-center gap-2 font-serif text-sm">
            <Scale className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>Treasury Ratio · Liquid Cash vs Dedicated Reserves vs Compounded Equities</span>
          </span>
          <span className="text-[11px] font-mono font-bold text-amber-950 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-300/80">
            Total Capital: {formatINR(breakdown.totalNetWealth)}
          </span>
        </div>

        {/* The Vintage Engraved Multi-Segment Spectrum Bar */}
        <div className="h-4.5 w-full rounded-full bg-stone-200/80 dark:bg-stone-800 p-0.5 overflow-hidden flex gap-1 shadow-inner border border-amber-800/30">
          {breakdown.cashPercentage > 0 && (
            <div
              style={{ width: `${breakdown.cashPercentage}%` }}
              className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
              title={`Cash: ${formatINR(breakdown.liquidCash)} (${breakdown.cashPercentage.toFixed(1)}%)`}
            />
          )}
          {breakdown.savingsPercentage > 0 && (
            <div
              style={{ width: `${breakdown.savingsPercentage}%` }}
              className="bg-amber-600 dark:bg-amber-500 h-full rounded-full transition-all duration-500 shadow-sm"
              title={`Savings: ${formatINR(breakdown.totalSavings)} (${breakdown.savingsPercentage.toFixed(1)}%)`}
            />
          )}
          {breakdown.investmentsPercentage > 0 && (
            <div
              style={{ width: `${breakdown.investmentsPercentage}%` }}
              className="bg-blue-700 dark:bg-blue-600 h-full rounded-full transition-all duration-500 shadow-sm"
              title={`Investments: ${formatINR(breakdown.totalInvestments)} (${breakdown.investmentsPercentage.toFixed(1)}%)`}
            />
          )}
        </div>

        {/* Legend beneath the spectrum bar - 1940s Vintage Banknote Palette */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-serif font-bold">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block shrink-0 border border-emerald-800" />
            <span className="text-stone-800 dark:text-stone-300">
              💵 Legal Tender Cash: <strong className="font-mono text-emerald-800 dark:text-emerald-400">{formatINR(breakdown.liquidCash)}</strong> ({breakdown.cashPercentage.toFixed(1)}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-600 inline-block shrink-0 border border-amber-800" />
            <span className="text-stone-800 dark:text-stone-300">
              🛡️ Treasury Reserves: <strong className="font-mono text-amber-800 dark:text-amber-400">{formatINR(breakdown.totalSavings)}</strong> ({breakdown.savingsPercentage.toFixed(1)}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-700 inline-block shrink-0 border border-blue-900" />
            <span className="text-stone-800 dark:text-stone-300">
              📈 Enterprise Equities: <strong className="font-mono text-blue-800 dark:text-blue-400">{formatINR(breakdown.totalInvestments)}</strong> ({breakdown.investmentsPercentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* 4. THE 3 DEEP-DIVE PILLAR BREAKDOWN CARDS - 1940s Colorful Banknote Editions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: 💵 Legal Tender Cash Deep Dive */}
        <div className="bg-gradient-to-br from-[#f0f9f4] via-[#f7fcf9] to-[#e6f4ea] dark:from-[#0d1f14] dark:via-[#13281c] dark:to-[#0a180f] rounded-2xl p-5 border-2 border-emerald-700/50 dark:border-emerald-600/40 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💵</span>
                <div>
                  <span className="block text-[9px] font-black uppercase tracking-wider text-emerald-900/80 dark:text-emerald-300/80 font-mono">
                    Series 1940 · Inflow & Liquidity
                  </span>
                  <h3 className="font-serif font-black text-sm text-emerald-950 dark:text-emerald-100">
                    Liquid Cash Position
                  </h3>
                </div>
              </div>
              <span className="text-[9px] font-black font-mono px-2 py-0.5 rounded bg-emerald-200/90 text-emerald-950 border border-emerald-400/80 shadow-xs">
                {breakdown.cashPercentage.toFixed(0)}% SHARE
              </span>
            </div>

            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-300 font-mono tracking-tight">
              {formatINR(breakdown.liquidCash)}
            </div>

            <div className="space-y-1.5 text-xs pt-2 border-t border-emerald-300/60 dark:border-emerald-900/60 font-serif">
              <div className="flex justify-between font-semibold text-emerald-950 dark:text-emerald-300/90">
                <span>Monthly Inflow (Salary):</span>
                <span className="font-bold font-mono text-emerald-900 dark:text-emerald-200">{formatINR(income)}</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-900/90 dark:text-emerald-300/90">
                <span>- Committed Reserves (SIP/Goals):</span>
                <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  -{formatINR(breakdown.totalMonthlyCommitted)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-900/90 dark:text-emerald-300/90">
                <span>- Disbursed Living Expenses:</span>
                <span className="font-bold font-mono text-rose-700 dark:text-rose-400">-{formatINR(totalSpent)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-950 dark:text-emerald-100 pt-1.5 border-t border-emerald-300/60 dark:border-emerald-900/60">
                <span>Unallocated Free Cash:</span>
                <span className="font-black font-mono text-emerald-800 dark:text-emerald-300">
                  {formatINR(breakdown.operationalCashSurplus)}
                </span>
              </div>
              {breakdown.cashVaults > 0 && (
                <div className="flex justify-between font-semibold text-emerald-900/80 dark:text-emerald-300/80">
                  <span>+ Cash in Hand Vaults:</span>
                  <span className="font-bold font-mono text-emerald-950 dark:text-emerald-200">{formatINR(breakdown.cashVaults)}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddModal('cash')}
            className="w-full py-2.5 rounded-xl text-xs font-black bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 font-serif"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Charter Cash / Bank Vault</span>
          </button>
        </div>

        {/* Pillar 2: 🛡️ Treasury Defense Reserves Deep Dive */}
        <div className="bg-gradient-to-br from-[#fdfbf6] via-[#faf5e8] to-[#f5ebd6] dark:from-[#211a12] dark:via-[#261f16] dark:to-[#1a140d] rounded-2xl p-5 border-2 border-amber-700/60 dark:border-amber-600/40 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <div>
                  <span className="block text-[9px] font-black uppercase tracking-wider text-amber-900/80 dark:text-amber-300/80 font-mono">
                    War Bond Standard · Security
                  </span>
                  <h3 className="font-serif font-black text-sm text-amber-950 dark:text-amber-100">
                    Dedicated Savings Reserves
                  </h3>
                </div>
              </div>
              <span className="text-[9px] font-black font-mono px-2 py-0.5 rounded bg-amber-200 text-amber-950 border border-amber-400/80 shadow-xs">
                {breakdown.savingsPercentage.toFixed(0)}% SHARE
              </span>
            </div>

            <div className="text-2xl font-black text-amber-900 dark:text-amber-300 font-mono tracking-tight">
              {formatINR(breakdown.totalSavings)}
            </div>

            <div className="space-y-1.5 text-xs pt-2 border-t border-amber-300/70 dark:border-amber-900/60 font-serif">
              <div className="flex justify-between font-semibold text-amber-950 dark:text-amber-300/90">
                <span>Emergency Safety Net:</span>
                <span className="font-bold font-mono text-amber-900 dark:text-amber-200">{formatINR(breakdown.emergencyFunds)}</span>
              </div>
              <div className="flex justify-between font-semibold text-amber-900/90 dark:text-amber-300/90">
                <span>Runway Coverage (Full Burn):</span>
                <span className="font-black font-mono text-amber-800 dark:text-amber-400">
                  {breakdown.emergencyRunwayMonths > 0 ? `${breakdown.emergencyRunwayMonths.toFixed(1)} months` : '0 months'}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-amber-900/90 dark:text-amber-300/90">
                <span>Travel & Voyage Funds:</span>
                <span className="font-bold font-mono text-cyan-800 dark:text-cyan-400">{formatINR(breakdown.travelSavings)}</span>
              </div>
              <div className="flex justify-between font-semibold text-amber-900/90 dark:text-amber-300/90">
                <span>Capital Purchase Reserves:</span>
                <span className="font-bold font-mono text-amber-800 dark:text-amber-400">{formatINR(breakdown.goalPurchases)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddModal('emergency')}
            className="w-full py-2.5 rounded-xl text-xs font-black bg-amber-800 hover:bg-amber-900 text-white shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 font-serif"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Issue Emergency / Trip Bond</span>
          </button>
        </div>

        {/* Pillar 3: 📈 Enterprise Stock Certificates Deep Dive */}
        <div className="bg-gradient-to-br from-[#f2f6fc] via-[#f7faff] to-[#e3edfc] dark:from-[#0d172a] dark:via-[#111e38] dark:to-[#091122] rounded-2xl p-5 border-2 border-blue-800/50 dark:border-blue-700/40 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📈</span>
                <div>
                  <span className="block text-[9px] font-black uppercase tracking-wider text-blue-900/80 dark:text-blue-300/80 font-mono">
                    Wall St. & Commonwealth Equities
                  </span>
                  <h3 className="font-serif font-black text-sm text-blue-950 dark:text-blue-100">
                    Compounded Investments
                  </h3>
                </div>
              </div>
              <span className="text-[9px] font-black font-mono px-2 py-0.5 rounded bg-blue-200 text-blue-950 border border-blue-300 shadow-xs">
                {breakdown.investmentsPercentage.toFixed(0)}% SHARE
              </span>
            </div>

            <div className="text-2xl font-black text-blue-900 dark:text-blue-300 font-mono tracking-tight">
              {formatINR(breakdown.totalInvestments)}
            </div>

            <div className="space-y-1.5 text-xs pt-2 border-t border-blue-200/80 dark:border-blue-900/60 font-serif">
              <div className="flex justify-between font-semibold text-blue-950 dark:text-blue-300/90">
                <span>Principal Capital Held:</span>
                <span className="font-bold font-mono text-blue-950 dark:text-blue-200">{formatINR(breakdown.totalInvestments)}</span>
              </div>
              <div className="flex justify-between font-semibold text-blue-900/90 dark:text-blue-300/90">
                <span>Active Enterprise Portfolios:</span>
                <span className="font-bold font-mono text-blue-950 dark:text-blue-200">{breakdown.investmentCount} vaults</span>
              </div>
              <div className="flex justify-between font-bold text-blue-950 dark:text-blue-100 pt-1 border-t border-blue-200/80 dark:border-blue-900/60">
                <span>Committed Monthly SIP:</span>
                <span className="font-black font-mono text-emerald-700 dark:text-emerald-400">
                  +{formatINR(breakdown.totalMonthlySIP)}/mo
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-blue-900/80 dark:text-blue-400/80">
                <span>Automated Compounding:</span>
                <span className="font-bold text-blue-800 dark:text-blue-300">Audited through 2036+</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddModal('investment')}
            className="w-full py-2.5 rounded-xl text-xs font-black bg-blue-900 hover:bg-blue-950 text-white shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 font-serif"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Underwrite Mutual Fund / SIP</span>
          </button>
        </div>
      </div>

      {/* 5. VINTAGE LEDGER FILTER TABS & VAULT CARDS */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-double border-amber-800/40 dark:border-stone-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none font-serif">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              selectedFilter === 'all'
                ? 'bg-amber-900 dark:bg-amber-100 text-amber-50 dark:text-amber-950 shadow-sm border border-amber-950'
                : 'bg-[#faf6ed] dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white border border-amber-800/30 dark:border-stone-800'
            }`}
          >
            All Vaults ({goals.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('cash')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              selectedFilter === 'cash'
                ? 'bg-emerald-800 text-white shadow-sm border border-emerald-950'
                : 'bg-[#faf6ed] dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white border border-amber-800/30 dark:border-stone-800'
            }`}
          >
            <span>💵 Cash Vaults</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('investment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              selectedFilter === 'investment'
                ? 'bg-blue-900 text-white shadow-sm border border-blue-950'
                : 'bg-[#faf6ed] dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white border border-amber-800/30 dark:border-stone-800'
            }`}
          >
            <span>📈 Equities & SIP</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('emergency')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              selectedFilter === 'emergency'
                ? 'bg-amber-800 text-white shadow-sm border border-amber-950'
                : 'bg-[#faf6ed] dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white border border-amber-800/30 dark:border-stone-800'
            }`}
          >
            <span>🛡️ War Reserves</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('travel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              selectedFilter === 'travel'
                ? 'bg-cyan-800 text-white shadow-sm border border-cyan-950'
                : 'bg-[#faf6ed] dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white border border-amber-800/30 dark:border-stone-800'
            }`}
          >
            <span>✈️ Voyage Fund</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('purchase')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              selectedFilter === 'purchase'
                ? 'bg-rose-900 text-white shadow-sm border border-rose-950'
                : 'bg-[#faf6ed] dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white border border-amber-800/30 dark:border-stone-800'
            }`}
          >
            <span>🎯 Acquisitions</span>
          </button>
        </div>

        <div className="text-xs font-bold font-serif text-amber-950 dark:text-amber-300">
          Showing {filteredGoals.length} of {goals.length} registered vaults
        </div>
      </div>

      {/* 6. INDIVIDUAL VAULT CARDS - 1940s Banknote & Share Certificate Styling */}
      {filteredGoals.length === 0 ? (
        <div className="bg-[#fcf8ed] dark:bg-[#1a1714] rounded-3xl p-8 border-2 border-dashed border-amber-800/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-800 dark:text-amber-400 mx-auto border border-amber-300">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-black text-sm text-stone-900 dark:text-stone-100">
              {selectedFilter === 'all'
                ? 'No Savings or Investment Vaults Registered'
                : `No ${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Vaults Found`}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto font-serif mt-1">
              Issue a certificate for liquid cash in hand, 6-month defense runway, or auto-compounded mutual fund SIP.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-1 font-serif">
            <button
              type="button"
              onClick={() => handleOpenAddModal('cash')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition-colors shadow-xs"
            >
              + Cash in Hand
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('emergency')}
              className="px-3.5 py-1.5 rounded-lg bg-amber-800 text-white text-xs font-bold hover:bg-amber-900 transition-colors shadow-xs"
            >
              + Defense Runway
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('investment')}
              className="px-3.5 py-1.5 rounded-lg bg-blue-900 text-white text-xs font-bold hover:bg-blue-950 transition-colors shadow-xs"
            >
              + Equities SIP
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('travel')}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-800 text-white text-xs font-bold hover:bg-cyan-900 transition-colors shadow-xs"
            >
              + Voyage Fund
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
                className="p-4 sm:p-5 rounded-2xl bg-[#fdfbf6] dark:bg-[#1c1815] border-2 border-double border-amber-800/40 dark:border-amber-700/30 shadow-sm flex flex-col justify-between space-y-3.5 hover:border-amber-600 dark:hover:border-amber-500 transition-all relative overflow-hidden"
              >
                {/* 1940s Vintage Watermark Serial */}
                <div className="absolute top-2 right-12 text-[8px] font-mono text-amber-900/40 dark:text-amber-500/30 tracking-widest pointer-events-none select-none">
                  SERIES 1940 · #{goal.id.slice(0, 6).toUpperCase()}
                </div>

                <div>
                  {/* Top line: Badge, institution, Edit & Delete */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded border shadow-xs ${badge.badgeBg} ${badge.borderBg}`}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>

                      {goal.institution && (
                        <span className="text-[10px] font-bold font-serif text-stone-600 dark:text-stone-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-amber-700" />
                          <span>{goal.institution}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(goal)}
                        title="Edit Vault & Calculations"
                        className="p-1 rounded text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-amber-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal.id, goal.name)}
                        title="Delete Vault"
                        className="p-1 rounded text-stone-500 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-serif font-black text-base text-stone-900 dark:text-stone-100 truncate tracking-tight">
                    {goal.name}
                  </h3>

                  {/* Current Balance & Target Amount */}
                  <div className="mt-2 flex items-baseline justify-between">
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-stone-900 dark:text-stone-100 tracking-tight">
                        {formatINR(goal.current_amount)}
                      </div>
                      <div className="text-[11px] font-mono text-stone-600 dark:text-stone-400 font-bold">
                        Target: {formatINR(goal.target_amount)}
                      </div>
                    </div>

                    <span
                      className={`text-xs font-black font-mono px-2 py-0.5 rounded border ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-stone-800 dark:text-stone-300'
                      }`}
                    >
                      {pct.toFixed(0)}%
                    </span>
                  </div>

                  {/* Engraved Progress Bar */}
                  <div className="w-full bg-stone-200 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden mt-2.5 border border-amber-800/30 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        catType === 'cash'
                          ? 'bg-emerald-600'
                          : catType === 'investment'
                          ? 'bg-blue-700'
                          : catType === 'emergency'
                          ? 'bg-amber-600'
                          : catType === 'travel'
                          ? 'bg-cyan-600'
                          : 'bg-rose-700'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                    />
                  </div>

                  {/* DYNAMIC FINANCIAL INTELLIGENCE AUTO-CALCULATION BLOCK - Parchment Inset */}
                  {catType === 'investment' && goal.deadline && sipProjection && (
                    <div className="mt-3 p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-1 text-[11px] font-serif">
                      <div className="flex items-center justify-between font-bold text-blue-950 dark:text-blue-300">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-blue-700" />
                          <span>Horizon: {goal.deadline}</span>
                        </span>
                        <span className="font-black font-mono text-blue-900 dark:text-blue-400">
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
                        <div className="text-[10px] font-bold text-stone-600 dark:text-stone-400 flex items-center justify-between pt-0.5">
                          <span>Monthly SIP: {formatINR(goal.monthly_contribution)}/mo</span>
                          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">Gain: +{formatINR(sipProjection.wealthGain)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {catType === 'emergency' && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1 text-[11px] font-serif">
                      <div className="flex items-center justify-between font-bold text-amber-950 dark:text-amber-300">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-700" />
                          <span>Runway Coverage:</span>
                        </span>
                        <span className="font-black font-mono text-amber-900 dark:text-amber-400">
                          {runwayCoverage.toFixed(1)} months saved
                        </span>
                      </div>
                      <div className="text-[10px] font-serif text-stone-600 dark:text-stone-400">
                        Living expense base: {formatINR(monthlyBurnRate > 0 ? monthlyBurnRate : 40000)}/mo
                      </div>
                    </div>
                  )}

                  {(catType === 'travel' || catType === 'purchase') && goal.deadline && (
                    <div className="mt-3 p-2.5 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900/60 space-y-1 text-[11px] font-serif">
                      <div className="flex items-center justify-between font-bold text-cyan-950 dark:text-cyan-300">
                        <span className="flex items-center gap-1">
                          <Plane className="w-3 h-3 text-cyan-700" />
                          <span>Voyage Date: {goal.deadline}</span>
                        </span>
                        <span className="font-black font-mono text-cyan-900 dark:text-cyan-400">
                          {monthsLeft} mos left
                        </span>
                      </div>
                      {linearNeeded > 0 && (
                        <div className="text-[10px] font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between pt-0.5">
                          <span>Target: {formatINR(linearNeeded)}/mo</span>
                          <span className="font-mono text-stone-900 dark:text-stone-100 font-bold">{formatINR(goal.monthly_contribution)}/mo</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Quick Action Deposit / Withdraw - Vintage Engraved Stamp Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-amber-800/20 dark:border-stone-800 font-serif">
                  <button
                    type="button"
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
                    type="button"
                    onClick={() => {
                      setContributeGoal(goal);
                      setContributeType('withdraw');
                      setContributeAmount('');
                    }}
                    className="flex-1 py-2 px-2 rounded-lg bg-[#faf6ed] hover:bg-amber-100 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-bold border border-amber-800/40 dark:border-stone-700 flex items-center justify-center gap-1 active:scale-95 transition-all shadow-xs"
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
