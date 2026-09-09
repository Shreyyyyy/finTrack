'use client';

import React, { useState, useMemo } from 'react';
import { Expense, Category, PaymentMethod } from '@/types';
import { formatINR, formatRelativeDate } from '@/lib/formatting/formatters';
import { Search, Filter, Trash2, Edit3, CreditCard, ChevronDown, Plus, FileSpreadsheet } from 'lucide-react';
import { deleteExpense } from '@/lib/data/store';
import { showToast } from '@/components/ui/Toast';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import Link from 'next/link';

interface DashboardTransactionsTableProps {
  expenses: Expense[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
}

export function DashboardTransactionsTable({
  expenses,
  categories,
  paymentMethods,
}: DashboardTransactionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(15);

  // Filtered transactions
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Category filter
      if (selectedCategory !== 'all' && exp.category_id !== selectedCategory) {
        return false;
      }
      // Payment method filter
      if (selectedPayment !== 'all' && exp.payment_method_id !== selectedPayment) {
        return false;
      }
      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const merchantMatch = exp.merchant?.toLowerCase().includes(query);
        const categoryMatch = exp.category?.name?.toLowerCase().includes(query);
        const noteMatch = exp.note?.toLowerCase().includes(query);
        const amountMatch = exp.amount.toString().includes(query);
        return merchantMatch || categoryMatch || noteMatch || amountMatch;
      }
      return true;
    });
  }, [expenses, selectedCategory, selectedPayment, searchTerm]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const visibleExpenses = filteredExpenses.slice(0, visibleCount);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      setDeletingId(id);
      try {
        await deleteExpense(id);
        showToast('Transaction deleted ✓', 'info');
      } catch {
        showToast('Failed to delete transaction', 'error');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-sky-100 dark:border-slate-800 shadow-sm space-y-5">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-black dark:text-white uppercase tracking-tight flex items-center gap-2">
            <span>Transaction Ledger</span>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-emerald-950 text-sky-800 dark:text-emerald-300">
              {filteredExpenses.length} entries
            </span>
          </h2>
          <p className="text-xs text-slate-800 dark:text-slate-400 font-bold mt-0.5">
            Total Spend in View: <span className="font-black text-black dark:text-white">{formatINR(totalFilteredAmount)}</span>
          </p>
        </div>

        {/* Quick Add Button */}
        <Link
          href="/add"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-sm active:scale-95 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Transaction</span>
        </Link>
      </div>

      {/* Filter & Search Bar Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search input */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search merchant, category, or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-sky-50/70 dark:bg-slate-800/60 border border-sky-200/80 dark:border-slate-700/80 text-xs font-bold text-black dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          />
        </div>

        {/* Category Dropdown */}
        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-2xl bg-sky-50/70 dark:bg-slate-800/60 border border-sky-200/80 dark:border-slate-700/80 text-xs font-black text-black dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Dropdown */}
        <div className="sm:col-span-3">
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="w-full px-3 py-2 rounded-2xl bg-sky-50/70 dark:bg-slate-800/60 border border-sky-200/80 dark:border-slate-700/80 text-xs font-black text-black dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          >
            <option value="all">All Payment Methods</option>
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 space-y-2 bg-sky-50/40 dark:bg-slate-800/20 rounded-2xl border border-dashed border-sky-200 dark:border-slate-800">
          <p className="text-sm font-black text-black dark:text-slate-300">
            No matching transactions found
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">
            Try adjusting your search query or filters.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card List View (Visible on Small Screens) */}
          <div className="block md:hidden space-y-2.5">
            {visibleExpenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-slate-800/50 border border-sky-100 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-xs"
                    style={{
                      backgroundColor: exp.category?.color
                        ? `${exp.category.color}25`
                        : '#e0f2fe',
                    }}
                  >
                    {exp.category?.icon || '💰'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-xs text-black dark:text-white truncate">
                      {exp.merchant || exp.category?.name || 'General Expense'}
                    </div>
                    <div className="text-[11px] text-slate-800 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5 font-bold">
                      <span>{exp.category?.name || 'Other'}</span>
                      <span>·</span>
                      <span>{exp.payment_method?.name || 'UPI'}</span>
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      {formatRelativeDate(exp.expense_date)}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-black dark:text-white">
                    {formatINR(exp.amount)}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <button
                      onClick={() => setEditingExpense(exp)}
                      className="p-1 rounded-md text-slate-500 hover:text-black dark:hover:text-white"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      disabled={deletingId === exp.id}
                      className="p-1 rounded-md text-slate-500 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (Hidden on Small Screens) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-sky-100 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-sky-100/60 dark:bg-slate-800/60 text-black dark:text-slate-400 font-black uppercase tracking-wider text-[10px] border-b border-sky-200 dark:border-slate-800">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Merchant / Note</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100 dark:divide-slate-800/80 text-black dark:text-slate-200">
                {visibleExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-sky-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-800 dark:text-slate-400 font-bold">
                      {exp.expense_date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-black text-black dark:text-white">
                        {exp.merchant || exp.category?.name || 'General Expense'}
                      </div>
                      {exp.note && (
                        <div className="text-[11px] text-slate-700 dark:text-slate-400 font-medium truncate max-w-xs">{exp.note}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-100 dark:bg-slate-800 text-black dark:text-slate-300 font-bold">
                        <span>{exp.category?.icon || '💰'}</span>
                        <span>{exp.category?.name || 'Other'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-800 dark:text-slate-400 font-bold">
                      <span className="inline-flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-sky-600 dark:text-slate-400" />
                        <span>{exp.payment_method?.name || 'UPI'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-black dark:text-white whitespace-nowrap">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-black dark:hover:text-white hover:bg-sky-100 dark:hover:bg-slate-800"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={deletingId === exp.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {filteredExpenses.length > visibleCount && (
            <div className="pt-2 text-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + 15)}
                className="px-4 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black text-black dark:text-slate-300 transition-colors shadow-2xs"
              >
                Load More Transactions ({filteredExpenses.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-black dark:text-white mb-4">
              Edit Transaction
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
