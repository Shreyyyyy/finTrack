import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  // If Supabase fell back to root or another page with ?code=...,
  // automatically forward to /auth/callback to exchange the code for session cookies
  if (code && !request.nextUrl.pathname.startsWith('/auth/callback')) {
    const callbackUrl = new URL('/auth/callback', request.url);
    callbackUrl.searchParams.set('code', code);

    // Preserve any existing target path
    const nextPath = request.nextUrl.pathname;
    if (nextPath && nextPath !== '/') {
      callbackUrl.searchParams.set('next', nextPath);
    }

    return NextResponse.redirect(callbackUrl);
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
