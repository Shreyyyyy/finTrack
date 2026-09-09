'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { DesktopSidebar } from '@/components/navigation/DesktopSidebar';
import { MobileTopHeader } from '@/components/navigation/MobileTopHeader';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
export function NavigationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/auth');

  // Completely hide all navigation on login / auth callback screens
  if (isAuthPage) {
    return (
      <main className="flex-1 min-h-screen w-full flex flex-col items-center justify-center">
        {children}
      </main>
    );
  }

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
