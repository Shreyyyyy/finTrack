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
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-sky-100 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
          Recent Expenses
        </h3>
        <span className="text-xs font-bold text-slate-600 dark:text-slate-500">
          Showing latest {displayList.length}
        </span>
      </div>

      {displayList.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No expenses recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel} className="space-y-2">
              <div className="text-[11px] font-bold tracking-wider text-slate-600 dark:text-slate-500 uppercase px-1">
                {dateLabel}
              </div>
              <div className="space-y-1.5">
                {items.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-sky-50/70 dark:bg-slate-800/40 hover:bg-sky-100/70 dark:hover:bg-slate-800 transition-colors group shadow-2xs"
                  >
                    {/* Left: Icon & Details */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                        style={{
                          backgroundColor: exp.category?.color
                            ? `${exp.category.color}20`
                            : '#e0f2fe',
                        }}
                      >
                        {exp.category?.icon || '💰'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-black dark:text-white truncate">
                          {exp.merchant || exp.category?.name || 'General Expense'}
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-400 truncate flex items-center gap-1.5 font-medium">
                          <span>{exp.category?.name || 'Other'}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {exp.payment_method?.name || 'UPI'}
                          </span>
                          {exp.note && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[140px]">{exp.note}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Action buttons */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-black dark:text-white">
                        {formatINR(exp.amount)}
                      </span>

                      <div className="flex items-center gap-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Edit expense"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={deletingId === exp.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          title="Delete expense"
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-black dark:text-white mb-4">
              Edit Expense
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
