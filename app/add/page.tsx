'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Zap } from 'lucide-react';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';

export default function AddExpensePage() {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors p-1 -ml-1 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
          <Zap className="w-3.5 h-3.5" />
          <span>Quick Entry (&lt; 5s)</span>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Add Expense
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Record your spending instantly.
        </p>
      </div>

      {/* Expense Form */}
      <ExpenseForm />
    </div>
  );
}
