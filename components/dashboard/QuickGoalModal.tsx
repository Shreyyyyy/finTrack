'use client';

import React, { useState } from 'react';
import { X, Check, Target, Plus, Calendar, DollarSign, Sparkles } from 'lucide-react';
import { Goal } from '@/types';
import { saveGoal } from '@/lib/data/store';
import { formatINR } from '@/lib/formatting/formatters';
import { showToast } from '@/components/ui/Toast';

interface QuickGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalSaved: () => void;
}

const PRESET_GOALS = [
  { name: 'Emergency Fund', amount: 150000, icon: '🛡️' },
  { name: 'New iPhone 17', amount: 120000, icon: '📱' },
  { name: 'Vacation Trip', amount: 80000, icon: '✈️' },
  { name: 'Gold Investment', amount: 100000, icon: '🪙' },
  { name: 'MacBook Pro', amount: 180000, icon: '💻' },
  { name: 'Vehicle Down Payment', amount: 200000, icon: '🚗' },
];

export function QuickGoalModal({ isOpen, onClose, onGoalSaved }: QuickGoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: { name: string; amount: number }) => {
    setName(preset.name);
    setTargetAmount(String(preset.amount));
    // Default deadline 6 months from now
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setDeadline(d.toISOString().split('T')[0]);
    setMonthlyContribution(String(Math.round(preset.amount / 6)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) {
      showToast('Please fill in goal name and target amount', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await saveGoal({
        name: name.trim(),
        target_amount: parseFloat(targetAmount) || 0,
        current_amount: parseFloat(currentAmount) || 0,
        deadline: deadline || undefined,
        monthly_contribution: parseFloat(monthlyContribution) || 0,
        status: 'in_progress',
      });

      showToast(`Savings goal "${name}" created ✓`, 'success');
      onGoalSaved();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to create savings goal', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-sky-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base text-black dark:text-white">
                Set a New Savings Goal
              </h2>
              <p className="text-[11px] text-slate-800 dark:text-slate-400 font-semibold">
                Track your dream purchases, emergency reserves, or investments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-black dark:hover:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {/* Quick Presets */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Popular Savings Ideas</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_GOALS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="p-2.5 rounded-xl bg-sky-50/70 dark:bg-slate-800/60 border border-sky-200 dark:border-slate-700 hover:border-sky-500 text-left transition-all active:scale-95"
                >
                  <div className="text-base mb-1">{preset.icon}</div>
                  <div className="text-xs font-black text-black dark:text-white truncate">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-sky-700 dark:text-emerald-400 font-bold">
                    {formatINR(preset.amount)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Goal Name */}
          <div className="space-y-1.5 pt-2 border-t border-sky-100 dark:border-slate-800">
            <label className="block text-xs font-black text-black dark:text-slate-300">
              Goal Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Reserve, Goa Trip, Gold"
              className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-sky-50/50 dark:bg-slate-800 text-sm font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          {/* Target Amount & Initial Saved */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-black dark:text-slate-300">
                Target Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-black text-slate-500">₹</span>
                <input
                  type="number"
                  min="1"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="100000"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-sky-50/50 dark:bg-slate-800 text-sm font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-black dark:text-slate-300">
                Already Saved (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-black text-slate-500">₹</span>
                <input
                  type="number"
                  min="0"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-sky-50/50 dark:bg-slate-800 text-sm font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Deadline Date & Monthly Target */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-black dark:text-slate-300">
                Target Deadline (Optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-sky-50/50 dark:bg-slate-800 text-xs font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-black dark:text-slate-300">
                Monthly Deposit (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-black text-slate-500">₹</span>
                <input
                  type="number"
                  min="0"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  placeholder="10000"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 bg-sky-50/50 dark:bg-slate-800 text-sm font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-sky-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-sky-200 dark:border-slate-700 text-black dark:text-slate-300 text-xs font-bold hover:bg-sky-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/20 active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Create Goal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
