'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ReceiptText, Plus, BarChart3, Settings } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Transactions', href: '/transactions', icon: ReceiptText },
    { label: 'Add', href: '/add', icon: Plus, isAction: true },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/80 backdrop-blur-xl border-t border-sky-100 dark:border-slate-800/80 pb-safe shadow-lg">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-4 flex items-center justify-center w-14 h-14 rounded-full bg-sky-600 dark:bg-emerald-600 text-white shadow-lg shadow-sky-600/30 dark:shadow-emerald-600/30 hover:bg-sky-500 active:scale-95 transition-all"
                aria-label="Add Expense"
              >
                <Plus className="w-7 h-7 stroke-[2.5]" />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full py-1 text-xs transition-colors ${
                isActive
                  ? 'text-sky-600 dark:text-emerald-400 font-black'
                  : 'text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-slate-200 font-semibold'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
