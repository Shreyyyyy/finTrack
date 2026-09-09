'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ReceiptText,
  PlusCircle,
  BarChart3,
  PieChart,
  Target,
  Settings,
  FileSpreadsheet,
  Moon,
  Sun,
  ShieldCheck,
  LogIn,
  LogOut
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/providers/AuthProvider';
import { exportToExcel } from '@/lib/excel/exporter';
import { getExpenses, getCategories, getPaymentMethods, getMonthlySetting, getGoals } from '@/lib/data/store';
import { showToast } from '@/components/ui/Toast';
import { ProfileModal } from '@/components/profile/ProfileModal';

export function DesktopSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const navLinks = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Add Expense', href: '/add', icon: PlusCircle, isHighlight: true },
    { label: 'Transactions', href: '/transactions', icon: ReceiptText },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Budgets', href: '/budgets', icon: PieChart },
    { label: 'Goals', href: '/goals', icon: Target },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleQuickExport = async () => {
    try {
      showToast('Generating Excel workbook...', 'info');
      const [expenses, categories, paymentMethods, monthlySetting, goals] = await Promise.all([
        getExpenses(),
        getCategories(),
        getPaymentMethods(),
        getMonthlySetting(9, 2026),
        getGoals(),
      ]);

      exportToExcel({
        expenses,
        categories,
        paymentMethods,
        monthlySetting,
        goals,
        scope: 'all',
      });
      showToast('Excel exported ✓', 'success');
    } catch (err) {
      console.error(err);
      showToast('Export failed. Please try again.', 'error');
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 p-4 justify-between">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold text-xl shadow-md shadow-emerald-600/20">
            ₹
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              finTrack
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Personal
              </span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">Zero AI · Instant Utility</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            if (link.isHighlight) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all mb-3 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-900 text-slate-950 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Utilities */}
      <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
        {/* Quick Excel Export */}
        <button
          onClick={handleQuickExport}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export to Excel</span>
          </div>
          <span className="text-[10px] text-slate-600 dark:text-slate-400">.xlsx</span>
        </button>

        {/* Theme switcher */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-xs">
          <span className="text-slate-600 dark:text-slate-400">Appearance</span>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* User Profile Card */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
          {profile ? (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity"
                title="Edit profile & photo"
              >
                <div className="relative shrink-0">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-8 h-8 rounded-full border border-emerald-500/40 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {profile.display_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center text-[7px] shadow-sm">
                    📷
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {profile.display_name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {profile.email}
                  </div>
                </div>
              </button>

              <button
                onClick={signOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs shadow-sm hover:opacity-90 active:scale-98 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Google</span>
            </Link>
          )}
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-1.5 px-3 py-0.5 text-[11px] text-slate-600 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Private & secure ($0/mo)</span>
        </div>
      </div>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </aside>
  );
}
