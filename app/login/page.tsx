'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Smartphone,
  Mail,
  Lock,
  User,
  Users,
  Check,
  Camera,
  LogIn
} from 'lucide-react';
import { BackTapSetupModal } from '@/components/shortcuts/BackTapSetupModal';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { getProfiles } from '@/lib/data/store';
import { Profile } from '@/types';
import { showToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const {
    user,
    profile,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    switchActiveProfile,
    isConfigured,
    isLoading,
  } = useAuth();

  const [showBackTapModal, setShowBackTapModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Auth Mode: 'google' | 'email'
  const [authTab, setAuthTab] = useState<'google' | 'email'>('google');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Household Members for 1-click Fast Switching
  const [householdMembers, setHouseholdMembers] = useState<Profile[]>([]);

  useEffect(() => {
    getProfiles().then(setHouseholdMembers);
  }, [profile]);

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const res = await signUpWithEmail(email, password, displayName);
        if (!res.success && res.error) {
          showToast(res.error, 'error');
        }
      } else {
        const res = await signInWithEmail(email, password);
        if (!res.success && res.error) {
          showToast(res.error, 'error');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black text-3xl shadow-lg shadow-emerald-600/20 mb-1">
            ₹
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome to finTrack
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Personal, multi-user expense tracking organized in your database. Zero AI, $0/month.
          </p>
        </div>

        {/* Highlight Card: Setup iPhone Back Tap */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>iPhone Back Tap Shortcut</span>
                <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                  &lt; 5s
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Double-tap back of iPhone to add expenses
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowBackTapModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 shadow-sm transition-all"
          >
            Setup
          </button>
        </div>

        {/* Current Auth Status Card */}
        {profile && (user || profile.id) ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-11 h-11 rounded-full border-2 border-emerald-500/50 object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {profile?.display_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md hover:scale-110 transition-transform"
                    title="Change Picture"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>

                <div className="min-w-0 text-left">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                    <span>{profile?.display_name || 'Member'}</span>
                    <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Active
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">{profile?.email}</div>
                </div>
              </div>

              <button
                onClick={() => setShowProfileModal(true)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Edit Photo
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <Link
                href="/"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={signOut}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : null}

        {/* Login Tabs: Google vs Email */}
        <div className="space-y-4">
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setAuthTab('google')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                authTab === 'google'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Google Login
            </button>
            <button
              type="button"
              onClick={() => setAuthTab('email')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                authTab === 'email'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Email & Password
            </button>
          </div>

          {authTab === 'google' ? (
            <div className="space-y-3">
              {/* Google Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-98 transition-all disabled:opacity-60"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Shrey, Sarah"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Processing...'
                    : isSignUp
                    ? 'Create Account & Sign In'
                    : 'Sign In with Email'}
                </span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors"
                >
                  {isSignUp
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Create one"}
                </button>
              </div>
            </form>
          )}

          {/* Quick Member Switcher */}
          {householdMembers.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Or Quick Switch Member</span>
                </span>
                <span>{householdMembers.length} profiles</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {householdMembers.slice(0, 3).map((person) => (
                  <button
                    key={person.id}
                    onClick={() => switchActiveProfile(person.id)}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center gap-1.5 transition-all active:scale-95"
                  >
                    {person.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={person.avatar_url}
                        alt={person.display_name}
                        className="w-8 h-8 rounded-full object-cover border border-emerald-500/40"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                        {person.display_name.charAt(0)}
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">
                      {person.display_name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 uppercase font-semibold">
              Or
            </span>
          </div>

          {/* Guest / Local Link */}
          <Link
            href="/"
            className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs text-center flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span>Continue in Guest / Demo Mode</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Security & Multi-User Notice */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>All members&apos; data is organized in your single database with RLS.</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>100% private, zero AI, and $0/month free tier hosting.</span>
          </div>
        </div>
      </div>

      {/* Back Tap Setup Modal */}
      <BackTapSetupModal
        isOpen={showBackTapModal}
        onClose={() => setShowBackTapModal(false)}
        userEmail={profile?.email || user?.email || undefined}
      />

      {/* Profile & Photo Editor Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}
