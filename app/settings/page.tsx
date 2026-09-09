'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  CreditCard,
  Tag,
  Key,
  Smartphone,
  ChevronRight,
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
import { ProfileModal } from '@/components/profile/ProfileModal';
import { Camera } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, profile, signInWithGoogle, signOut, isConfigured } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [defaultPayment, setDefaultPayment] = useState('UPI');

  // Month selector for monthly income configuration
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthIncome, setMonthIncome] = useState('0');
  const [monthBudget, setMonthBudget] = useState('0');
  const [monthSavings, setMonthSavings] = useState('0');

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
    loadAll();
  };

  // Generate API Key for Shortcuts
  const handleGenerateApiKey = async () => {
    const keyName = prompt('Enter a name for this device / API key:', `Phone ${apiKeys.length + 1}`) || `Device Key ${Date.now().toString().slice(-4)}`;
    const currentUid = user?.id || profile?.id;
    await createApiKey(keyName, currentUid);
    showToast(`New API Key "${keyName}" generated ✓`, 'success');
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
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">
          Settings & Utilities
        </h1>
        <p className="text-xs text-slate-700 dark:text-slate-400 font-semibold mt-0.5">
          Customize your preferences, categories, payment methods, and Apple Shortcut integrations.
        </p>
      </div>

      {/* 0. Account & Profile */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-sky-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
              My Profile & Account
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-500 mt-0.5 font-medium">
              Personal display name, photo, and authentication status
            </p>
          </div>
          {user && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900 dark:bg-emerald-950 dark:text-emerald-300">
              Active Session
            </span>
          )}
        </div>

        {profile ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-sky-50/70 dark:bg-slate-800/40 border border-sky-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-14 h-14 rounded-full border-2 border-sky-400 object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center font-black text-xl shadow-sm">
                    {profile?.display_name?.charAt(0) || 'U'}
                  </div>
                )}
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-sky-600 text-white shadow-md hover:bg-sky-500 active:scale-95 transition-transform"
                  title="Change Picture"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <div>
                <div className="font-bold text-sm text-black dark:text-white flex items-center gap-2">
                  <span>{profile?.display_name || 'Personal User'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 dark:bg-emerald-950 text-sky-800 dark:text-emerald-300 font-bold">
                    {user ? 'Google' : 'Active Profile'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">{profile?.email}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Default Payment: <span className="font-bold text-black dark:text-slate-300">{profile?.default_payment_method || 'UPI'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-sky-800 dark:text-sky-300 bg-sky-100/80 dark:bg-emerald-950/40 border border-sky-200 dark:border-emerald-800/60 hover:bg-sky-200/80 dark:hover:bg-emerald-900/60 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Edit Photo & Profile</span>
              </button>

              <button
                onClick={signOut}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-slate-800/40 border border-sky-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-sm text-black dark:text-white">
                Not signed in
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">
                Sign in to isolate and sync your personal data securely with your Google or Email account.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={signInWithGoogle}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>
              <Link
                href="/login"
                className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-sky-100 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-800 text-xs font-bold text-black dark:text-slate-200 transition-all active:scale-95"
              >
                <span>Sign In Page</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Database & Admin Console (Only visible to admin) */}
      {profile?.role === 'admin' && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Database Admin Console</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  Master View
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect all registered people, cross-user expenses, and global database metrics.
              </p>
            </div>
          </div>

          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shrink-0 transition-all active:scale-95 shadow-sm shadow-sky-600/20"
          >
            <span>Open Admin Portal</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 1. Appearance / Theme */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-sky-100 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
          Display Theme
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 ${
              theme === 'light'
                ? 'bg-sky-100 text-black border-sky-400 shadow-sm'
                : 'bg-sky-50/60 dark:bg-slate-850 border-sky-100 dark:border-slate-700 text-slate-800 dark:text-slate-300'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Light</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 ${
              theme === 'dark'
                ? 'bg-sky-950/80 text-sky-300 border-sky-500 shadow-sm'
                : 'bg-sky-50/60 dark:bg-slate-850 border-sky-100 dark:border-slate-700 text-slate-800 dark:text-slate-300'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`flex-1 py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 ${
              theme === 'system'
                ? 'bg-sky-100 dark:bg-sky-950/80 text-black dark:text-sky-300 border-sky-400 font-bold shadow-sm'
                : 'bg-sky-50/60 dark:bg-slate-850 border-sky-100 dark:border-slate-700 text-slate-800 dark:text-slate-300'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* 2. Apple Shortcut & Back Tap Setup */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-sky-100 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-sky-600 dark:text-emerald-500" />
            <div>
              <h3 className="font-black text-base text-black dark:text-white">
                iPhone Back Tap & Apple Shortcut API
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">Record expenses in &lt; 5 seconds from your lock screen</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/expenses/logs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 dark:bg-slate-800 text-black dark:text-slate-300 hover:bg-sky-100 border border-sky-100 dark:border-slate-700 transition-colors"
            >
              <span>Live Logs ↗</span>
            </a>
            <button
              onClick={handleGenerateApiKey}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New API Key</span>
            </button>
          </div>
        </div>

        {/* API Endpoint Box */}
        <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-black dark:text-slate-300">
            <span>Shortcut Webhook URL (POST)</span>
            <button
              onClick={() => copyToClipboard(quickApiUrl, false)}
              className="text-sky-700 hover:underline flex items-center gap-1 font-bold"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>
          <div className="font-mono text-xs text-black dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-sky-100 dark:border-slate-700 select-all overflow-x-auto font-semibold">
            {quickApiUrl}
          </div>
        </div>

        {/* Active API Keys */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase">Active Shortcut Keys</label>
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-sky-50/70 dark:bg-slate-800/40 border border-sky-100 dark:border-slate-800"
            >
              <div>
                <div className="font-bold text-xs text-black dark:text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>{key.name}</span>
                </div>
                <div className="font-mono text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-semibold">
                  {key.key_hash.substring(0, 16)}••••••••
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(key.key_hash, true)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-black dark:hover:text-white"
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
        <div className="p-4 rounded-2xl bg-sky-50/80 dark:bg-emerald-950/20 border border-sky-200/80 dark:border-emerald-800/50 space-y-2 text-xs">
          <div className="font-bold text-sky-950 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-sky-600 dark:text-emerald-500" />
            <span>How to configure Apple Shortcut with iPhone Back Tap:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-800 dark:text-slate-300 font-medium">
            <li>Open the <strong>Shortcuts</strong> app on your iPhone and tap <strong>+</strong>.</li>
            <li>Add action: <strong>Ask for Input</strong> (Type: Number, Prompt: &quot;Amount ₹&quot;).</li>
            <li>Add action: <strong>Choose from List</strong> (Items: Food, Transport, Shopping, Bills, Other).</li>
            <li>Add action: <strong>Get Contents of URL</strong>:
              <ul className="list-disc list-inside ml-4 mt-0.5 text-slate-700 dark:text-slate-400">
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

      {/* 3. Monthly Income & Budget History */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-sky-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-base text-black dark:text-white">
              Monthly Financial Settings
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">Configure custom salary & budget per month</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-sky-50/70 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 font-bold text-black dark:text-white"
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
              className="text-xs px-2.5 py-1.5 rounded-xl bg-sky-50/70 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 font-bold text-black dark:text-white"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSaveMonthlySetting} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-black dark:text-slate-300 mb-1">
              Income / Salary (₹)
            </label>
            <input
              type="number"
              value={monthIncome}
              onChange={(e) => setMonthIncome(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-sky-50/70 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 font-bold text-black dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black dark:text-slate-300 mb-1">
              Monthly Budget (₹)
            </label>
            <input
              type="number"
              value={monthBudget}
              onChange={(e) => setMonthBudget(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-sky-50/70 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 font-bold text-black dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black dark:text-slate-300 mb-1">
              Savings Target (₹)
            </label>
            <input
              type="number"
              value={monthSavings}
              onChange={(e) => setMonthSavings(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-sky-50/70 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 font-bold text-black dark:text-white"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-500 shadow-sm"
            >
              Update {MONTH_NAMES[selectedMonth - 1]} Limits
            </button>
          </div>
        </form>
      </div>

      {/* 4. Category Management */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-sky-100 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-black text-base text-black dark:text-white">
          Manage Categories
        </h3>

        {/* Existing Categories List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-sky-50/70 dark:bg-slate-800/50 border border-sky-100 dark:border-slate-700/60"
            >
              <div className="flex items-center gap-2 truncate">
                <span>{cat.icon}</span>
                <span className="text-xs font-bold text-black dark:text-slate-200 truncate">
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
        <form onSubmit={handleAddCategory} className="pt-2 border-t border-sky-100 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            placeholder="Icon (e.g. ☕)"
            value={newCatIcon}
            onChange={(e) => setNewCatIcon(e.target.value)}
            className="w-16 px-2.5 py-2 text-center text-sm rounded-xl bg-sky-50/70 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 font-bold text-black dark:text-white"
          />
          <input
            type="text"
            required
            placeholder="Category name (e.g. Coffee)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-sky-50/70 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 font-bold text-black dark:text-white"
          />
          <input
            type="number"
            placeholder="Monthly cap ₹"
            value={newCatBudget}
            onChange={(e) => setNewCatBudget(e.target.value)}
            className="w-28 px-3 py-2 text-xs rounded-xl bg-sky-50/70 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 font-bold text-black dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-500 shadow-sm"
          >
            Add
          </button>
        </form>
      </div>

      {/* 5. Payment Methods */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-sky-100 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-black text-base text-black dark:text-white">
          Payment Methods & Defaults
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className={`flex items-center justify-between p-2.5 rounded-2xl border ${
                pm.is_default
                  ? 'border-sky-500 bg-sky-100/90 dark:bg-sky-950/40 text-black dark:text-sky-200 font-bold'
                  : 'border-sky-100 dark:border-slate-700 bg-sky-50/70 dark:bg-slate-800/50 text-black dark:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold truncate flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{pm.name}</span>
                {pm.is_default && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-sky-600 text-white">Default</span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {!pm.is_default && (
                  <button
                    onClick={() => handleSetDefaultPayment(pm.id)}
                    className="text-[10px] font-bold text-sky-700 hover:underline"
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
        <form onSubmit={handleAddPaymentMethod} className="pt-2 border-t border-sky-100 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            required
            placeholder="New payment method (e.g. Sodexo, Amex)"
            value={newPmName}
            onChange={(e) => setNewPmName(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-sky-50/70 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 font-bold text-black dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-500 shadow-sm"
          >
            Add Method
          </button>
        </form>
      </div>

      {/* 6. Data Management & Backup */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-sky-100 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-black text-base text-black dark:text-white">
          Data Backup & Maintenance
        </h3>
        <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">
          Export full multi-sheet .xlsx workbook as your personal offline backup.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleFullBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-500 shadow-md shadow-sky-600/20"
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
            <p className="text-xs text-slate-700 dark:text-slate-400 leading-relaxed font-medium">
              This action is permanent and will delete all expenses, custom categories, goals, and settings.
            </p>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-700 dark:text-slate-400 mb-1">
                Type &quot;DELETE ALL MY DATA&quot; to confirm:
              </label>
              <input
                type="text"
                value={wipeConfirmText}
                onChange={(e) => setWipeConfirmText(e.target.value)}
                placeholder="DELETE ALL MY DATA"
                className="w-full px-3 py-2 text-xs rounded-xl bg-sky-50 dark:bg-slate-800 border border-rose-300 dark:border-rose-800 font-mono text-rose-600 font-bold"
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

      {/* Profile & Photo Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}
