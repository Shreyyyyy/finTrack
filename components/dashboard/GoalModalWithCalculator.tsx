'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  TrendingUp,
  ShieldCheck,
  Plane,
  Target,
  Sparkles,
  Building2,
  Calendar,
  Lock,
  ArrowRight,
  Info,
  Calculator,
  Percent,
} from 'lucide-react';
import { Goal, GoalCategoryType } from '@/types';
import { saveGoal } from '@/lib/data/store';
import { formatINR } from '@/lib/formatting/formatters';
import {
  calculateMonthsRemaining,
  formatMonthsDuration,
  calculateSIPFutureValue,
  calculateRequiredMonthlySIP,
  calculateEmergencyTarget,
  calculateEmergencyRunway,
  calculateLinearRequiredMonthly,
} from '@/lib/calculations/wealthCalculator';
import { getGoalCategoryType } from '@/lib/formatting/savingsHelpers';
import { showToast } from '@/components/ui/Toast';

interface GoalModalWithCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  initialGoal?: Goal | null;
  presetCategory?: GoalCategoryType;
  monthlyBurnRate?: number;
}

const CATEGORIES: Array<{
  id: GoalCategoryType;
  label: string;
  icon: string;
  tagline: string;
}> = [
  { id: 'investment', label: 'Investments & MF', icon: '📈', tagline: 'SIP, Mutual Funds, Stocks, Gold' },
  { id: 'emergency', label: 'Emergency Fund', icon: '🛡️', tagline: '3-12 months living expense runway' },
  { id: 'travel', label: 'Travel & Trips', icon: '✈️', tagline: 'Vacations, flights, hotel savings' },
  { id: 'purchase', label: 'Dream Goals', icon: '🎯', tagline: 'Car, gadgets, home milestone' },
];

const CAGR_PRESETS = [
  { label: '12% (Equity MF)', value: 12 },
  { label: '14% (Aggressive MF)', value: 14 },
  { label: '8% (Conservative/Debt)', value: 8 },
  { label: '0% (Linear Savings)', value: 0 },
];

