import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { NavigationShell } from '@/components/navigation/NavigationShell';

export const metadata: Metadata = {
  title: 'finTrack — Personal Expense Tracker',
  description: 'Ultra-fast personal expense tracking designed for iPhone daily use. Zero AI, $0/month.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'finTrack',
  },
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf7ed' },
    { media: '(prefers-color-scheme: dark)', color: '#14100c' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="min-h-full flex bg-[#fbf7ed] dark:bg-[#14100c] text-[#1c1713] dark:text-[#f6eedb] antialiased selection:bg-amber-600/25">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ToastProvider>
              <NavigationShell>{children}</NavigationShell>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
