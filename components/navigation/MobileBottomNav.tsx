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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf6ed]/95 dark:bg-[#16120e]/90 backdrop-blur-xl border-t-2 border-double border-amber-800/30 dark:border-amber-700/30 pb-safe shadow-lg">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-3.5 flex items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 text-amber-100 shadow-lg shadow-amber-950/30 hover:brightness-110 active:scale-95 transition-all border-2 border-amber-500/60"
                aria-label="Add Expense"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full py-1 text-xs transition-colors ${
                isActive
                  ? 'text-amber-950 dark:text-amber-300 font-serif font-black'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-amber-200 font-serif font-semibold'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 mb-1 ${isActive ? 'stroke-[2.5] text-amber-800 dark:text-amber-400' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
