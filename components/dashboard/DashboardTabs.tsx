'use client';

import React from 'react';
import { LayoutDashboard, BarChart3, ReceiptText, Wallet, ScrollText, Landmark } from 'lucide-react';

export type DashboardTabType = 'overview' | 'portfolio' | 'balance-sheet' | 'analytics' | 'transactions' | 'salary';

interface DashboardTabsProps {
  activeTab: DashboardTabType;
  onChangeTab: (tab: DashboardTabType) => void;
  transactionCount?: number;
}

export function DashboardTabs({ activeTab, onChangeTab, transactionCount = 0 }: DashboardTabsProps) {
  const tabs: { id: DashboardTabType; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'overview', label: 'Daily Gazette', icon: LayoutDashboard },
    { id: 'portfolio', label: '1940s Vaults', icon: Landmark, badge: 'Vaults' },
    { id: 'balance-sheet', label: 'Monthly Ledgers', icon: ScrollText, badge: 'Archive' },
    { id: 'analytics', label: 'Actuarial Audits', icon: BarChart3 },
    { id: 'transactions', label: 'Teller Journal', icon: ReceiptText, badge: transactionCount > 0 ? transactionCount : undefined },
    { id: 'salary', label: 'Treasury Allotment', icon: Wallet },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1">
      <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#faf6ed] dark:bg-[#1a1510] border-2 border-double border-amber-800/30 dark:border-amber-700/40 shadow-sm min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all duration-200 select-none active:scale-95 ${
                isActive
                  ? 'bg-amber-800 text-amber-50 shadow-md shadow-amber-950/25 border border-amber-600/50'
                  : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-amber-100 hover:bg-amber-200/40 dark:hover:bg-amber-950/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'stroke-[2.5] text-amber-300' : 'stroke-[1.8]'}`} />
              <span>{tab.label}</span>

              {tab.badge && (
                <span
                  className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors border ${
                    isActive
                      ? 'bg-amber-900/80 text-amber-200 border-amber-600/60'
                      : 'bg-amber-200/70 dark:bg-amber-950/70 text-amber-950 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/80'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

