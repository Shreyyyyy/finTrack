'use client';

import React from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';

interface SignOutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
  isSigningOut?: boolean;
}

export function SignOutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isSigningOut = false,
}: SignOutConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-sky-100 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Icon & Close */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
            <LogOut className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            disabled={isSigningOut}
            className="p-1 rounded-xl text-slate-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1.5 text-left">
          <h3 className="text-lg font-black text-black dark:text-white">
            Sign Out of finTrack?
          </h3>
          <p className="text-xs text-slate-800 dark:text-slate-400 font-medium leading-relaxed">
            {userName ? (
              <>
                You are currently signed in as <strong className="text-black dark:text-slate-200 font-bold">{userName}</strong>.
              </>
            ) : null}{' '}
            Are you sure you want to sign out? You will need to sign back in with your credentials to access your financial records.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSigningOut}
            className="w-full py-2.5 rounded-xl border border-sky-200 dark:border-slate-800 text-xs font-bold text-black dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSigningOut}
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSigningOut ? (
              <span>Signing out...</span>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
