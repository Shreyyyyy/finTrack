import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

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

  if (code) {
    const redirectResponse = NextResponse.redirect(`${hostOrigin}${next}`);
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const supabase = createServerClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder',
      {
        cookies: {
          getAll() {
            const cookieHeader = request.headers.get('cookie') || '';
            return cookieHeader
              .split(';')
              .map((c) => c.trim())
              .filter(Boolean)
              .map((c) => {
                const [name, ...val] = c.split('=');
                return { name, value: val.join('=') };
              });
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
  }

  // Return user to login if failed
  return NextResponse.redirect(`${hostOrigin}/login?error=oauth_failed`);
}
