'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  CreditCard,
  ArrowUpDown,
  Calendar,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Expense, Category, PaymentMethod, Profile } from '@/types';
import {
  getExpenses,
  getCategories,
  getPaymentMethods,
  getProfiles,
  deleteExpense,
  DATA_CHANGE_EVENT,
  getMonthlySetting,
  getGoals,
} from '@/lib/data/store';
import {
  formatINR,
  formatDateIndian,
  formatRelativeDate,
} from '@/lib/formatting/formatters';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { PersonSelector } from '@/components/navigation/PersonSelector';
import { showToast } from '@/components/ui/Toast';
import { exportToExcel } from '@/lib/excel/exporter';

export default function TransactionsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Edit / Delete State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [expList, catList, pmList, profList] = await Promise.all([
        getExpenses(selectedPersonId),
        getCategories(),
        getPaymentMethods(),
        getProfiles(),
      ]);
      setExpenses(expList);
      setCategories(catList);
      setPaymentMethods(pmList);
      setProfiles(profList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedPersonId]);

  useEffect(() => {
    loadData();
    window.addEventListener(DATA_CHANGE_EVENT, loadData);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, loadData);
  }, [loadData]);

  // Filter & Sort Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const merchantMatch = e.merchant?.toLowerCase().includes(query);
        const noteMatch = e.note?.toLowerCase().includes(query);
        const catMatch = e.category?.name.toLowerCase().includes(query);
        if (!merchantMatch && !noteMatch && !catMatch) return false;
      }

      // Category
      if (selectedCategory !== 'all' && e.category_id !== selectedCategory) {
        return false;
      }

      // Payment method
      if (selectedPaymentMethod !== 'all' && e.payment_method_id !== selectedPaymentMethod) {
        return false;
      }

      // Date Range
      if (startDate && e.expense_date < startDate) return false;
      if (endDate && e.expense_date > endDate) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime();
      if (sortBy === 'oldest') return new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime();
      if (sortBy === 'highest') return Number(b.amount) - Number(a.amount);
      if (sortBy === 'lowest') return Number(a.amount) - Number(b.amount);
      return 0;
    });
  }, [expenses, searchQuery, selectedCategory, selectedPaymentMethod, startDate, endDate, sortBy]);

  // Total filtered amount
  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [filteredExpenses]);

  // Group by Date for display
  const groupedByDate = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    filteredExpenses.forEach((e) => {
      if (!map[e.expense_date]) map[e.expense_date] = [];
      map[e.expense_date].push(e);
    });
    return map;
  }, [filteredExpenses]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
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

  const handleExportFiltered = async () => {
    try {
      const [setting, goals] = await Promise.all([
        getMonthlySetting(9, 2026),
        getGoals(),
      ]);
      exportToExcel({
        expenses: filteredExpenses,
        categories,
        paymentMethods,
        monthlySetting: setting,
        goals,
        scope: startDate || endDate ? 'range' : 'all',
        dateRangeLabel: startDate || endDate ? `${startDate}_to_${endDate}` : undefined,
      });
      showToast('Excel exported ✓', 'success');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedPaymentMethod('all');
    setStartDate('');
    setEndDate('');
    setSortBy('newest');
  };

  const hasActiveFilters =
    searchQuery || selectedCategory !== 'all' || selectedPaymentMethod !== 'all' || startDate || endDate;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {filteredExpenses.length} transactions · Total: <span className="font-bold text-slate-900 dark:text-white">{formatINR(totalFilteredAmount)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Person Selector */}
          <PersonSelector
            profiles={profiles}
            selectedUserId={selectedPersonId}
            onSelectUser={setSelectedPersonId}
          />

          <button
            onClick={handleExportFiltered}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export</span>
          </button>

          <Link
            href="/add"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search merchant, category, note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Advanced Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" />
            )}
          </button>
        </div>

        {/* Collapsible Filter Controls */}
        {showFilters && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Category Select */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Select */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Payment
              </label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Methods</option>
                {paymentMethods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Sort
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>
            </div>

            {/* Clear Filters Action */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grouped Transaction List */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <p className="text-sm text-slate-500">No transactions match your current filters.</p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([dateStr, items]) => {
            const dayTotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
            return (
              <div key={dateStr} className="space-y-2">
                {/* Date Header with Daily Total */}
                <div className="flex items-center justify-between px-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <span>{formatRelativeDate(dateStr)} · {formatDateIndian(dateStr)}</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">
                    Total: {formatINR(dayTotal)}
                  </span>
                </div>

                {/* Items in this date */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-sm">
                  {items.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors group"
                    >
                      {/* Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{
                            backgroundColor: exp.category?.color
                              ? `${exp.category.color}20`
                              : '#f1f5f9',
                          }}
                        >
                          {exp.category?.icon || '💰'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {exp.merchant || exp.category?.name || 'Expense'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                            <span>{exp.category?.name || 'Other'}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {exp.payment_method?.name || 'UPI'}
                            </span>
                            {exp.profile?.display_name && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                  {exp.profile.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={exp.profile.avatar_url}
                                      alt={exp.profile.display_name}
                                      className="w-3.5 h-3.5 rounded-full object-cover border border-emerald-500/40"
                                    />
                                  ) : (
                                    <span>👤</span>
                                  )}
                                  <span>{exp.profile.display_name}</span>
                                </span>
                              </>
                            )}
                            {exp.note && (
                              <>
                                <span>·</span>
                                <span className="truncate max-w-[160px] text-slate-400">{exp.note}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Amount & Actions */}
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {formatINR(exp.amount)}
                        </span>

                        <div className="flex items-center gap-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingExpense(exp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp.id)}
                            disabled={deletingId === exp.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
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
