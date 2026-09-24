import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Expense } from '@/types';
import { formatINR } from '@/lib/formatting/formatters';

interface SubscriptionsRadarCardProps {
  expenses: Expense[];
  income: number;
}

export function SubscriptionsRadarCard({ expenses, income }: SubscriptionsRadarCardProps) {
  // Find recurring expenses or subscription category items
  const recurringItems = expenses.filter(
    (e) => e.is_recurring || e.category?.name.toLowerCase().includes('subscription')
  );

  // Deduplicate by merchant/payee to show current active subscriptions
  const uniqueSubsMap = new Map<string, Expense>();
  recurringItems.forEach((item) => {
    const key = (item.merchant || item.note || item.category?.name || 'Subscription').toLowerCase();
    if (!uniqueSubsMap.has(key)) {
      uniqueSubsMap.set(key, item);
    }
  });

  const uniqueSubs = Array.from(uniqueSubsMap.values());
  const monthlyRecurringTotal = uniqueSubs.reduce((sum, item) => sum + Number(item.amount), 0);
  const incomeShare = income > 0 ? (monthlyRecurringTotal / income) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
              Subscriptions & Fixed Commitments
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {uniqueSubs.length} Active
          </span>
        </div>

        <div className="mt-3 space-y-1">
          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            Monthly Locked Burn
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {formatINR(monthlyRecurringTotal)}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              / mo ({incomeShare.toFixed(1)}% of income)
            </span>
          </div>
        </div>
      </div>

      {/* Subscription List Preview */}
      <div className="space-y-2">
        {uniqueSubs.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500">No recurring subscriptions tagged yet.</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Tag fixed expenses as &quot;Recurring&quot; in the Add Transaction form.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {uniqueSubs.slice(0, 4).map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">{sub.category?.icon || '🔁'}</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {sub.merchant || sub.category?.name || 'Subscription'}
                  </span>
                </div>
                <span className="font-black text-slate-900 dark:text-white shrink-0">
                  {formatINR(sub.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Link */}
      <Link
        href="/transactions"
        className="flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline pt-2 border-t border-slate-100 dark:border-slate-800"
      >
        <span>View all in Transactions</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
