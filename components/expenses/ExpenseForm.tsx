'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, ChevronUp, Calendar, Store, FileText, CreditCard } from 'lucide-react';
import { Category, PaymentMethod, Expense } from '@/types';
import { getCategories, getPaymentMethods, addExpense, updateExpense } from '@/lib/data/store';
import { showToast } from '@/components/ui/Toast';

interface ExpenseFormProps {
  initialExpense?: Expense | null;
  onSuccess?: (expense: Expense) => void;
  onCancel?: () => void;
}

export function ExpenseForm({ initialExpense, onSuccess, onCancel }: ExpenseFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [amount, setAmount] = useState<string>(initialExpense ? String(initialExpense.amount) : '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialExpense?.category_id || '');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(initialExpense?.payment_method_id || '');
  const [merchant, setMerchant] = useState<string>(initialExpense?.merchant || '');
  const [note, setNote] = useState<string>(initialExpense?.note || '');
  const [expenseDate, setExpenseDate] = useState<string>(
    initialExpense?.expense_date || new Date().toISOString().split('T')[0]
  );
  const [showOptional, setShowOptional] = useState<boolean>(Boolean(initialExpense?.merchant || initialExpense?.note));

  // Load categories and payment methods
  useEffect(() => {
    async function loadMetadata() {
      const [cats, pms] = await Promise.all([getCategories(), getPaymentMethods()]);
      setCategories(cats);

      // Guarantee Credit Card is present in payment methods list
      const pmsList = [...pms];
      if (!pmsList.some((p) => p.name.toLowerCase().includes('credit card'))) {
        pmsList.splice(1, 0, {
          id: 'pm-credit-card',
          name: 'Credit Card',
          type: 'card',
          is_default: false,
        });
      }
      setPaymentMethods(pmsList);

      // Default Category (First one if not set)
      if (!initialExpense && cats.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(cats[0].id);
      }

      // Default Payment Method
      if (!initialExpense && pmsList.length > 0 && !selectedPaymentId) {
        const defaultPm = pmsList.find((p) => p.is_default) || pmsList[0];
        setSelectedPaymentId(defaultPm.id);
      }
    }
    loadMetadata();
  }, [initialExpense, selectedCategoryId, selectedPaymentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseFloat(amount.trim());
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast('Please enter a valid amount greater than 0', 'error');
      return;
    }

    if (!selectedCategoryId) {
      showToast('Please select a category', 'error');
      return;
    }

    setLoading(true);

    try {
      if (initialExpense?.id) {
        // Update existing expense
        const updated = await updateExpense(initialExpense.id, {
          amount: numericAmount,
          category_id: selectedCategoryId,
          payment_method_id: selectedPaymentId || null,
          merchant: merchant.trim() || null,
          note: note.trim() || null,
          expense_date: expenseDate,
        });

        showToast('Expense updated ✓', 'success');
        if (onSuccess && updated) onSuccess(updated);
        else router.push('/transactions');
      } else {
        // Create new expense
        const created = await addExpense({
          amount: numericAmount,
          category_id: selectedCategoryId,
          payment_method_id: selectedPaymentId || null,
          merchant: merchant.trim() || null,
          note: note.trim() || null,
          expense_date: expenseDate,
        });

        showToast('Expense added ✓', 'success');
        if (onSuccess) {
          onSuccess(created);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Something went wrong while saving your expense. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      {/* 1. Large Amount Input (< 5s recording focus) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-sky-100 dark:border-slate-800 shadow-sm text-center">
        <label htmlFor="amount-input" className="block text-xs uppercase tracking-wider font-bold text-slate-700 dark:text-slate-400 mb-2">
          {initialExpense ? 'Edit Amount' : 'Enter Amount'}
        </label>
        <div className="relative inline-flex items-center justify-center">
          <span className="text-3xl md:text-4xl font-bold text-slate-500 dark:text-slate-500 mr-2">
            ₹
          </span>
          <input
            id="amount-input"
            type="number"
            step="any"
            inputMode="decimal"
            autoFocus
            required
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-4xl md:text-5xl font-black tracking-tight text-black dark:text-white bg-transparent border-none outline-none w-48 text-center focus:ring-0 placeholder:text-slate-300 dark:placeholder:text-slate-700"
          />
        </div>
      </div>

      {/* 2. Large Category Selection Buttons */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider font-bold text-slate-700 dark:text-slate-400 px-1">
          Category
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/30 font-bold'
                    : 'bg-white dark:bg-slate-900 text-black dark:text-slate-200 border-sky-100 dark:border-slate-800 hover:border-sky-300 hover:bg-sky-50/60 font-semibold'
                }`}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-xs tracking-tight truncate w-full text-center">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Payment Method Pills */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider font-bold text-slate-700 dark:text-slate-400 px-1 flex items-center justify-between">
          <span>Payment Method</span>
          <span className="text-[10px] lowercase text-slate-600 dark:text-slate-400 font-medium">
            default from settings
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {paymentMethods.map((pm) => {
            const isSelected = selectedPaymentId === pm.id;
            return (
              <button
                type="button"
                key={pm.id}
                onClick={() => setSelectedPaymentId(pm.id)}
                className={`px-3.5 py-2 rounded-xl text-xs transition-all ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm font-bold'
                    : 'bg-white dark:bg-slate-900 text-black dark:text-slate-300 border border-sky-100 dark:border-slate-800 hover:border-sky-300 hover:bg-sky-50 font-medium'
                }`}
              >
                {pm.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Optional Fields Accordion (Merchant, Note, Date) */}
      <div className="border border-sky-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-slate-700 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-slate-850 transition-colors"
        >
          <span>More Details (Merchant, Note, Date)</span>
          {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showOptional && (
          <div className="p-4 pt-1 space-y-3 border-t border-sky-100 dark:border-slate-800">
            {/* Merchant */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">
                <Store className="w-3.5 h-3.5" /> Merchant / Payee
              </label>
              <input
                type="text"
                placeholder="e.g. Swiggy, Uber, Zara, Amazon"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-sky-50/70 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium text-black dark:text-white"
              />
            </div>

            {/* Note */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">
                <FileText className="w-3.5 h-3.5" /> Note / Description
              </label>
              <input
                type="text"
                placeholder="e.g. Dinner with team, groceries"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-sky-50/70 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium text-black dark:text-white"
              />
            </div>

            {/* Date */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5" /> Expense Date
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-sky-50/70 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium text-black dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Primary Action Button */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 px-4 rounded-2xl border border-sky-100 dark:border-slate-800 font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 active:scale-98 transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-4 px-6 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-base shadow-lg shadow-sky-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span>Saving expense...</span>
          ) : (
            <>
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>{initialExpense ? 'Update Expense' : 'Save Expense'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
