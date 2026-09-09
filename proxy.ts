import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const code = searchParams.get('code');

  // 1. If Supabase OAuth redirected with ?code=..., forward to /auth/callback
  if (code && !pathname.startsWith('/auth/callback')) {
    const callbackUrl = new URL('/auth/callback', request.url);
    callbackUrl.searchParams.set('code', code);

    // Preserve original destination path
    if (pathname && pathname !== '/') {
      callbackUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(callbackUrl);
  }

  // 2. Allow API routes, auth callback, static assets, and manifest/icons without interception
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/icon-192.svg' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  // 3. Inspect cookies for Supabase auth session
  const cookies = request.cookies.getAll();
  const hasAuthCookie = cookies.some(
    (c) =>
      c.name.startsWith('sb-') &&
      (c.name.includes('auth-token') || c.name.includes('access-token')) &&
      Boolean(c.value)
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseConfigured =
    Boolean(supabaseUrl) && !supabaseUrl.includes('your-project-ref');

  // 4. If Supabase is configured:
  if (supabaseConfigured) {
    // If not authenticated and visiting any protected route (like /), redirect to /login
    if (!hasAuthCookie && !pathname.startsWith('/login')) {
      const loginUrl = new URL('/login', request.url);
      if (pathname !== '/') {
        loginUrl.searchParams.set('next', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    // If authenticated and visiting /login, redirect to / (or requested target)
    if (hasAuthCookie && pathname.startsWith('/login')) {
      const target = searchParams.get('next') || '/';
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon-192.svg, manifest.json
     * - public asset extensions (.svg, .png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon-192.svg|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
