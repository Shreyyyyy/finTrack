'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Zap } from 'lucide-react';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';

export default function AddExpensePage() {
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 md:py-8 text-stone-900 dark:text-amber-100">
      {/* 1940s Header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-double border-amber-800/30 dark:border-amber-700/40">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-serif font-bold text-amber-900 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 transition-colors p-1 -ml-1 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Gazette</span>
        </Link>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-950 text-[10px] font-mono font-bold text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <span>SERIES 1940 · TELLER</span>
        </div>
      </div>

      <div className="mb-6 space-y-1">
        <div className="text-[10px] font-serif font-black uppercase tracking-widest text-amber-900 dark:text-amber-400">
          ★ OFFICIAL DISBURSEMENT & DEPOSIT REGISTER ★
        </div>
        <h1 className="text-2xl font-serif font-black tracking-tight text-stone-950 dark:text-amber-50 flex items-center gap-2">
          Record Ledger Voucher
        </h1>
        <p className="text-xs font-serif italic text-stone-600 dark:text-stone-400">
          Register immediate disbursement or credit funds directly to your 1940s wealth vaults.
        </p>
      </div>

      {/* Expense Form */}
      <ExpenseForm />
    </div>
  );
}
