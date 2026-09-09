'use client';

import React from 'react';
import { LayoutDashboard, BarChart3, ReceiptText, Wallet, Sparkles } from 'lucide-react';

export type DashboardTabType = 'overview' | 'analytics' | 'transactions' | 'salary';

interface DashboardTabsProps {
  activeTab: DashboardTabType;
  onChangeTab: (tab: DashboardTabType) => void;
  transactionCount?: number;
}

export function DashboardTabs({ activeTab, onChangeTab, transactionCount = 0 }: DashboardTabsProps) {
  const tabs: { id: DashboardTabType; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics Mix', icon: BarChart3, badge: 'Pie & Trends' },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText, badge: transactionCount > 0 ? transactionCount : undefined },
    { id: 'salary', label: 'Salary & Budget', icon: Wallet },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 select-none active:scale-95 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span>{tab.label}</span>

              {tab.badge && (
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
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
