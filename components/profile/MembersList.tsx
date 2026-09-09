'use client';

import React, { useState, useEffect } from 'react';
import { Profile, Expense } from '@/types';
import { getProfiles, getExpenses, saveProfile } from '@/lib/data/store';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  Users,
  UserPlus,
  Share2,
  Check,
  CheckCircle2,
  Receipt,
  Sparkles,
  Camera,
  X
} from 'lucide-react';
import { formatINR } from '@/lib/formatting/formatters';
import { showToast } from '@/components/ui/Toast';

export function MembersList() {
  const { profile: currentProfile, switchActiveProfile, isConfigured } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // New Member Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPayment, setNewPayment] = useState('UPI');
  const [isCreating, setIsCreating] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profs, exps] = await Promise.all([getProfiles(), getExpenses()]);
      setProfiles(profs);
      setExpenses(exps);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProfile]);

  // Compute spend per member
  const getMemberStats = (userId: string) => {
    const userExpenses = expenses.filter((e) => e.user_id === userId);
    const total = userExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return {
      count: userExpenses.length,
      total,
    };
  };

  const handleCopyInviteLink = () => {
    const inviteUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/login`
        : 'https://shrey-fintrack.vercel.app/login';

    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    showToast('Login link copied to clipboard! Share with family members.', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('Please enter member name', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const newId = `usr-${Date.now()}`;
      await saveProfile({
        id: newId,
        display_name: newName.trim(),
        email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '')}@fintrack.local`,
        default_payment_method: newPayment,
        currency: 'INR',
      });

      showToast(`Member ${newName} added ✓`, 'success');
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to add member', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>Household & Family Members</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {profiles.length} {profiles.length === 1 ? 'Person' : 'People'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            All members save data into your single database. View and switch profiles below.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyInviteLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all active:scale-95"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Login Link'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {profiles.map((person) => {
          const stats = getMemberStats(person.id);
          const isCurrent = currentProfile?.id === person.id;

          return (
            <div
              key={person.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                isCurrent
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-sm'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {person.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={person.avatar_url}
                        alt={person.display_name}
                        className="w-12 h-12 rounded-full border-2 border-emerald-500/40 object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                        {person.display_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}

                    {isCurrent && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-sm">
                        ✓
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {person.display_name}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{person.email}</div>
                  </div>
                </div>
              </div>

              {/* Stats & Switch action */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatINR(stats.total)}
                  </span>{' '}
                  ({stats.count} items)
                </div>

                {!isCurrent ? (
                  <button
                    onClick={() => switchActiveProfile(person.id)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Switch to {person.display_name}
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selected</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Add Household Member
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Member Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alex, Sarah, Mom, Dad"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email or Username (Optional)
                </label>
                <input
                  type="text"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="alex@example.com or alex"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Default Payment Method
                </label>
                <select
                  value={newPayment}
                  onChange={(e) => setNewPayment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isCreating ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
