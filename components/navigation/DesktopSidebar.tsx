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
  ShieldAlert,
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
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Add Expense', href: '/add', icon: PlusCircle, isHighlight: true },
    { label: 'Transactions', href: '/transactions', icon: ReceiptText },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Budgets', href: '/budgets', icon: PieChart },
    { label: 'Savings & Invest', href: '/goals', icon: Target },
    ...(profile?.role === 'admin'
      ? [{ label: 'DB Admin', href: '/admin', icon: ShieldAlert, badge: 'Super' as const }]
      : []),
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleQuickExport = async () => {
    try {
      showToast('Generating Excel workbook...', 'info');
      const now = new Date();
      const [expenses, categories, paymentMethods, monthlySetting, goals] = await Promise.all([
        getExpenses(),
        getCategories(),
        getPaymentMethods(),
        getMonthlySetting(now.getMonth() + 1, now.getFullYear()),
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
    <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-[#faf6ed] dark:bg-[#16120e] border-r-2 border-double border-amber-800/30 dark:border-amber-700/30 p-4 justify-between text-stone-900 dark:text-amber-100 select-none">
      <div className="space-y-6">
        {/* 1940s Brand Header */}
        <div className="flex items-center gap-3 px-2 py-1 border-b-2 border-double border-amber-800/20 dark:border-amber-700/30 pb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 text-amber-100 font-serif font-black text-xl shadow-md border border-amber-500/40">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-black text-lg tracking-tight text-stone-950 dark:text-amber-50">
                finTrack
              </span>
              <span className="text-[9px] font-serif font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-200/90 dark:bg-amber-950/80 text-amber-950 dark:text-amber-300 border border-amber-400/50 dark:border-amber-800">
                1940
              </span>
            </div>
            <p className="text-[10px] font-serif uppercase tracking-widest text-amber-900/80 dark:text-amber-400/80 font-bold">
              ★ Treasury Chronicle ★
            </p>
          </div>
        </div>

        {/* 1940s Navigation Ledger Items */}
        <nav className="space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            if (link.isHighlight) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-serif font-bold text-xs tracking-wide transition-all mb-3.5 shadow-sm border ${
                    isActive
                      ? 'bg-amber-800 text-amber-50 border-amber-600 shadow-amber-900/20'
                      : 'bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-amber-50 border-amber-500/50 active:scale-98'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                  <span>+ Record Voucher</span>
                </Link>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-serif transition-colors ${
                  isActive
                    ? 'bg-amber-200/70 dark:bg-amber-950/60 text-amber-950 dark:text-amber-100 font-black border border-amber-300/80 dark:border-amber-800/80 shadow-2xs'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-amber-100/60 dark:hover:bg-stone-900/60 hover:text-stone-950 dark:hover:text-amber-100 font-semibold'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-800 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'}`} />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 1940s Footer Utilities */}
      <div className="space-y-3 pt-3 border-t-2 border-double border-amber-800/20 dark:border-amber-700/30">
        {/* Quick Excel Export */}
        <button
          onClick={handleQuickExport}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-serif font-bold text-stone-800 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-stone-900 transition-colors border border-amber-800/20 dark:border-amber-700/30 bg-amber-50/60 dark:bg-stone-950/60"
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
            <span>Treasury Ledger (.xlsx)</span>
          </div>
          <span className="text-[10px] font-mono text-amber-900 dark:text-amber-400 font-bold">1940</span>
        </button>

        {/* Theme switcher */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-100/40 dark:bg-stone-900/60 text-xs border border-amber-800/15 dark:border-amber-700/20 font-serif">
          <span className="text-stone-700 dark:text-stone-400 font-bold text-[11px]">Ledger Illumination</span>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1 rounded-lg text-stone-800 dark:text-amber-200 hover:bg-amber-200/50 dark:hover:bg-stone-800 transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* User Profile Card */}
        <div className="pt-2 border-t border-amber-800/15 dark:border-amber-700/20">
          {profile ? (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-[#fffefb] dark:bg-stone-900 border border-amber-700/20 dark:border-amber-700/30 shadow-2xs">
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
                      className="w-8 h-8 rounded-full border-2 border-amber-700/50 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-800 text-amber-100 flex items-center justify-center font-serif font-black text-xs border border-amber-600">
                      {profile.display_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-900 text-amber-200 flex items-center justify-center text-[7px] border border-amber-400">
                    ⚜️
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-serif font-bold text-stone-950 dark:text-amber-100 truncate">
                    {profile.display_name}
                  </div>
                  <div className="text-[10px] font-mono text-stone-500 dark:text-stone-400 truncate">
                    {profile.email}
                  </div>
                </div>
              </button>

              <button
                onClick={signOut}
                className="p-1.5 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-800 hover:bg-amber-700 text-amber-50 font-serif font-bold text-xs shadow-sm transition-all border border-amber-600/40"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Treasury Entry</span>
            </Link>
          )}
        </div>

        {/* 1940s Sovereignty Watermark */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-serif text-amber-900/70 dark:text-amber-400/70 font-bold">
          <ShieldCheck className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" />
          <span>Series 1940 · Sovereign Vault</span>
        </div>
      </div>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </aside>
  );
}
