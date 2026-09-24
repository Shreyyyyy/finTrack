'use client';

import React, { useState } from 'react';
import { Expense } from '@/types';
import { formatINR, formatRelativeDate } from '@/lib/formatting/formatters';
import { Trash2, Edit3, CreditCard } from 'lucide-react';
import { deleteExpense } from '@/lib/data/store';
import { showToast } from '@/components/ui/Toast';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';

interface RecentExpensesProps {
  expenses: Expense[];
  limit?: number;
}

export function RecentExpenses({ expenses, limit = 8 }: RecentExpensesProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const displayList = expenses.slice(0, limit);

  // Group by relative date (Today, Yesterday, 7 Sep, etc.)
  const grouped: Record<string, Expense[]> = {};
  displayList.forEach((exp) => {
    const label = formatRelativeDate(exp.expense_date);
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(exp);
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      setDeletingId(id);
      try {
        await deleteExpense(id);
        showToast('Expense deleted ✓', 'info');
      } catch {
        showToast('Failed to delete expense', 'error');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="bg-[#faf6ed] dark:bg-[#1a1510] rounded-3xl p-5 border-2 border-double border-amber-800/30 dark:border-amber-700/40 shadow-sm space-y-4 text-stone-900 dark:text-amber-100">
      <div className="flex items-center justify-between border-b-2 border-double border-amber-800/20 dark:border-amber-700/30 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 dark:text-amber-400 font-serif">
            ★ TELLER VOUCHER REGISTER ★
          </span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-950 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            AUDITED
          </span>
        </div>
        <span className="text-xs font-serif font-bold text-stone-600 dark:text-stone-400">
          Latest {displayList.length} vouchers
        </span>
      </div>

      {displayList.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xs font-serif italic text-stone-600 dark:text-stone-400">No vouchers registered in this ledger period.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel} className="space-y-2">
              <div className="text-[10px] font-serif font-bold tracking-widest text-amber-900/80 dark:text-amber-400/80 uppercase px-1">
                § {dateLabel}
              </div>
              <div className="space-y-1.5">
                {items.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 dark:bg-stone-900/60 hover:bg-amber-100/70 dark:hover:bg-stone-800/80 transition-colors group border border-amber-800/15 dark:border-amber-700/25 shadow-2xs"
                  >
                    {/* Left: Icon & Details */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-2xs border border-amber-700/30"
                        style={{
                          backgroundColor: exp.category?.color
                            ? `${exp.category.color}25`
                            : '#fde68a',
                        }}
                      >
                        {exp.category?.icon || '💰'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-serif font-bold text-sm text-stone-950 dark:text-amber-50 truncate">
                          {exp.merchant || exp.category?.name || 'General Voucher'}
                        </div>
                        <div className="text-[11px] font-serif text-stone-600 dark:text-stone-400 truncate flex items-center gap-1.5">
                          <span className="font-semibold">{exp.category?.name || 'Other'}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                            {exp.payment_method?.name || 'Cash Voucher'}
                          </span>
                          {exp.note && (
                            <>
                              <span>·</span>
                              <span className="italic truncate max-w-[140px]">{exp.note}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Action buttons */}
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono font-black ${
                        exp.type === 'income'
                          ? 'text-[#24543d] dark:text-emerald-400'
                          : 'text-stone-950 dark:text-amber-100'
                      }`}>
                        {exp.type === 'income' ? '+' : ''}{formatINR(exp.amount)}
                      </span>

                      <div className="flex items-center gap-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-amber-200/50 dark:hover:bg-stone-700"
                          title="Edit voucher"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={deletingId === exp.id}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          title="Delete voucher"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#faf6ed] dark:bg-[#1a1510] rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-double border-amber-800/40 dark:border-amber-700/50 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-serif font-black text-stone-950 dark:text-amber-50 mb-4 border-b-2 border-double border-amber-800/20 pb-2">
              Edit Voucher #{editingExpense.id.slice(0, 6).toUpperCase()}
            </h3>
            <ExpenseForm
              initialExpense={editingExpense}
              onSuccess={() => setEditingExpense(null)}
              onCancel={() => setEditingExpense(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
