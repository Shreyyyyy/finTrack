'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Edit3,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  X,
} from 'lucide-react';
import { Goal } from '@/types';
import {
  getGoals,
  saveGoal,
  deleteGoal,
  addGoalTransaction,
  DATA_CHANGE_EVENT,
} from '@/lib/data/store';
import { formatINR, formatPercentage, formatDateIndian } from '@/lib/formatting/formatters';
import { showToast } from '@/components/ui/Toast';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [contributeType, setContributeType] = useState<'deposit' | 'withdraw'>('deposit');
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeNote, setContributeNote] = useState('');

  // Form State for Create/Edit
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [monthlyContrib, setMonthlyContrib] = useState('');

  const loadData = async () => {
    const list = await getGoals();
    setGoals(list);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener(DATA_CHANGE_EVENT, loadData);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, loadData);
  }, []);

  const openCreateModal = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline('');
    setMonthlyContrib('');
    setEditingGoal(null);
    setShowCreateModal(true);
  };

  const openEditModal = (goal: Goal) => {
    setName(goal.name);
    setTargetAmount(String(goal.target_amount));
    setCurrentAmount(String(goal.current_amount));
    setDeadline(goal.deadline || '');
    setMonthlyContrib(String(goal.monthly_contribution || 0));
    setEditingGoal(goal);
    setShowCreateModal(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      showToast('Please enter a valid target amount', 'error');
      return;
    }

    const current = parseFloat(currentAmount) || 0;
    const contrib = parseFloat(monthlyContrib) || 0;

    await saveGoal({
      id: editingGoal?.id,
      name: name.trim(),
      target_amount: target,
      current_amount: current,
      deadline: deadline || null,
      monthly_contribution: contrib,
      status: current >= target ? 'completed' : 'in_progress',
    });

    setShowCreateModal(false);
    showToast(editingGoal ? 'Goal updated ✓' : 'Goal created ✓', 'success');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal(id);
      showToast('Goal deleted ✓', 'info');
    }
  };

  const handleContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal) return;
    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    await addGoalTransaction(contributeGoal.id, amount, contributeType, contributeNote.trim() || undefined);
    setContributeGoal(null);
    setContributeAmount('');
    setContributeNote('');
    showToast(
      contributeType === 'deposit' ? 'Contribution added ✓' : 'Withdrawal logged ✓',
      'success'
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-5 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Savings Goals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track dedicated targets, fund milestones, and contributions.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Target className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white">No Savings Goals Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Set a target for your dream purchase, emergency fund, or next vacation trip.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            const isDone = goal.status === 'completed' || pct >= 100;
            const remaining = Math.max(0, goal.target_amount - goal.current_amount);

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top bar: title, status badge & action buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {goal.name}
                      </h3>
                      {goal.deadline && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>Deadline: {formatDateIndian(goal.deadline)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(goal)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {formatINR(goal.current_amount)}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        Target: {formatINR(goal.target_amount)}
                      </div>
                    </div>

                    <div
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {formatPercentage(pct)}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
                    <span>{isDone ? 'Goal Achieved ✓' : `${formatINR(remaining)} to go`}</span>
                    {goal.monthly_contribution > 0 && (
                      <span>+{formatINR(goal.monthly_contribution)}/mo</span>
                    )}
                  </div>
                </div>

                {/* Quick Add / Withdraw Contribution */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setContributeGoal(goal);
                      setContributeType('deposit');
                      setContributeAmount('');
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Contribute</span>
                  </button>

                  <button
                    onClick={() => {
                      setContributeGoal(goal);
                      setContributeType('withdraw');
                      setContributeAmount('');
                    }}
                    className="py-2 px-3 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Withdraw</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook, Emergency Fund, Bali Trip"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="150000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="72000"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Plan (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="10000"
                    value={monthlyContrib}
                    onChange={(e) => setMonthlyContrib(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribution / Withdrawal Modal */}
      {contributeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {contributeType === 'deposit' ? 'Add Contribution' : 'Withdraw from Goal'}
              </h3>
              <button
                onClick={() => setContributeGoal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              For: <span className="font-bold text-slate-800 dark:text-slate-200">{contributeGoal.name}</span>
            </p>

            <form onSubmit={handleContribution} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  autoFocus
                  required
                  placeholder="5000"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly transfer, bonus"
                  value={contributeNote}
                  onChange={(e) => setContributeNote(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
                >
                  Confirm {contributeType === 'deposit' ? 'Deposit' : 'Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
