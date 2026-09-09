import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const code = searchParams.get('code');

  // 1. If Supabase OAuth redirected with ?code=..., forward cleanly to /auth/callback
  if (code && !pathname.startsWith('/auth/callback')) {
    const callbackUrl = new URL('/auth/callback', request.url);
    callbackUrl.searchParams.set('code', code);

    // Preserve original destination path if present (skip root and dashboard defaults)
    if (pathname && pathname !== '/' && pathname !== '/dashboard') {
      callbackUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(callbackUrl);
  }

  // 2. Allow all routes to load without artificial redirect loops
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
