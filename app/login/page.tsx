'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { ShieldCheck, ArrowRight, Sparkles, AlertCircle, Smartphone, Zap } from 'lucide-react';
import { BackTapSetupModal } from '@/components/shortcuts/BackTapSetupModal';

export default function LoginPage() {
  const { user, profile, signInWithGoogle, signOut, isConfigured, isLoading } = useAuth();
  const [showBackTapModal, setShowBackTapModal] = useState(false);

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
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
            Personal, ultra-fast expense tracking organized in your database. Zero AI, $0/month.
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

        {/* Current Auth Status or Google Button */}
        {user ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-10 h-10 rounded-full border border-emerald-400"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  {profile?.display_name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {profile?.display_name || user.email}
                </div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Link
                href="/"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all text-center"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={signOut}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-98 transition-all"
            >
              {/* Official Google 'G' multicolor icon */}
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

            {!isConfigured && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Supabase credentials are not yet set in <code>.env.local</code>. Running in local demo mode.
                </span>
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
        )}

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
        userEmail={user?.email || undefined}
      />
    </div>
  );
}
