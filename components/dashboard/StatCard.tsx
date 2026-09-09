'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'emerald' | 'rose' | 'amber';
}

export function StatCard({ label, value, subtext, icon, variant = 'default' }: StatCardProps) {
  const getColors = () => {
    switch (variant) {
      case 'emerald':
        return 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20';
      case 'rose':
        return 'border-rose-200 dark:border-rose-800/80 bg-rose-50/40 dark:bg-rose-950/20';
      case 'amber':
        return 'border-amber-200 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20';
      default:
        return 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
    }
  };

  return (
    <div className={`p-4 rounded-2xl border shadow-sm transition-all ${getColors()}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {icon && <div className="text-slate-400 dark:text-slate-500">{icon}</div>}
      </div>
      <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
        {value}
      </div>
      {subtext && (
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
          {subtext}
        </p>
      )}
    </div>
  );
}
