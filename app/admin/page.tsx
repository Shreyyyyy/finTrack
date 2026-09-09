'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  ReceiptText,
  DollarSign,
  Database,
  Search,
  Filter,
  FileSpreadsheet,
  Trash2,
  UserCheck,
  UserX,
  ExternalLink,
  ChevronRight,
  Eye,
  CheckCircle2,
  Lock,
  KeyRound,
  Sparkles,
  ArrowLeft,
  X,
  Plus
} from 'lucide-react';
import { Profile, Expense, UserSummary, Category, PaymentMethod } from '@/types';
import {
  getAllUsersSummary,
  getAllExpensesMaster,
  updateUserRole,
  deleteUserAccount,
  getCategories,
  getPaymentMethods,
  getMonthlySetting,
  getGoals,
  saveProfile,
  DATA_CHANGE_EVENT
} from '@/lib/data/store';
import { useAuth } from '@/components/providers/AuthProvider';
import { formatINR, formatDateIndian } from '@/lib/formatting/formatters';
import { exportToExcel } from '@/lib/excel/exporter';
import { showToast } from '@/components/ui/Toast';

export default function DbAdminPage() {
  const { profile: currentProfile } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<boolean>(false);

  const [usersSummary, setUsersSummary] = useState<UserSummary[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Inspection Drawer
  const [inspectingUser, setInspectingUser] = useState<UserSummary | null>(null);

  // New Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberEmail, setNewMemberEmail] = useState<string>('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>('member');

  // Check if current user is admin automatically
  useEffect(() => {
    if (currentProfile?.role === 'admin') {
      setIsUnlocked(true);
    }
  }, [currentProfile]);

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [summaries, expenses, cats, pms] = await Promise.all([
        getAllUsersSummary(),
        getAllExpensesMaster(),
        getCategories(),
        getPaymentMethods(),
      ]);

      setUsersSummary(summaries);
      setAllExpenses(expenses);
      setCategories(cats);
      setPaymentMethods(pms);
    } catch (err) {
      console.error('Error loading admin data:', err);
      showToast('Failed to load DB admin records', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      loadAdminData();
    }
    const handleStoreChange = () => {
      if (isUnlocked) loadAdminData();
    };
    window.addEventListener(DATA_CHANGE_EVENT, handleStoreChange);
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, handleStoreChange);
    };
  }, [isUnlocked, loadAdminData]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin code is admin2026 or finTrack
    if (passcode.trim() === 'admin2026' || passcode.trim().toLowerCase() === 'fintrack' || currentProfile?.role === 'admin') {
      setIsUnlocked(true);
      setPasscodeError(false);
      showToast('DB Admin Access Granted ✓', 'success');
    } else {
      setPasscodeError(true);
      showToast('Invalid Admin Passcode', 'error');
    }
  };

  const handleToggleRole = async (user: UserSummary) => {
    const nextRole = user.profile.role === 'admin' ? 'member' : 'admin';
    const ok = await updateUserRole(user.profile.id, nextRole);
    if (ok) {
      showToast(`${user.profile.display_name} role changed to ${nextRole.toUpperCase()} ✓`, 'success');
      loadAdminData();
    } else {
      showToast('Failed to change role', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName} and their data from the database?`)) {
      return;
    }
    const ok = await deleteUserAccount(userId);
    if (ok) {
      showToast(`User ${userName} deleted ✓`, 'success');
      if (inspectingUser?.profile.id === userId) {
        setInspectingUser(null);
      }
      loadAdminData();
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }

    try {
      const newId = `usr-${Date.now()}`;
      await saveProfile({
        id: newId,
        display_name: newMemberName.trim(),
        email: newMemberEmail.trim().toLowerCase(),
        role: newMemberRole,
        currency: 'INR',
        default_payment_method: 'UPI',
        avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      });

      showToast(`Account created for ${newMemberName} ✓`, 'success');
      setShowAddMemberModal(false);
      setNewMemberName('');
      setNewMemberEmail('');
      loadAdminData();
    } catch {
      showToast('Failed to create account', 'error');
    }
  };

  const handleExportMasterDb = async () => {
    try {
      showToast('Generating Master DB Workbook...', 'info');
      const [monthlySetting, goals] = await Promise.all([
        getMonthlySetting(9, 2026),
        getGoals(),
      ]);

      exportToExcel({
        expenses: allExpenses,
        categories,
        paymentMethods,
        monthlySetting,
        goals,
        scope: 'all',
      });
      showToast('Master Database Excel Exported ✓', 'success');
    } catch (err) {
      console.error(err);
      showToast('Export failed', 'error');
    }
  };

  // Calculations
  const totalVolume = useMemo(
    () => allExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [allExpenses]
  );

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((exp) => {
      // User filter
      if (selectedUserFilter !== 'all' && exp.user_id !== selectedUserFilter) {
        return false;
      }
      // Category filter
      if (selectedCategoryFilter !== 'all' && exp.category_id !== selectedCategoryFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMerchant = exp.merchant?.toLowerCase().includes(q);
        const matchesNote = exp.note?.toLowerCase().includes(q);
        const matchesCategory = exp.category?.name.toLowerCase().includes(q);
        const matchesUser = exp.profile?.display_name.toLowerCase().includes(q);
        return matchesMerchant || matchesNote || matchesCategory || matchesUser;
      }
      return true;
    });
  }, [allExpenses, selectedUserFilter, selectedCategoryFilter, searchQuery]);

  // If locked, render the secure authentication gate
  if (!isUnlocked) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
          Database Admin Access
        </h1>
        <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
          Authorized administrative access to inspect all database accounts, cross-user expenses, and system controls.
        </p>

        <form onSubmit={handleUnlock} className="w-full mt-8 space-y-4">
          <div className="relative">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter Admin Passcode (admin2026)"
              className={`w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border ${
                passcodeError
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500'
              } text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-sm`}
              autoFocus
            />
            <div className="absolute right-3.5 top-3.5 text-slate-400">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
          >
            Unlock DB Admin Console
          </button>
        </form>

        <div className="mt-6 flex items-center gap-2">
          <button
            onClick={() => {
              setPasscode('admin2026');
              setIsUnlocked(true);
            }}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
          >
            Quick 1-Tap Owner Unlock
          </button>
          <span className="text-slate-400">•</span>
          <Link href="/" className="text-xs text-slate-500 hover:underline font-semibold">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-4 py-4 sm:py-6 md:py-8 space-y-6">
      {/* Header & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Central Master DB
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
              <span>Database Admin Console</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Super Admin
              </span>
            </h1>
          </div>
        </div>

        {/* Global Admin Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>

          <button
            onClick={handleExportMasterDb}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm active:scale-95 shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Master DB</span>
          </button>
        </div>
      </div>

      {/* 1. Global KPI Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Accounts</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            {usersSummary.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {usersSummary.filter((u) => u.profile.role === 'admin').length} Admins · {usersSummary.filter((u) => u.profile.role !== 'admin').length} Members
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Transactions</span>
            <ReceiptText className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            {allExpenses.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all registered people</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Volume Spent</span>
            <DollarSign className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            {formatINR(totalVolume)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cumulative lifetime entries</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-emerald-500/30 bg-emerald-500/[0.02] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Database Engine</span>
            <Database className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-sm font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Supabase Central DB</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
            fevaiyvteprczsebejbg.supabase.co
          </div>
        </div>
      </div>

      {/* 2. Registered Accounts Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Household Accounts Directory</span>
              <span className="text-xs font-normal text-slate-500">({usersSummary.length} profiles)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Manage account roles, inspect individual ledger data, or remove redundant accounts.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Person / Account</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Expenses Count</th>
                <th className="py-2.5 px-3">Total Spent</th>
                <th className="py-2.5 px-3">Monthly Budget</th>
                <th className="py-2.5 px-3">Goals</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {usersSummary.map((summary) => {
                const isAdmin = summary.profile.role === 'admin';
                return (
                  <tr key={summary.profile.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {summary.profile.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={summary.profile.avatar_url}
                            alt={summary.profile.display_name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center">
                            {summary.profile.display_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{summary.profile.display_name}</span>
                            {currentProfile?.id === summary.profile.id && (
                              <span className="text-[9px] font-black uppercase px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{summary.profile.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isAdmin
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {isAdmin ? <ShieldCheck className="w-3 h-3" /> : null}
                        <span>{isAdmin ? 'Admin' : 'Member'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                      {summary.expenseCount} entries
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {formatINR(summary.totalSpent)}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">
                      {formatINR(summary.monthlyBudget)}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">
                      {summary.goalsCount} active
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectingUser(summary)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          title="Inspect user financial ledger"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>

                        <button
                          onClick={() => handleToggleRole(summary)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                            isAdmin
                              ? 'border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              : 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title="Toggle between Admin and Member role"
                        >
                          {isAdmin ? 'Demote' : 'Make Admin'}
                        </button>

                        {usersSummary.length > 1 && (
                          <button
                            onClick={() => handleDeleteUser(summary.profile.id, summary.profile.display_name)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete user account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Global Cross-Account Ledger */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Master Cross-Account Ledger</span>
              <span className="text-xs font-normal text-slate-500">({filteredExpenses.length} entries)</span>
            </h2>
            <p className="text-xs text-slate-500">
              All financial transactions across all accounts in your central database.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 outline-none w-48 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>

            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border-none font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">All People</option>
              {usersSummary.map((u) => (
                <option key={u.profile.id} value={u.profile.id}>
                  {u.profile.display_name}
                </option>
              ))}
            </select>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border-none font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <ReceiptText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">No matching transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Person</th>
                  <th className="py-2.5 px-3">Merchant / Note</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredExpenses.slice(0, 50).map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDateIndian(expense.expense_date)}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {expense.profile?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={expense.profile.avatar_url}
                            alt={expense.profile.display_name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center">
                            {expense.profile?.display_name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {expense.profile?.display_name || 'Member'}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {expense.merchant || 'Expense'}
                      </div>
                      {expense.note && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{expense.note}</div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <span>{expense.category?.icon || '💰'}</span>
                        <span>{expense.category?.name || 'Other'}</span>
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {expense.payment_method?.name || 'UPI'}
                    </td>

                    <td className="py-2.5 px-3 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      -{formatINR(expense.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredExpenses.length > 50 && (
              <div className="text-center py-2 text-xs text-slate-400">
                Showing first 50 of {filteredExpenses.length} transactions. Use Export Master DB for complete records.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Supabase DB SQL Migration Guide Card */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl p-5 sm:p-6 text-white border border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Supabase Admin SQL Migration Ready
            </h3>
          </div>
          <a
            href="https://supabase.com/dashboard/project/fevaiyvteprczsebejbg/sql"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-400 hover:underline font-bold"
          >
            <span>Open Supabase SQL Editor</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The migration script in <code className="text-emerald-400">supabase/admin_migration.sql</code> updates your central database with the <code className="text-emerald-400">role</code> column, creates the <code className="text-emerald-400">is_admin()</code> function, and adds admin Row Level Security (RLS) policies so admins can inspect all people across the database.
        </p>
      </div>

      {/* User Inspection Modal */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {inspectingUser.profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={inspectingUser.profile.avatar_url}
                    alt={inspectingUser.profile.display_name}
                    className="w-10 h-10 rounded-full object-cover border border-emerald-500"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                    {inspectingUser.profile.display_name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{inspectingUser.profile.display_name}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {inspectingUser.profile.role || 'member'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{inspectingUser.profile.email}</div>
                </div>
              </div>
              <button
                onClick={() => setInspectingUser(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics */}
            <div className="p-5 border-b border-slate-100 dark:divide-slate-800 grid grid-cols-3 gap-3 text-center bg-slate-50 dark:bg-slate-950/40">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Expenses</span>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  {inspectingUser.expenseCount}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Total Spent</span>
                <div className="text-base font-black text-rose-600 dark:text-rose-400">
                  {formatINR(inspectingUser.totalSpent)}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Monthly Budget</span>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {formatINR(inspectingUser.monthlyBudget)}
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Personal Ledger History
              </h4>
              {allExpenses.filter((e) => e.user_id === inspectingUser.profile.id).length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No personal expenses recorded for this user yet.
                </p>
              ) : (
                allExpenses
                  .filter((e) => e.user_id === inspectingUser.profile.id)
                  .map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{e.category?.icon || '💰'}</span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {e.merchant || 'Expense'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatDateIndian(e.expense_date)} · {e.category?.name}
                          </div>
                        </div>
                      </div>
                      <div className="font-black text-rose-600 dark:text-rose-400">
                        -{formatINR(e.amount)}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Account Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Account</h3>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. John"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="e.g. john@fintrack.local"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMemberRole('member')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      newMemberRole === 'member'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMemberRole('admin')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      newMemberRole === 'admin'
                        ? 'bg-emerald-600 text-white border-transparent'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
