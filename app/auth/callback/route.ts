import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const errorParam = requestUrl.searchParams.get('error');
  const errorDesc = requestUrl.searchParams.get('error_description');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  // Determine the real public domain (handles reverse proxies like Vercel)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';

  let hostOrigin = requestUrl.origin;
  if (forwardedHost) {
    hostOrigin = `${forwardedProto}://${forwardedHost}`;
  } else if (
    process.env.NEXT_PUBLIC_APP_URL &&
    !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
  ) {
    hostOrigin = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  // 1. If Google or Supabase returned an OAuth error directly in callback
  if (errorParam || errorDesc) {
    console.error('OAuth provider error:', errorParam, errorDesc);
    const message = errorDesc || errorParam || 'Google authentication was not approved.';
    return NextResponse.redirect(`${hostOrigin}/login?error=${encodeURIComponent(message)}`);
  }

  // 2. Exchange authorization code for Supabase session
  if (code) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
      return NextResponse.redirect(
        `${hostOrigin}/login?error=${encodeURIComponent('Supabase environment variables are missing on the server.')}`
      );
    }

    const redirectResponse = NextResponse.redirect(`${hostOrigin}${next}`);
    const cookieStore = await cookies();

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              redirectResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectResponse;
    }
    console.error('OAuth exchange error:', error);
    return NextResponse.redirect(`${hostOrigin}/login?error=${encodeURIComponent(error.message)}`);
  }

  // 3. Return user to login if no code was received
  return NextResponse.redirect(`${hostOrigin}/login?error=${encodeURIComponent('No authorization code was returned from Google.')}`);
}
