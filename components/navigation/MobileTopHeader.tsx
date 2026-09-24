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
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-[#faf6ed]/95 dark:bg-[#16120e]/95 backdrop-blur-xl border-b-2 border-double border-amber-800/30 dark:border-amber-700/30 pt-safe text-stone-900 dark:text-amber-100">
      {/* 1940s Brand Masthead */}
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 text-amber-100 font-serif font-black text-sm shadow-sm border border-amber-500/50">
          🏛️
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-serif font-black text-base tracking-tight text-stone-950 dark:text-amber-50">
            finTrack
          </span>
          <span className="text-[9px] font-serif font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-200/90 dark:bg-amber-950/80 text-amber-950 dark:text-amber-300 border border-amber-400/50 dark:border-amber-800">
            1940
          </span>
        </div>
      </Link>

      {/* User Avatar with tap to open ProfileModal */}
      {profile ? (
        <button
          type="button"
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-2 p-1 pl-2.5 rounded-full bg-amber-100/50 dark:bg-stone-900 border border-amber-800/25 dark:border-amber-700/30 active:scale-95 transition-transform"
          title="Edit profile & photo"
        >
          <span className="text-xs font-serif font-bold text-stone-900 dark:text-amber-100 max-w-[80px] truncate">
            {profile.display_name}
          </span>
          <div className="relative">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-7 h-7 rounded-full border-2 border-amber-700/50 object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-800 text-amber-100 text-xs font-serif font-bold flex items-center justify-center border border-amber-600">
                {profile.display_name.charAt(0)}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-900 text-amber-200 flex items-center justify-center text-[6px] border border-amber-400">
              ⚜️
            </div>
          </div>
        </button>
      ) : (
        <Link
          href="/login"
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-800 text-amber-50 font-serif font-bold text-xs shadow-sm border border-amber-600/40"
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
