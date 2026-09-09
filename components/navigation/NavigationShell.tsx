'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { DesktopSidebar } from '@/components/navigation/DesktopSidebar';
import { MobileTopHeader } from '@/components/navigation/MobileTopHeader';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';

export function NavigationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isLoginPage = pathname?.startsWith('/login');
  const isAuthCallback = pathname?.startsWith('/auth');
  const isPublicRoute = isLoginPage || isAuthCallback;

  // Client-side authentication route enforcement
  useEffect(() => {
    if (isLoading) return;

    // 1. Unauthenticated user trying to access a protected route (e.g. /) -> redirect to /login
    if (!user && !isPublicRoute) {
      const target =
        pathname && pathname !== '/'
          ? `/login?next=${encodeURIComponent(pathname)}`
          : '/login';
      router.replace(target);
      return;
    }

    // 2. Already authenticated user trying to access /login -> redirect to dashboard /
    if (user && isLoginPage) {
      router.replace('/');
      return;
    }
  }, [user, isLoading, isPublicRoute, isLoginPage, pathname, router]);

  // Auth callback route (e.g. /auth/callback) passes through directly
  if (isAuthCallback) {
    return <>{children}</>;
  }

  // When visiting /login
  if (isLoginPage) {
    // If the user is already authenticated, show a sleek redirect transition
    if (user) {
      return (
        <div className="flex-1 min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#090d16]">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-600/30 animate-pulse mb-3">
            ₹
          </div>
          <p className="text-xs font-semibold text-slate-400 tracking-wide">
            Redirecting to dashboard...
          </p>
        </div>
      );
    }

    // Standalone clean login container (NO navigation bars)
    return (
      <main className="flex-1 min-h-screen w-full flex flex-col items-center justify-center">
        {children}
      </main>
    );
  }

  // Protected Routes: While verifying secure session, show sleek branded loader (never flash protected data)
  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#090d16]">
        <div className="relative flex items-center justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-600/25 animate-pulse">
            ₹
          </div>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">finTrack</h2>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  // Protected Routes: If not logged in, show redirecting state while router replaces URL to /login
  if (!user) {
    return (
      <div className="flex-1 min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#090d16]">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-600/30 animate-pulse mb-3">
          ₹
        </div>
        <p className="text-xs font-semibold text-slate-400 tracking-wide">
          Redirecting to login...
        </p>
      </div>
    );
  }

  // Authenticated user: Render the full application shell with desktop sidebar, header, and mobile bottom nav
  return (
    <>
      {/* Desktop Sidebar Layout */}
      <DesktopSidebar />

      {/* Main Application Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-6 overflow-x-hidden">
        <MobileTopHeader />
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </>
  );
}
