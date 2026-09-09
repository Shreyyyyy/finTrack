import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';

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
    const supabase = await createClientServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${hostOrigin}${next}`);
    }
  }

  // Return user to login or home with error if failed
  return NextResponse.redirect(`${hostOrigin}/login?error=oauth_failed`);
}
