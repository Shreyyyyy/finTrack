'use client';

import React from 'react';
import { Edit2 } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'emerald' | 'rose' | 'amber';
  onClick?: () => void;
  editable?: boolean;
}

export function StatCard({
  label,
  value,
  subtext,
  icon,
  variant = 'default',
  onClick,
  editable,
}: StatCardProps) {
  const getColors = () => {
    switch (variant) {
      case 'emerald':
        return 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20';
      case 'rose':
        return 'border-rose-200 dark:border-rose-800/80 bg-rose-50/40 dark:bg-rose-950/20';
      case 'amber':
        return 'border-amber-200 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20';
      default:
        return 'border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border shadow-sm transition-all relative group ${getColors()} ${
        onClick
          ? 'cursor-pointer hover:border-sky-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]'
          : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-400 flex items-center gap-1">
          <span>{label}</span>
          {editable && (
            <span className="opacity-60 group-hover:opacity-100 transition-opacity text-[10px] text-sky-600 dark:text-sky-400 font-bold ml-1">
              (tap to edit)
            </span>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          {editable && (
            <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          {icon && <div className="text-slate-600 dark:text-slate-500">{icon}</div>}
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">
        {value}
      </div>
      {subtext && (
        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-400 mt-1">
          {subtext}
        </p>
      )}
    </div>
  );
}
