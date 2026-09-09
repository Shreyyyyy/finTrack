'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  CreditCard,
  Tag,
  Key,
  Smartphone,
  Copy,
  Check,
  Trash2,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  Moon,
  Sun,
  Laptop,
  CheckCircle,
  ShieldAlert,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/providers/AuthProvider';
import { Category, PaymentMethod, MonthlySetting, ApiKey } from '@/types';
import {
  getCategories,
  saveCategory,
  deleteCategory,
  getPaymentMethods,
  savePaymentMethod,
  deletePaymentMethod,
  getMonthlySetting,
  saveMonthlySetting,
  getApiKeys,
  createApiKey,
  deleteApiKey,
  wipeAllData,
  getExpenses,
  getGoals,
} from '@/lib/data/store';
import { formatINR, MONTH_NAMES } from '@/lib/formatting/formatters';
import { exportToExcel } from '@/lib/excel/exporter';
import { showToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, profile, signInWithGoogle, signOut, isConfigured } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [defaultPayment, setDefaultPayment] = useState('UPI');

  // Month selector for monthly income configuration
  const [selectedMonth, setSelectedMonth] = useState(9);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [monthIncome, setMonthIncome] = useState('80000');
  const [monthBudget, setMonthBudget] = useState('50000');
  const [monthSavings, setMonthSavings] = useState('30000');

  // New Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('💰');
  const [newCatBudget, setNewCatBudget] = useState('');

  // New Payment Method State
  const [newPmName, setNewPmName] = useState('');

  // Copy indicator
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Data Wipe Confirmation
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [showWipeModal, setShowWipeModal] = useState(false);

  const loadAll = async () => {
    const [cats, pms, keys, setting] = await Promise.all([
      getCategories(),
      getPaymentMethods(),
      getApiKeys(),
      getMonthlySetting(selectedMonth, selectedYear),
    ]);
    setCategories(cats);
    setPaymentMethods(pms);
    setApiKeys(keys);
    const def = pms.find((p) => p.is_default);
    if (def) setDefaultPayment(def.name);

    setMonthIncome(String(setting.income));
    setMonthBudget(String(setting.monthly_budget));
    setMonthSavings(String(setting.savings_target));
  };

  useEffect(() => {
    loadAll();
  }, [selectedMonth, selectedYear]);

  // Set default payment method
  const handleSetDefaultPayment = async (pmId: string) => {
    const target = paymentMethods.find((p) => p.id === pmId);
    if (!target) return;
    await savePaymentMethod({ ...target, is_default: true });
    showToast(`Default payment set to ${target.name} ✓`, 'success');
    loadAll();
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await saveCategory({
      name: newCatName.trim(),
      icon: newCatIcon || '💰',
      budget_amount: parseFloat(newCatBudget) || 0,
      color: '#10b981',
    });
    setNewCatName('');
    setNewCatBudget('');
    showToast('Category added ✓', 'success');
    loadAll();
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this category?')) {
      await deleteCategory(id);
      showToast('Category deleted ✓', 'info');
      loadAll();
    }
  };

  // Add Payment Method
  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPmName.trim()) return;
    await savePaymentMethod({
      name: newPmName.trim(),
      type: 'custom',
    });
    setNewPmName('');
    showToast('Payment method added ✓', 'success');
    loadAll();
  };

  // Delete Payment Method
  const handleDeletePaymentMethod = async (id: string) => {
    if (confirm('Delete this payment method?')) {
      await deletePaymentMethod(id);
      showToast('Payment method deleted ✓', 'info');
      loadAll();
    }
  };

  // Save Monthly Income / Budget
  const handleSaveMonthlySetting = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMonthlySetting({
      id: `ms-${selectedMonth}-${selectedYear}`,
      month: selectedMonth,
      year: selectedYear,
      income: parseFloat(monthIncome) || 0,
      monthly_budget: parseFloat(monthBudget) || 0,
      savings_target: parseFloat(monthSavings) || 0,
    });
    showToast(`${MONTH_NAMES[selectedMonth - 1]} settings saved ✓`, 'success');
  };

  // Generate API Key for Shortcuts
  const handleGenerateApiKey = async () => {
    await createApiKey('iPhone Back Tap');
    showToast('New API Key generated ✓', 'success');
    loadAll();
  };

  const handleDeleteApiKey = async (id: string) => {
    await deleteApiKey(id);
    showToast('API Key revoked', 'info');
    loadAll();
  };

  // Copy Helpers
  const copyToClipboard = (text: string, isKey = false) => {
    navigator.clipboard.writeText(text);
    if (isKey) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
    showToast('Copied to clipboard ✓', 'success');
  };

  // Excel Full Backup
  const handleFullBackup = async () => {
    try {
      const [exp, setting, goals] = await Promise.all([
        getExpenses(),
        getMonthlySetting(selectedMonth, selectedYear),
        getGoals(),
      ]);
      exportToExcel({
        expenses: exp,
        categories,
        paymentMethods,
        monthlySetting: setting,
        goals,
        scope: 'all',
      });
      showToast('Full Excel backup exported ✓', 'success');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  // Wipe All Data
  const handleWipeData = async () => {
    if (wipeConfirmText !== 'DELETE ALL MY DATA') {
      showToast('Confirmation phrase does not match', 'error');
      return;
    }
    await wipeAllData();
    setShowWipeModal(false);
    showToast('All local data wiped', 'info');
    loadAll();
  };

  const quickApiUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/expenses/quick`
      : 'https://your-domain.com/api/expenses/quick';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-5 md:py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Settings & Utilities
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Customize your preferences, categories, payment methods, and Apple Shortcut integrations.
        </p>
      </div>

      {/* 0. Account & Google Login */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Account & Sync
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-user authentication via Google & Supabase
            </p>
          </div>
          {user && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Active Session
            </span>
          )}
        </div>

        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-12 h-12 rounded-full border-2 border-emerald-500/50 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {profile?.display_name?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{profile?.display_name || 'Personal User'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Google
                  </span>
                </div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>
            </div>

            <button
              onClick={signOut}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Not signed in with Google
              </div>
              <p className="text-xs text-slate-500">
                Sign in to isolate and sync your personal data securely with your Google account.
              </p>
            </div>

            <button
              onClick={signInWithGoogle}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. Appearance / Theme */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Display Theme
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 ${
              theme === 'light'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Light</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 ${
              theme === 'dark'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`flex-1 py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 ${
              theme === 'system'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* 2. Apple Shortcut & Back Tap Setup (Section 23 & 24) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                iPhone Back Tap & Apple Shortcut API
              </h3>
              <p className="text-xs text-slate-500">Record expenses in &lt; 5 seconds from your lock screen</p>
            </div>
          </div>
          <button
            onClick={handleGenerateApiKey}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New API Key</span>
          </button>
        </div>

        {/* API Endpoint Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Shortcut Webhook URL (POST)</span>
            <button
              onClick={() => copyToClipboard(quickApiUrl, false)}
              className="text-emerald-600 hover:underline flex items-center gap-1"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>
          <div className="font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 select-all overflow-x-auto">
            {quickApiUrl}
          </div>
        </div>

        {/* Active API Keys */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Active Shortcut Keys</label>
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
            >
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>{key.name}</span>
                </div>
                <div className="font-mono text-xs text-slate-500 mt-0.5">
                  {key.key_hash.substring(0, 16)}••••••••
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(key.key_hash, true)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  title="Copy full key"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDeleteApiKey(key.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
                  title="Revoke key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Step-by-Step Apple Shortcut Setup Guide */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/50 space-y-2 text-xs">
          <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>How to configure Apple Shortcut with iPhone Back Tap:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300">
            <li>Open the <strong>Shortcuts</strong> app on your iPhone and tap <strong>+</strong>.</li>
            <li>Add action: <strong>Ask for Input</strong> (Type: Number, Prompt: &quot;Amount ₹&quot;).</li>
            <li>Add action: <strong>Choose from List</strong> (Items: Food, Transport, Shopping, Bills, Other).</li>
            <li>Add action: <strong>Get Contents of URL</strong>:
              <ul className="list-disc list-inside ml-4 mt-0.5 text-slate-600 dark:text-slate-400">
                <li>URL: paste the <code>/api/expenses/quick</code> URL above</li>
                <li>Method: <strong>POST</strong></li>
                <li>Headers: Key <code>x-api-key</code> → Value: your API key</li>
                <li>Request Body: JSON with <code>amount</code> (Provided Input) and <code>category</code> (Chosen Item)</li>
              </ul>
            </li>
            <li>Go to iPhone <strong>Settings → Accessibility → Touch → Back Tap</strong>.</li>
            <li>Select <strong>Double Tap</strong> → Choose your finTrack shortcut!</li>
          </ol>
        </div>
      </div>

      {/* 3. Monthly Income & Budget History (Section 12) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Monthly Financial Settings
            </h3>
            <p className="text-xs text-slate-500">Configure custom salary & budget per month</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSaveMonthlySetting} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Income / Salary (₹)
            </label>
            <input
              type="number"
              value={monthIncome}
              onChange={(e) => setMonthIncome(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Monthly Budget (₹)
            </label>
            <input
              type="number"
              value={monthBudget}
              onChange={(e) => setMonthBudget(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Savings Target (₹)
            </label>
            <input
              type="number"
              value={monthSavings}
              onChange={(e) => setMonthSavings(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500"
            >
              Update {MONTH_NAMES[selectedMonth - 1]} Limits
            </button>
          </div>
        </form>
      </div>

      {/* 4. Category Management (Section 8) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">
          Manage Categories
        </h3>

        {/* Existing Categories List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60"
            >
              <div className="flex items-center gap-2 truncate">
                <span>{cat.icon}</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {cat.name}
                </span>
              </div>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="p-1 text-slate-400 hover:text-rose-500"
                title="Delete category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            placeholder="Icon (e.g. ☕)"
            value={newCatIcon}
            onChange={(e) => setNewCatIcon(e.target.value)}
            className="w-16 px-2.5 py-2 text-center text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
          <input
            type="text"
            required
            placeholder="Category name (e.g. Coffee)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
          <input
            type="number"
            placeholder="Monthly cap ₹"
            value={newCatBudget}
            onChange={(e) => setNewCatBudget(e.target.value)}
            className="w-28 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
          >
            Add
          </button>
        </form>
      </div>

      {/* 5. Payment Methods (Section 9) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">
          Payment Methods & Defaults
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className={`flex items-center justify-between p-2.5 rounded-2xl border ${
                pm.is_default
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
              }`}
            >
              <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{pm.name}</span>
                {pm.is_default && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-600 text-white">Default</span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {!pm.is_default && (
                  <button
                    onClick={() => handleSetDefaultPayment(pm.id)}
                    className="text-[10px] text-emerald-600 hover:underline"
                  >
                    Make Default
                  </button>
                )}
                <button
                  onClick={() => handleDeletePaymentMethod(pm.id)}
                  className="p-1 text-slate-400 hover:text-rose-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Method */}
        <form onSubmit={handleAddPaymentMethod} className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            required
            placeholder="New payment method (e.g. Sodexo, Amex)"
            value={newPmName}
            onChange={(e) => setNewPmName(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
          >
            Add Method
          </button>
        </form>
      </div>

      {/* 6. Data Management & Backup (Section 38 & 39) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">
          Data Backup & Maintenance
        </h3>
        <p className="text-xs text-slate-500">
          Export full multi-sheet .xlsx workbook as your personal offline backup.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleFullBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Complete Excel Backup</span>
          </button>

          <button
            onClick={() => setShowWipeModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Danger Zone: Wipe Data</span>
          </button>
        </div>
      </div>

      {/* Wipe Confirmation Modal */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-500/50 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base">Wipe All Local Data?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This action is permanent and will delete all expenses, custom categories, goals, and settings.
            </p>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Type &quot;DELETE ALL MY DATA&quot; to confirm:
              </label>
              <input
                type="text"
                value={wipeConfirmText}
                onChange={(e) => setWipeConfirmText(e.target.value)}
                placeholder="DELETE ALL MY DATA"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-rose-300 dark:border-rose-800 font-mono text-rose-600"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowWipeModal(false)}
                className="flex-1 py-2 text-xs font-semibold border rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleWipeData}
                disabled={wipeConfirmText !== 'DELETE ALL MY DATA'}
                className="flex-1 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl disabled:opacity-40"
              >
                Confirm Wipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
