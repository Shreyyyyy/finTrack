'use client';

import React, { useState, useMemo } from 'react';
import {
  ScrollText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Scale,
  Landmark,
  FileSpreadsheet,
} from 'lucide-react';
import { Expense, MonthlySetting, Category } from '@/types';
import { formatINR, formatPercentage, MONTH_NAMES } from '@/lib/formatting/formatters';

interface MonthlyBalanceSheetArchiveProps {
  expenses: Expense[];
  categories: Category[];
  currentSelectedMonth: number;
  currentSelectedYear: number;
  onSelectMonthYear: (month: number, year: number) => void;
}

interface MonthLedgerRecord {
  month: number;
  year: number;
  key: string;
  totalInflow: number;
  totalOutflow: number;
  netSurplus: number;
  savingsRate: number;
  txCount: number;
  needsOutflow: number;
  wantsOutflow: number;
  topCategoryName: string;
  topCategoryAmount: number;
}

export function MonthlyBalanceSheetArchive({
  expenses,
  categories,
  currentSelectedMonth,
  currentSelectedYear,
  onSelectMonthYear,
}: MonthlyBalanceSheetArchiveProps) {
  const currentDate = new Date();
  const currentCalMonth = currentDate.getMonth() + 1;
  const currentCalYear = currentDate.getFullYear();

  // Local state for which sheet is being inspected
  const [inspectedMonth, setInspectedMonth] = useState<number>(currentSelectedMonth);
  const [inspectedYear, setInspectedYear] = useState<number>(currentSelectedYear);

  // Category Map
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Aggregate all recorded historical months from transactions
  const historicalLedgers = useMemo<MonthLedgerRecord[]>(() => {
    const map = new Map<string, { month: number; year: number; items: Expense[] }>();

    // Always include current month and previous month even if 0 expenses yet
    const ensureMonth = (m: number, y: number) => {
      const k = `${y}-${String(m).padStart(2, '0')}`;
      if (!map.has(k)) {
        map.set(k, { month: m, year: y, items: [] });
      }
    };

    ensureMonth(currentCalMonth, currentCalYear);
    const prevMonth = currentCalMonth === 1 ? 12 : currentCalMonth - 1;
    const prevYear = currentCalMonth === 1 ? currentCalYear - 1 : currentCalYear;
    ensureMonth(prevMonth, prevYear);

    // Group all user expenses
    expenses.forEach((e) => {
      if (!e.expense_date) return;
      const parts = e.expense_date.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (isNaN(y) || isNaN(m)) return;
      const k = `${y}-${String(m).padStart(2, '0')}`;
      if (!map.has(k)) {
        map.set(k, { month: m, year: y, items: [] });
      }
      map.get(k)!.items.push(e);
    });

    // Compute metrics per month
    const records: MonthLedgerRecord[] = [];
    map.forEach(({ month, year, items }, key) => {
      let inflow = 0;
      let outflow = 0;
      let needs = 0;
      let wants = 0;
      const catTotals: Record<string, number> = {};

      items.forEach((item) => {
        const amt = Number(item.amount) || 0;
        if (item.type === 'income') {
          inflow += amt;
        } else {
          outflow += amt;
          const cat = categoryMap.get(item.category_id || '');
          if (cat?.group === 'needs') needs += amt;
          else wants += amt;

          const catName = cat?.name || 'Other';
          catTotals[catName] = (catTotals[catName] || 0) + amt;
        }
      });

      let topCat = 'None';
      let maxCatAmt = 0;
      Object.entries(catTotals).forEach(([cName, cAmt]) => {
        if (cAmt > maxCatAmt) {
          maxCatAmt = cAmt;
          topCat = cName;
        }
      });

      const netSurplus = inflow - outflow;
      const savingsRate = inflow > 0 ? (netSurplus / inflow) * 100 : 0;

      records.push({
        month,
        year,
        key,
        totalInflow: inflow,
        totalOutflow: outflow,
        netSurplus,
        savingsRate,
        txCount: items.length,
        needsOutflow: needs,
        wantsOutflow: wants,
        topCategoryName: topCat,
        topCategoryAmount: maxCatAmt,
      });
    });

    // Sort descending (latest month first)
    return records.sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month));
  }, [expenses, currentCalMonth, currentCalYear, categoryMap]);

  // Current inspected month ledger data
  const activeRecord = useMemo(() => {
    const found = historicalLedgers.find(
      (r) => r.month === inspectedMonth && r.year === inspectedYear
    );
    if (found) return found;
    return {
      month: inspectedMonth,
      year: inspectedYear,
      key: `${inspectedYear}-${String(inspectedMonth).padStart(2, '0')}`,
      totalInflow: 0,
      totalOutflow: 0,
      netSurplus: 0,
      savingsRate: 0,
      txCount: 0,
      needsOutflow: 0,
      wantsOutflow: 0,
      topCategoryName: 'None',
      topCategoryAmount: 0,
    };
  }, [historicalLedgers, inspectedMonth, inspectedYear]);

  // Items in the active inspected month
  const activeMonthItems = useMemo(() => {
    return expenses
      .filter((e) => {
        if (!e.expense_date) return false;
        const parts = e.expense_date.split('-');
        return (
          parseInt(parts[0], 10) === inspectedYear &&
          parseInt(parts[1], 10) === inspectedMonth
        );
      })
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  }, [expenses, inspectedMonth, inspectedYear]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. ARCHIVAL ZERO-REFRESH GUARANTEE BANNER */}
      <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 text-white rounded-3xl p-6 border-2 border-double border-amber-600/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400 font-serif">
                  Official Treasury Archive
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Est. 1940
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5 font-serif">
                Monthly Zero-Reset & Historical Balance Sheets
              </h2>
              <p className="text-xs text-amber-200/80 font-medium mt-1">
                On the 1st of every month, active operational spending automatically refreshes to ₹0. All previous months are permanently preserved in historical Balance Sheets below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setInspectedMonth(currentCalMonth);
                setInspectedYear(currentCalYear);
                onSelectMonthYear(currentCalMonth, currentCalYear);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md transition-all active:scale-95"
            >
              Current Month (₹0 Reset)
            </button>
          </div>
        </div>
      </div>

      {/* 2. THE 1940s VINTAGE BALANCE SHEET STATEMENT */}
      <div className="bg-[#fcf8ed] dark:bg-[#181410] rounded-3xl p-6 sm:p-8 border-2 border-double border-amber-700/40 dark:border-amber-600/30 shadow-xl relative text-stone-900 dark:text-amber-100">
        {/* Vintage Header with Ornamental Stamp */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-double border-amber-800/30 dark:border-amber-700/40 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-900 dark:text-amber-400 font-serif">
              <span>⚜️ GENERAL REVENUE & EXPENDITURE LEDGER</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-stone-950 dark:text-amber-50 mt-1 font-serif tracking-tight">
              Balance Sheet: {MONTH_NAMES[inspectedMonth - 1]} {inspectedYear}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-serif italic mt-0.5">
              Verified financial statement of income inflows, operational debits & retained capital.
            </p>
          </div>

          {/* Month Inspector Navigator */}
          <div className="flex items-center gap-2 bg-white dark:bg-stone-900 p-1.5 rounded-2xl border border-amber-700/30 dark:border-amber-700/40 shadow-xs">
            <button
              onClick={() => {
                const prevM = inspectedMonth === 1 ? 12 : inspectedMonth - 1;
                const prevY = inspectedMonth === 1 ? inspectedYear - 1 : inspectedYear;
                setInspectedMonth(prevM);
                setInspectedYear(prevY);
              }}
              className="p-1.5 rounded-xl hover:bg-amber-100 dark:hover:bg-stone-800 text-amber-900 dark:text-amber-300 transition-colors"
              title="Previous Statement"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs font-black text-amber-950 dark:text-amber-200 font-serif whitespace-nowrap">
              {MONTH_NAMES[inspectedMonth - 1]} {inspectedYear}
            </span>

            <button
              onClick={() => {
                const nextM = inspectedMonth === 12 ? 1 : inspectedMonth + 1;
                const nextY = inspectedMonth === 12 ? inspectedYear + 1 : inspectedYear;
                setInspectedMonth(nextM);
                setInspectedYear(nextY);
              }}
              className="p-1.5 rounded-xl hover:bg-amber-100 dark:hover:bg-stone-800 text-amber-900 dark:text-amber-300 transition-colors"
              title="Next Statement"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Vintage 1940s Financial Statement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {/* Credit Inflows */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/60 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300 font-serif">
              <span>Gross Credits (Income)</span>
              <span>+ Inflows</span>
            </div>
            <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300 font-mono">
              +{formatINR(activeRecord.totalInflow)}
            </div>
            <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400 font-medium">
              Verified receipts & salary deposits
            </div>
          </div>

          {/* Debit Outflows */}
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300/80 dark:border-rose-800/60 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-rose-900 dark:text-rose-300 font-serif">
              <span>Gross Debits (Expenses)</span>
              <span>- Outflows</span>
            </div>
            <div className="text-2xl font-black text-rose-800 dark:text-rose-300 font-mono">
              -{formatINR(activeRecord.totalOutflow)}
            </div>
            <div className="text-[11px] text-rose-700/80 dark:text-rose-400 font-medium">
              Needs: {formatINR(activeRecord.needsOutflow)} · Wants: {formatINR(activeRecord.wantsOutflow)}
            </div>
          </div>

          {/* Net Retained Operating Margin */}
          <div className="p-4 rounded-2xl bg-amber-100/70 dark:bg-amber-950/50 border border-amber-400/80 dark:border-amber-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-amber-950 dark:text-amber-300 font-serif">
              <span>Net Operating Surplus</span>
              <span>Savings %</span>
            </div>
            <div
              className={`text-2xl font-black font-mono ${
                activeRecord.netSurplus >= 0
                  ? 'text-emerald-800 dark:text-emerald-300'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {activeRecord.netSurplus >= 0 ? '+' : ''}
              {formatINR(activeRecord.netSurplus)}
            </div>
            <div className="text-[11px] text-amber-900/80 dark:text-amber-400 font-medium">
              Savings rate: {formatPercentage(activeRecord.savingsRate)}
            </div>
          </div>
        </div>

        {/* Vintage Official Stamp Bar */}
        <div className="p-4 rounded-2xl border-2 border-dashed border-amber-600/40 bg-white/70 dark:bg-stone-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center text-sm font-serif">
              ★
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-950 dark:text-amber-200 font-serif">
                {activeRecord.netSurplus >= 0
                  ? 'AUDITED VERDICT: SURPLUS & CAPITAL PRESERVED'
                  : 'AUDITED VERDICT: DEFICIT / OUTFLOWS EXCEEDED INFLOWS'}
              </div>
              <div className="text-[11px] text-stone-600 dark:text-stone-400 font-medium">
                Recorded transactions: {activeRecord.txCount} · Largest expenditure:{' '}
                <strong>{activeRecord.topCategoryName}</strong> ({formatINR(activeRecord.topCategoryAmount)})
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectMonthYear(inspectedMonth, inspectedYear)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold font-serif shadow-sm transition-all active:scale-95 shrink-0"
          >
            <span>Switch Active Dashboard to This Month</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Statement Line Items Breakdown */}
        {activeMonthItems.length > 0 && (
          <div className="mt-6 space-y-3 pt-6 border-t-2 border-double border-amber-800/30 dark:border-amber-700/40">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-950 dark:text-amber-300 font-serif">
              <span>Recorded Transaction Entries ({activeMonthItems.length})</span>
              <span>Ledger View</span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {activeMonthItems.map((item) => {
                const isIncome = item.type === 'income';
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-amber-200/70 dark:border-stone-800 text-xs hover:border-amber-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base">{item.category?.icon || (isIncome ? '💵' : '🪙')}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-stone-900 dark:text-amber-100 truncate flex items-center gap-1.5">
                          <span>{item.merchant || item.category?.name || 'Transaction'}</span>
                          {isIncome && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              CREDIT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">
                          {item.expense_date} · {item.category?.name || 'Uncategorized'}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`font-black font-mono shrink-0 ${
                        isIncome ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-900 dark:text-amber-100'
                      }`}
                    >
                      {isIncome ? `+${formatINR(item.amount)}` : `-${formatINR(item.amount)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. HISTORICAL CHRONOLOGY LEDGER (All Past Recorded Months) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white font-serif">
              Historical Month-by-Month Balance Sheets
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Click any historical statement to inspect its full audited ledger.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {historicalLedgers.length} Months Archived
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {historicalLedgers.map((record) => {
            const isInspected = record.month === inspectedMonth && record.year === inspectedYear;
            const isCurrentCalendar = record.month === currentCalMonth && record.year === currentCalYear;

            return (
              <div
                key={record.key}
                onClick={() => {
                  setInspectedMonth(record.month);
                  setInspectedYear(record.year);
                }}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer rounded-2xl transition-all ${
                  isInspected
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border border-amber-400/50'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {/* Month Name & Badges */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 flex items-center justify-center font-bold text-sm font-serif">
                    {record.month}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>
                        {MONTH_NAMES[record.month - 1]} {record.year}
                      </span>
                      {isCurrentCalendar && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                          Active (Live)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {record.txCount} transactions · In: +{formatINR(record.totalInflow)} · Out: -{formatINR(record.totalOutflow)}
                    </div>
                  </div>
                </div>

                {/* Net Balance & Verdict */}
                <div className="flex items-center justify-between sm:justify-end gap-4 text-right">
                  <div>
                    <div
                      className={`text-sm font-black font-mono ${
                        record.netSurplus >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {record.netSurplus >= 0 ? '+' : ''}
                      {formatINR(record.netSurplus)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">
                      Savings: {formatPercentage(record.savingsRate)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectedMonth(record.month);
                      setInspectedYear(record.year);
                      onSelectMonthYear(record.month, record.year);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    View Statement
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
