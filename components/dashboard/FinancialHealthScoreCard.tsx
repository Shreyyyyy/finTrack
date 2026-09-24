'use client';

import React from 'react';
import { ShieldCheck, TrendingUp, AlertTriangle, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { formatINR, formatPercentage } from '@/lib/formatting/formatters';

interface FinancialHealthScoreCardProps {
  score: number;
  savingsRate: number;
  budgetUtilization: number;
  needsRatio: number;
  wantsRatio: number;
  recurringTotal: number;
}

export function FinancialHealthScoreCard({
  score,
  savingsRate,
  budgetUtilization,
  needsRatio,
  wantsRatio,
  recurringTotal,
}: FinancialHealthScoreCardProps) {
  // Determine Grade & Tier
  let grade = 'A+';
  let title = 'Elite Financial Health';
  let badgeBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  let ringColor = 'stroke-emerald-500';

  if (score >= 90) {
    grade = 'A+';
    title = 'Elite Financial Fortress';
    badgeBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    ringColor = 'stroke-emerald-400';
  } else if (score >= 75) {
    grade = 'A';
    title = 'Healthy & Balanced';
    badgeBg = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    ringColor = 'stroke-sky-400';
  } else if (score >= 60) {
    grade = 'B';
    title = 'Moderate & Stable';
    badgeBg = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    ringColor = 'stroke-amber-400';
  } else {
    grade = 'C';
    title = 'Needs Optimization';
    badgeBg = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    ringColor = 'stroke-rose-400';
  }

  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Financial Health Score
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badgeBg}`}>
              Grade {grade}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">50/30/20 Deterministic</span>
        </div>

        {/* Big Meter Row */}
        <div className="flex items-center gap-5 mt-4">
          {/* Circular Gauge */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r="38"
                className="stroke-slate-800"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="38"
                className={`${ringColor} transition-all duration-1000 ease-out`}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{score}</span>
              <span className="text-[9px] font-bold text-slate-400">/ 100</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-base font-black text-white">{title}</div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {score >= 75
                ? 'Your savings and essential spending follow prudent financial discipline.'
                : 'Spending pace or lifestyle wants are high relative to inflows.'}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Pillars Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-4 border-t border-slate-800/80">
        <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Savings Rate</div>
          <div className="text-sm font-black text-emerald-400 mt-0.5">
            {formatPercentage(savingsRate)}
          </div>
          <div className="text-[9px] text-slate-500 font-medium">Target: ≥ 20%</div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Budget Used</div>
          <div className={`text-sm font-black mt-0.5 ${budgetUtilization > 100 ? 'text-rose-400' : 'text-sky-400'}`}>
            {formatPercentage(budgetUtilization)}
          </div>
          <div className="text-[9px] text-slate-500 font-medium">Cap: ≤ 100%</div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Needs (50%)</div>
          <div className="text-sm font-black text-indigo-400 mt-0.5">
            {formatPercentage(needsRatio)}
          </div>
          <div className="text-[9px] text-slate-500 font-medium">Ideal: ~50%</div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Fixed Subscriptions</div>
          <div className="text-sm font-black text-amber-400 mt-0.5">
            {formatINR(recurringTotal)}
          </div>
          <div className="text-[9px] text-slate-500 font-medium">Monthly committed</div>
        </div>
      </div>
    </div>
  );
}
