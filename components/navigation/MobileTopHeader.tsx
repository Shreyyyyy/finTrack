'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { Camera, LogIn } from 'lucide-react';

export function MobileTopHeader() {
  const { profile, user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 pt-safe">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black text-base shadow-sm shadow-emerald-600/20">
          ₹
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
            finTrack
          </span>
          <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            Personal
          </span>
        </div>
      </Link>

      {/* User Avatar with tap to open ProfileModal */}
      {profile ? (
        <button
          type="button"
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-2 p-1 pl-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 active:scale-95 transition-transform"
          title="Edit profile & photo"
        >
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[80px] truncate">
            {profile.display_name}
          </span>
          <div className="relative">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-7 h-7 rounded-full border border-emerald-500/50 object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                {profile.display_name.charAt(0)}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center text-[6px]">
              📷
            </div>
          </div>
        </button>
      ) : (
        <Link
          href="/login"
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Login</span>
        </Link>
      )}

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </header>
  );
}
