'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  Store,
  FileText,
  Sparkles,
  Repeat,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { Category, PaymentMethod, Expense, TransactionType, Goal } from '@/types';
import { getCategories, getPaymentMethods, addExpense, updateExpense, getGoals, addGoalTransaction } from '@/lib/data/store';
import { showToast } from '@/components/ui/Toast';

interface ExpenseFormProps {
  initialExpense?: Expense | null;
  onSuccess?: (expense: Expense) => void;
  onCancel?: () => void;
}

const SMART_RULES: Array<{ keywords: string[]; categoryName: string; type: TransactionType }> = [
  { keywords: ['swiggy', 'zomato', 'starbucks', 'chai', 'coffee', 'kfc', 'mcdonalds', 'burger', 'pizza', 'restaurant', 'cafe', 'dinner', 'lunch', 'breakfast', 'food'], categoryName: 'Food & Dining', type: 'expense' },
  { keywords: ['uber', 'ola', 'rapido', 'metro', 'petrol', 'fuel', 'diesel', 'shell', 'parking', 'toll', 'cab', 'auto'], categoryName: 'Transportation', type: 'expense' },
  { keywords: ['amazon', 'flipkart', 'myntra', 'zara', 'nike', 'h&m', 'clothes', 'shopping', 'shoes', 'mall'], categoryName: 'Shopping', type: 'expense' },
  { keywords: ['electricity', 'wifi', 'broadband', 'airtel', 'jio', 'rent', 'gas', 'bescom', 'water', 'maintenance', 'bill', 'recharge'], categoryName: 'Bills & Utilities', type: 'expense' },
  { keywords: ['netflix', 'spotify', 'youtube', 'prime', 'disney', 'hotstar', 'apple', 'icloud', 'google one', 'chatgpt', 'github'], categoryName: 'Subscriptions', type: 'expense' },
  { keywords: ['apollo', 'pharmacy', 'chemist', 'doctor', 'hospital', 'medicine', 'gym', 'cult', 'dentist', 'clinic'], categoryName: 'Health & Medical', type: 'expense' },
  { keywords: ['blinkit', 'zepto', 'instamart', 'bigbasket', 'groceries', 'milk', 'vegetables', 'supermarket', 'dmart', 'nature basket'], categoryName: 'Groceries', type: 'expense' },
  { keywords: ['salary', 'paycheck', 'payroll', 'stipend', 'wages', 'monthly payout'], categoryName: 'Salary', type: 'income' },
  { keywords: ['freelance', 'upwork', 'fiverr', 'client', 'consulting', 'contract'], categoryName: 'Freelance & Consulting', type: 'income' },
  { keywords: ['dividend', 'zerodha', 'groww', 'interest', 'mutual fund', 'stock', 'crypto', 'yield'], categoryName: 'Investments & Dividends', type: 'income' },
  { keywords: ['tenant', 'rent received', 'rental income'], categoryName: 'Rental Income', type: 'income' },
  { keywords: ['refund', 'cashback', 'cred', 'reimbursement', 'repay'], categoryName: 'Refunds & Cashbacks', type: 'income' },
];

const QUICK_AMOUNT_CHIPS = [50, 100, 200, 500, 1000, 2000];