export function GoalModalWithCalculator({
  isOpen,
  onClose,
  onSaved,
  initialGoal,
  presetCategory = 'investment',
  monthlyBurnRate = 0,
}: GoalModalWithCalculatorProps) {
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GoalCategoryType>(presetCategory);
  const [institution, setInstitution] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetAmount, setTargetAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [deadline, setDeadline] = useState('');
  const [expectedCagr, setExpectedCagr] = useState<number>(12);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Investment calculation direction
  const [calcDirection, setCalcDirection] = useState<'sip_to_target' | 'target_to_sip'>(
    'sip_to_target'
  );

  // Emergency runway state
  const [emergencyBurnRate, setEmergencyBurnRate] = useState<number>(
    monthlyBurnRate > 0 ? monthlyBurnRate : 40000
  );
  const [emergencyRunwayMonths, setEmergencyRunwayMonths] = useState<number>(6);

  // Populate initial goal when opening
  useEffect(() => {
    if (initialGoal) {
      setName(initialGoal.name);
      setCategory(getGoalCategoryType(initialGoal));
      setInstitution(initialGoal.institution || '');
      setCurrentAmount(String(initialGoal.current_amount || 0));
      setTargetAmount(String(initialGoal.target_amount || ''));
      setMonthlyContribution(String(initialGoal.monthly_contribution || ''));
      setDeadline(initialGoal.deadline || '');
      setExpectedCagr(initialGoal.expected_cagr ?? 12);
    } else {
      setName('');
      setCategory(presetCategory);
      setInstitution('');
      setCurrentAmount('0');
      setTargetAmount('');
      setMonthlyContribution('');
      setDeadline('');
      setExpectedCagr(12);
      setCalcDirection('sip_to_target');
    }
  }, [initialGoal, presetCategory, isOpen]);

  // Update burn rate if prop changes and not custom
  useEffect(() => {
    if (monthlyBurnRate > 0) {
      setEmergencyBurnRate(monthlyBurnRate);
    }
  }, [monthlyBurnRate]);

  // Calculations for Investment SIP
  const monthsRemaining = useMemo(
    () => calculateMonthsRemaining(deadline),
    [deadline]
  );

  const sipProjection = useMemo(() => {
    const p = parseFloat(monthlyContribution) || 0;
    const pv = parseFloat(currentAmount) || 0;
    return calculateSIPFutureValue({
      monthlyInvestment: p,
      months: monthsRemaining,
      annualRatePct: expectedCagr,
      currentAmount: pv,
    });
  }, [monthlyContribution, monthsRemaining, expectedCagr, currentAmount]);

  // Auto-update Target Amount when in 'sip_to_target' mode for Investments
  useEffect(() => {
    if (category === 'investment' && calcDirection === 'sip_to_target' && deadline) {
      if (sipProjection.estimatedMaturity > 0) {
        setTargetAmount(String(sipProjection.estimatedMaturity));
      }
    }
  }, [sipProjection.estimatedMaturity, category, calcDirection, deadline]);

  // When in 'target_to_sip' mode, calculate required SIP
  const requiredMonthlySIP = useMemo(() => {
    const target = parseFloat(targetAmount) || 0;
    const pv = parseFloat(currentAmount) || 0;
    return calculateRequiredMonthlySIP({
      targetAmount: target,
      months: monthsRemaining,
      annualRatePct: expectedCagr,
      currentAmount: pv,
    });
  }, [targetAmount, monthsRemaining, expectedCagr, currentAmount]);

  // When changing target in 'target_to_sip' mode, auto-update monthly contribution
  const handleTargetAmountChange = (val: string) => {
    setTargetAmount(val);
    if (category === 'investment' && calcDirection === 'target_to_sip' && deadline) {
      const target = parseFloat(val) || 0;
      const pv = parseFloat(currentAmount) || 0;
      const needed = calculateRequiredMonthlySIP({
        targetAmount: target,
        months: monthsRemaining,
        annualRatePct: expectedCagr,
        currentAmount: pv,
      });
      if (needed > 0) {
        setMonthlyContribution(String(needed));
      }
    }
  };

  // Emergency Runway Calculations
  const currentRunwaySaved = useMemo(() => {
    const cur = parseFloat(currentAmount) || 0;
    return calculateEmergencyRunway({
      currentAmount: cur,
      monthlyBurn: emergencyBurnRate,
    });
  }, [currentAmount, emergencyBurnRate]);

  const handleApplyEmergencyPreset = (months: number) => {
    setEmergencyRunwayMonths(months);
    const target = calculateEmergencyTarget({
      monthlyBurn: emergencyBurnRate,
      monthsRunway: months,
    });
    setTargetAmount(String(target));
    if (!name.trim()) {
      setName(`${months}-Month Emergency Fund`);
    }
    // If deadline set, auto-calc monthly savings
    if (deadline && monthsRemaining > 0) {
      const cur = parseFloat(currentAmount) || 0;
      const neededMonthly = calculateLinearRequiredMonthly({
        targetAmount: target,
        currentAmount: cur,
        months: monthsRemaining,
      });
      setMonthlyContribution(String(neededMonthly));
    }
  };

  // Linear required monthly for Travel/Purchase
  const linearNeededMonthly = useMemo(() => {
    const target = parseFloat(targetAmount) || 0;
    const cur = parseFloat(currentAmount) || 0;
    return calculateLinearRequiredMonthly({
      targetAmount: target,
      currentAmount: cur,
      months: monthsRemaining,
    });
  }, [targetAmount, currentAmount, monthsRemaining]);

  // Auto-sync monthly savings for travel/purchase when deadline or target changes
  const handleApplyLinearCalculation = () => {
    if (linearNeededMonthly > 0) {
      setMonthlyContribution(String(linearNeededMonthly));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a fund name', 'error');
      return;
    }

    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      showToast('Please enter or calculate a target amount', 'error');
      return;
    }

    const current = parseFloat(currentAmount) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;

    setIsSubmitting(true);
    try {
      await saveGoal({
        id: initialGoal?.id,
        name: name.trim(),
        category_type: category,
        institution: institution.trim() || undefined,
        target_amount: target,
        current_amount: current,
        deadline: deadline || null,
        monthly_contribution: monthly,
        expected_cagr: category === 'investment' ? expectedCagr : undefined,
        status: current >= target ? 'completed' : 'in_progress',
      });

      showToast(initialGoal ? 'Vault updated ✓' : 'Vault & Plan Created ✓', 'success');
      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to save vault', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-sky-100 dark:border-slate-800 shadow-2xl p-5 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-sky-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
              <Calculator className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-black dark:text-white tracking-tight">
                {initialGoal ? 'Edit Vault & Horizon Plan' : 'Add Savings or Investment Vault'}
              </h2>
              <p className="text-xs text-slate-700 dark:text-slate-400 font-semibold">
                Auto-calculates SIP compounding, target maturity, and emergency runway.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-xl text-slate-400 hover:text-black dark:hover:text-white hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-black text-black dark:text-slate-200 mb-1.5">
              Select Portfolio Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all active:scale-95 ${
                    category === cat.id
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-sky-50/60 dark:bg-slate-800/80 border-sky-100 dark:border-slate-700 text-black dark:text-slate-200 hover:bg-sky-50'
                  }`}
                >
                  <div className="text-lg">{cat.icon}</div>
                  <div className="text-xs font-black mt-1">{cat.label}</div>
                  <div
                    className={`text-[10px] font-medium leading-tight mt-0.5 line-clamp-1 ${
                      category === cat.id ? 'text-sky-100' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cat.tagline}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Name & Institution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-black dark:text-slate-200 mb-1">
                Vault / Fund Name *
              </label>
              <input
                type="text"
                required
                placeholder={
                  category === 'investment'
                    ? 'e.g. Nifty 50 Index SIP, Tech Mutual Fund'
                    : category === 'emergency'
                    ? 'e.g. 6-Month Liquid Safety Net'
                    : category === 'travel'
                    ? 'e.g. Goa Trip, Europe Vacation 2027'
                    : 'e.g. New MacBook Pro, Car Downpayment'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/60 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black dark:text-slate-200 mb-1">
                Platform / Bank (Optional)
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Zerodha, Groww, HDFC, Cash"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-sky-50/60 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Current Saved & Target Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-black dark:text-slate-200 mb-1">
                Current Saved / Invested Balance (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">₹</span>
                <input
                  type="number"
                  min="0"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-sky-50/60 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-black dark:text-slate-200 mb-1">
                Target Deadline / Horizon
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-sky-50/60 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-xs font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              {deadline && (
                <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300 mt-1 flex items-center gap-1">
                  <span>⏱️ Duration:</span>
                  <span>{formatMonthsDuration(monthsRemaining)}</span>
                  <span>({monthsRemaining} months)</span>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================== */}
          {/* SPECIALIZED ENGINE: 1. INVESTMENT & MUTUAL FUND ENGINE      */}
          {/* ========================================================== */}
          {category === 'investment' && (
            <div className="bg-sky-50/80 dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-sky-200/80 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
                    SIP Compound Growth Calculator
                  </span>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Compounded Monthly
                </span>
              </div>

              {/* Expected CAGR Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-black dark:text-slate-200">
                    Expected Annual Return (CAGR %)
                  </label>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {expectedCagr}% per annum
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CAGR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setExpectedCagr(preset.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        expectedCagr === preset.value
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-sky-100 dark:border-slate-600 hover:border-emerald-500'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-lg border border-sky-100 dark:border-slate-600">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={expectedCagr}
                      onChange={(e) => setExpectedCagr(parseFloat(e.target.value) || 0)}
                      className="w-10 text-xs font-bold text-black dark:text-white bg-transparent text-center focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* Calculation Direction Toggle */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-sky-200 dark:border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCalcDirection('sip_to_target')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
                    calcDirection === 'sip_to_target'
                      ? 'bg-sky-600 text-white font-black shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-black'
                  }`}
                >
                  Invest Monthly → Auto-Calculate Target Corpus
                </button>
                <button
                  type="button"
                  onClick={() => setCalcDirection('target_to_sip')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
                    calcDirection === 'target_to_sip'
                      ? 'bg-sky-600 text-white font-black shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-black'
                  }`}
                >
                  Set Target Corpus → Auto-Calculate Monthly SIP
                </button>
              </div>

              {/* Monthly Contribution & Target Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-black dark:text-slate-200">
                      Monthly Investment / SIP (₹) *
                    </label>
                    {calcDirection === 'target_to_sip' && (
                      <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                        (Auto-Calculated)
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="15000"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(e.target.value)}
                      className={`w-full pl-7 pr-3 py-2.5 rounded-xl border text-xs font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        calcDirection === 'target_to_sip'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300'
                          : 'bg-white dark:bg-slate-900 border-sky-200 dark:border-slate-700'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-black dark:text-slate-200">
                      Target Maturity Corpus (₹) *
                    </label>
                    {calcDirection === 'sip_to_target' && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        (Auto-Calculated)
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="3500000"
                      value={targetAmount}
                      onChange={(e) => handleTargetAmountChange(e.target.value)}
                      className={`w-full pl-7 pr-3 py-2.5 rounded-xl border text-xs font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        calcDirection === 'sip_to_target'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300'
                          : 'bg-white dark:bg-slate-900 border-sky-200 dark:border-slate-700'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* LIVE PROJECTION CARD */}
              {deadline && (parseFloat(monthlyContribution) > 0 || parseFloat(targetAmount) > 0) && (
                <div className="bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-blue-500/10 dark:from-emerald-950/40 dark:to-sky-950/40 rounded-2xl p-4 border border-emerald-200/80 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-black text-black dark:text-white">
                        Investment Horizon Summary (Till {deadline})
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-400">
                      {monthsRemaining} Monthly Installments
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/90 dark:bg-slate-900/90 rounded-xl p-2.5 border border-sky-100 dark:border-slate-800">
                      <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Invested Principal
                      </div>
                      <div className="text-xs sm:text-sm font-black text-black dark:text-white mt-0.5">
                        {formatINR(sipProjection.totalInvested)}
                      </div>
                    </div>

                    <div className="bg-white/90 dark:bg-slate-900/90 rounded-xl p-2.5 border border-emerald-100 dark:border-slate-800">
                      <div className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        Estimated Gain
                      </div>
                      <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        +{formatINR(sipProjection.wealthGain)}
                      </div>
                    </div>

                    <div className="bg-white/90 dark:bg-slate-900/90 rounded-xl p-2.5 border border-blue-100 dark:border-slate-800">
                      <div className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                        Projected Corpus
                      </div>
                      <div className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5">
                        {formatINR(sipProjection.estimatedMaturity)}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                    💡 By investing{' '}
                    <span className="font-black text-black dark:text-white">
                      {formatINR(parseFloat(monthlyContribution) || 0)}/month
                    </span>{' '}
                    till <span className="font-black">{deadline}</span> at{' '}
                    <span className="font-black text-emerald-600">{expectedCagr}% CAGR</span>, you
                    will invest a total of{' '}
                    <span className="font-bold">{formatINR(sipProjection.totalInvested)}</span> and
                    grow your wealth to approximately{' '}
                    <span className="font-black text-blue-600 dark:text-blue-400">
                      {formatINR(sipProjection.estimatedMaturity)}
                    </span>
                    .
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* SPECIALIZED ENGINE: 2. EMERGENCY FUND RUNWAY ENGINE        */}
          {/* ========================================================== */}
          {category === 'emergency' && (
            <div className="bg-blue-50/80 dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-blue-200/80 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
                    Emergency Runway Safety Calculator
                  </span>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  Liquid Reserve
                </span>
              </div>

              {/* Monthly Living Expense Baseline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black dark:text-slate-200 mb-1">
                    Monthly Living Expenses / Burn Rate (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">₹</span>
                    <input
                      type="number"
                      min="1000"
                      value={emergencyBurnRate}
                      onChange={(e) => setEmergencyBurnRate(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 text-xs font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mt-1 block">
                    Essential expenses needed per month to survive
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-black text-black dark:text-slate-200 mb-1">
                    Select Target Runway Months
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { months: 3, label: '3 Months', note: 'Basic' },
                      { months: 6, label: '6 Months', note: 'Recommended' },
                      { months: 12, label: '12 Months', note: 'Ultra Safe' },
                    ].map((btn) => (
                      <button
                        key={btn.months}
                        type="button"
                        onClick={() => handleApplyEmergencyPreset(btn.months)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          emergencyRunwayMonths === btn.months
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-sky-100 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        <div className="text-xs font-black">{btn.label}</div>
                        <div
                          className={`text-[9px] font-bold ${
                            emergencyRunwayMonths === btn.months ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          {btn.note}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculated Target & Monthly Plan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black dark:text-slate-200 mb-1">
                    Emergency Fund Target (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      required
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="240000"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 text-xs font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 mt-1 block">
                    = {emergencyRunwayMonths} × {formatINR(emergencyBurnRate)}/mo
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-black text-black dark:text-slate-200 mb-1">
                    Monthly Contribution to Reserve (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(e.target.value)}
                      placeholder="10000"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 text-xs font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {deadline && linearNeededMonthly > 0 && (
                    <button
                      type="button"
                      onClick={handleApplyLinearCalculation}
                      className="text-[10px] font-black text-blue-600 hover:underline mt-1 flex items-center gap-1"
                    >
                      <span>⚡ Auto-fill {formatINR(linearNeededMonthly)}/mo for {monthsRemaining} mos</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Runway Coverage Status */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-blue-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  Current Liquid Coverage:
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-black">
                  {currentRunwaySaved.toFixed(1)} months of {emergencyRunwayMonths} months target saved
                </span>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* SPECIALIZED ENGINE: 3. TRAVEL & DREAM GOALS ENGINE         */}
          {/* ========================================================== */}
          {(category === 'travel' || category === 'purchase' || category === 'other') && (
            <div className="bg-cyan-50/80 dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-cyan-200/80 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
                    {category === 'travel' ? 'Travel & Vacation Fund Calculator' : 'Goal Milestone Pacing'}
                  </span>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                  Linear Target
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black dark:text-slate-200 mb-1">
                    Target Amount Needed (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      required
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="100000"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-cyan-200 dark:border-slate-700 text-xs font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-black dark:text-slate-200 mb-1">
                    Monthly Savings Contribution (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-slate-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(e.target.value)}
                      placeholder="10000"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-cyan-200 dark:border-slate-700 text-xs font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  {deadline && linearNeededMonthly > 0 && (
                    <button
                      type="button"
                      onClick={handleApplyLinearCalculation}
                      className="text-[10px] font-black text-cyan-700 dark:text-cyan-300 hover:underline mt-1 flex items-center gap-1"
                    >
                      <span>⚡ Auto-fill {formatINR(linearNeededMonthly)}/mo for {monthsRemaining} mos</span>
                    </button>
                  )}
                </div>
              </div>

              {deadline && (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-cyan-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ✈️ To reach <span className="font-black text-black dark:text-white">{formatINR(parseFloat(targetAmount) || 0)}</span> by <span className="font-black text-black dark:text-white">{deadline}</span> ({monthsRemaining} months), save <span className="font-black text-cyan-600 dark:text-cyan-400">{formatINR(linearNeededMonthly)}/month</span>.
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-sky-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-sky-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-black shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Saving Vault...' : initialGoal ? 'Update Vault & Plan' : 'Save Vault & Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