export function ExpenseForm({ initialExpense, onSuccess, onCancel }: ExpenseFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [transactionType, setTransactionType] = useState<TransactionType>(
    initialExpense?.type || 'expense'
  );
  const [amount, setAmount] = useState<string>(initialExpense ? String(initialExpense.amount) : '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialExpense?.category_id || '');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(initialExpense?.payment_method_id || '');
  const [merchant, setMerchant] = useState<string>(initialExpense?.merchant || '');
  const [note, setNote] = useState<string>(initialExpense?.note || '');
  const [isRecurring, setIsRecurring] = useState<boolean>(Boolean(initialExpense?.is_recurring));
  const [detectedCategoryName, setDetectedCategoryName] = useState<string | null>(null);

  const [expenseDate, setExpenseDate] = useState<string>(
    initialExpense?.expense_date || new Date().toISOString().split('T')[0]
  );
  const [showOptional, setShowOptional] = useState<boolean>(
    Boolean(initialExpense?.merchant || initialExpense?.note || initialExpense?.is_recurring)
  );

  // Portfolio Direct Allocation State
  const [goals, setGoals] = useState<Goal[]>([]);
  const [allocateToPortfolio, setAllocateToPortfolio] = useState<boolean>(false);
  const [targetGoalId, setTargetGoalId] = useState<string>('');
  const [allocationPercent, setAllocationPercent] = useState<number>(100);
  const [customAllocationAmount, setCustomAllocationAmount] = useState<string>('');

  // Load categories and payment methods
  useEffect(() => {
    async function loadMetadata() {
      const [cats, pms, userGoals] = await Promise.all([
        getCategories(),
        getPaymentMethods(),
        getGoals(),
      ]);
      setCategories(cats);
      setGoals(userGoals);
      if (userGoals.length > 0 && !targetGoalId) {
        setTargetGoalId(userGoals[0].id);
      }

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

      // Default Category
      if (!initialExpense && cats.length > 0 && !selectedCategoryId) {
        const initialMatching = cats.find((c) => (transactionType === 'income' ? c.type === 'income' : c.type !== 'income')) || cats[0];
        setSelectedCategoryId(initialMatching.id);
      }

      // Default Payment Method
      if (!initialExpense && pmsList.length > 0 && !selectedPaymentId) {
        const defaultPm = pmsList.find((p) => p.is_default) || pmsList[0];
        setSelectedPaymentId(defaultPm.id);
      }
    }
    loadMetadata();
  }, [initialExpense]);

  // Categories filtered by transaction type
  const visibleCategories = useMemo(() => {
    const matching = categories.filter((c) =>
      transactionType === 'income' ? c.type === 'income' : c.type !== 'income'
    );
    return matching.length > 0 ? matching : categories;
  }, [categories, transactionType]);

  // When switching type, adjust category selection if current category is in wrong type
  const handleTypeChange = (newType: TransactionType) => {
    setTransactionType(newType);
    const matching = categories.filter((c) =>
      newType === 'income' ? c.type === 'income' : c.type !== 'income'
    );
    if (matching.length > 0 && !matching.some((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId(matching[0].id);
    }
  };

  // Smart Detection when user types Merchant or Note
  const handleSmartDetection = (text: string) => {
    if (!text.trim()) return;
    const lower = text.toLowerCase();
    for (const rule of SMART_RULES) {
      if (rule.keywords.some((kw) => lower.includes(kw))) {
        const targetCategory = categories.find(
          (c) => c.name.toLowerCase() === rule.categoryName.toLowerCase()
        );
        if (targetCategory) {
          setSelectedCategoryId(targetCategory.id);
          if (rule.type !== transactionType) {
            setTransactionType(rule.type);
          }
          if (rule.categoryName.toLowerCase().includes('subscription')) {
            setIsRecurring(true);
          }
          setDetectedCategoryName(targetCategory.name);
          setTimeout(() => setDetectedCategoryName(null), 3500);
          break;
        }
      }
    }
  };

  const handleQuickAdd = (chipAmount: number) => {
    const current = parseFloat(amount.trim());
    if (isNaN(current) || current <= 0) {
      setAmount(String(chipAmount));
    } else {
      setAmount(String(current + chipAmount));
    }
  };

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
        // Update existing transaction
        const updated = await updateExpense(initialExpense.id, {
          amount: numericAmount,
          type: transactionType,
          category_id: selectedCategoryId,
          payment_method_id: selectedPaymentId || null,
          merchant: merchant.trim() || null,
          note: note.trim() || null,
          is_recurring: isRecurring,
          expense_date: expenseDate,
        });

        showToast(transactionType === 'income' ? 'Income updated ✓' : 'Expense updated ✓', 'success');
        if (onSuccess && updated) onSuccess(updated);
        else router.push('/transactions');
      } else {
        // Create new transaction
        const created = await addExpense({
          amount: numericAmount,
          type: transactionType,
          category_id: selectedCategoryId,
          payment_method_id: selectedPaymentId || null,
          merchant: merchant.trim() || null,
          note: note.trim() || null,
          is_recurring: isRecurring,
          expense_date: expenseDate,
        });

        // If income is credited to portfolio goal
        if (transactionType === 'income' && allocateToPortfolio && targetGoalId) {
          const allocAmt = customAllocationAmount
            ? parseFloat(customAllocationAmount)
            : Math.round(numericAmount * (allocationPercent / 100));

          if (allocAmt > 0) {
            await addGoalTransaction(
              targetGoalId,
              allocAmt,
              'deposit',
              `Allocated from ${merchant.trim() || 'Income inflow'}`
            );
            const matchedGoal = goals.find((g) => g.id === targetGoalId);
            showToast(
              `Income recorded & +₹${allocAmt.toLocaleString('en-IN')} credited to ${matchedGoal?.name || 'Vault'}! 🏛️`,
              'success'
            );
          } else {
            showToast('Income recorded ✓', 'success');
          }
        } else {
          showToast(
            transactionType === 'income' ? 'Income recorded ✓' : 'Expense recorded ✓',
            'success'
          );
        }

        if (onSuccess) {
          onSuccess(created);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Something went wrong while saving. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      {/* 1. Transaction Type Toggle (Expense vs Income) */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${
            transactionType === 'expense'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Expense (Money Out)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${
            transactionType === 'income'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Income (Money In)</span>
        </button>
      </div>

      {/* 2. Large Amount Input */}
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-sm text-center transition-all ${
          transactionType === 'income'
            ? 'border-emerald-200 dark:border-emerald-800/60 shadow-emerald-500/5'
            : 'border-sky-100 dark:border-slate-800 shadow-sky-500/5'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
            {transactionType === 'income' ? 'Income Amount' : 'Expense Amount'}
          </span>
          {detectedCategoryName && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
              <Sparkles className="w-3 h-3" /> Auto-detected {detectedCategoryName}
            </span>
          )}
        </div>

        <div className="relative inline-flex items-center justify-center">
          <span
            className={`text-3xl md:text-4xl font-bold mr-2 ${
              transactionType === 'income'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {transactionType === 'income' ? '+₹' : '₹'}
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
            className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white bg-transparent border-none outline-none w-48 text-center focus:ring-0 placeholder:text-slate-300 dark:placeholder:text-slate-700"
          />
        </div>

        {/* Quick Amount Chips */}
        <div className="flex items-center justify-center flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mr-1">Quick:</span>
          {QUICK_AMOUNT_CHIPS.map((chip) => (
            <button
              type="button"
              key={chip}
              onClick={() => handleQuickAdd(chip)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              +{chip}
            </button>
          ))}
          {amount && (
            <button
              type="button"
              onClick={() => setAmount('')}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 3. Category Selection Buttons */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 px-1 flex items-center justify-between">
          <span>{transactionType === 'income' ? 'Income Source' : 'Category'}</span>
          <span className="text-[10px] font-normal text-slate-600 dark:text-slate-400">
            {visibleCategories.length} available
          </span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {visibleCategories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 ${
                  isSelected
                    ? transactionType === 'income'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30 font-bold'
                      : 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/30 font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-sky-100 dark:border-slate-800 hover:border-sky-300 hover:bg-sky-50/60 font-semibold'
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

      {/* 4. Payment Method Pills */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 px-1 flex items-center justify-between">
          <span>{transactionType === 'income' ? 'Received Into (Account / Wallet)' : 'Paid Via (Payment Method)'}</span>
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
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50 font-medium'
                }`}
              >
                {pm.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4.5. 1940s Portfolio Vault Direct Allocation (When Income) */}
      {transactionType === 'income' && (
        <div className="rounded-3xl p-5 border-2 border-double border-amber-600/40 bg-gradient-to-br from-amber-50 via-amber-100/30 to-amber-50/50 dark:from-stone-900 dark:via-amber-950/20 dark:to-stone-950 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-700 text-white flex items-center justify-center text-xl shadow-md shadow-amber-900/20 shrink-0">
                🏛️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider uppercase text-amber-950 dark:text-amber-300 font-serif">
                    1940s Wealth Vault Deposit
                  </span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                    Portfolio
                  </span>
                </div>
                <div className="text-[11px] text-amber-800/80 dark:text-amber-400/90 font-medium">
                  Direct this incoming income/salary into a specific portfolio asset or goal.
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={allocateToPortfolio}
                onChange={(e) => setAllocateToPortfolio(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-700" />
            </label>
          </div>

          {allocateToPortfolio && (
            <div className="space-y-3.5 pt-3 border-t border-amber-600/30">
              {goals.length === 0 ? (
                <div className="p-3.5 rounded-2xl bg-amber-200/40 dark:bg-amber-950/40 text-xs text-amber-950 dark:text-amber-200 font-medium border border-amber-300/60 dark:border-amber-800">
                  No portfolio vaults created yet. Create a goal in <strong>Savings & Invest</strong> to begin auto-allocating income!
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-amber-950 dark:text-amber-300 mb-1.5 font-serif">
                      Target Portfolio Asset / Goal Vault
                    </label>
                    <select
                      value={targetGoalId}
                      onChange={(e) => setTargetGoalId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-stone-900 border border-amber-600/40 text-stone-900 dark:text-amber-100 focus:outline-none shadow-2xs"
                    >
                      {goals.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} · Target: ₹{g.target_amount.toLocaleString('en-IN')} (Current: ₹{g.current_amount.toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 dark:text-amber-300 font-serif">
                        Portion to Credit into Vault
                      </span>
                      <span className="text-xs font-black text-amber-800 dark:text-amber-300 font-mono">
                        Credit: ₹
                        {customAllocationAmount
                          ? parseFloat(customAllocationAmount || '0').toLocaleString('en-IN')
                          : (
                              (parseFloat(amount) || 0) *
                              (allocationPercent / 100)
                            ).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[25, 50, 75, 100].map((pct) => (
                        <button
                          type="button"
                          key={pct}
                          onClick={() => {
                            setAllocationPercent(pct);
                            const num = parseFloat(amount) || 0;
                            setCustomAllocationAmount(String(Math.round((num * pct) / 100)));
                          }}
                          className={`py-1.5 rounded-xl text-xs font-black transition-all ${
                            allocationPercent === pct &&
                            customAllocationAmount ===
                              String(Math.round(((parseFloat(amount) || 0) * pct) / 100))
                              ? 'bg-amber-700 text-white shadow-xs'
                              : 'bg-white dark:bg-stone-900 text-amber-950 dark:text-amber-300 border border-amber-600/30 hover:bg-amber-100/80 dark:hover:bg-amber-950/40'
                          }`}
                        >
                          {pct === 100 ? '100% (All)' : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Optional Fields Accordion (Merchant, Note, Date, Recurring) */}
      <div className="border border-sky-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-slate-700 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-slate-850 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span>Details (Payee, Notes, Date, Subscriptions)</span>
            {isRecurring && (
              <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                Recurring
              </span>
            )}
          </div>
          {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showOptional && (
          <div className="p-4 pt-1 space-y-3.5 border-t border-sky-100 dark:border-slate-800">
            {/* Merchant / Payee with Smart auto-detection */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">
                <Store className="w-3.5 h-3.5" />
                <span>{transactionType === 'income' ? 'Sender / Payer' : 'Merchant / Payee'}</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-normal">
                  (Auto-categorizes)
                </span>
              </label>
              <input
                type="text"
                placeholder={
                  transactionType === 'income'
                    ? 'e.g. Acme Corp, Upwork, Dividend, Landlord'
                    : 'e.g. Swiggy, Uber, Amazon, Netflix, Apollo'
                }
                value={merchant}
                onChange={(e) => {
                  setMerchant(e.target.value);
                  handleSmartDetection(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium text-slate-900 dark:text-white"
              />
            </div>

            {/* Note / Description */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">
                <FileText className="w-3.5 h-3.5" /> Note / Description
              </label>
              <input
                type="text"
                placeholder="e.g. Dinner with team, monthly salary, fuel top-up"
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  handleSmartDetection(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium text-slate-900 dark:text-white"
              />
            </div>

            {/* Date */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5" /> Transaction Date
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium text-slate-900 dark:text-white"
              />
            </div>

            {/* Recurring Commitment Checkbox */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-amber-500" />
                    <span>Fixed Recurring Commitment / Subscription</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Tracks this in your monthly fixed commitments and subscription radar.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 6. Primary Action Button */}
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
          className={`flex-1 py-4 px-6 rounded-2xl text-white font-black text-base active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg ${
            transactionType === 'income'
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30'
          }`}
        >
          {loading ? (
            <span>Saving...</span>
          ) : (
            <>
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>
                {initialExpense
                  ? transactionType === 'income'
                    ? 'Update Income'
                    : 'Update Expense'
                  : transactionType === 'income'
                  ? `Save Income (${amount ? `+₹${parseFloat(amount).toLocaleString('en-IN')}` : ''})`
                  : `Save Expense (${amount ? `₹${parseFloat(amount).toLocaleString('en-IN')}` : ''})`}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
