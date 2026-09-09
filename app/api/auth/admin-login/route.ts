import { NextRequest, NextResponse } from 'next/server';
import {
  isDbAdminIdentifier,
  isDbAdminPassword,
  getDbAdminProfile,
  getDbAdminUser,
  DB_ADMIN_COOKIE_NAME,
} from '@/lib/auth/adminConfig';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getServiceRoleClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey) {
    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = body?.identifier || body?.username || body?.email || '';
    const password = body?.password || '';

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Username or email is required' },
        { status: 400 }
      );
    }

    if (!isDbAdminIdentifier(identifier) || !isDbAdminPassword(password)) {
      return NextResponse.json(
        { success: false, error: 'Invalid DB Admin username or password' },
        { status: 401 }
      );
    }

    const adminUser = getDbAdminUser();
    const adminProfile = getDbAdminProfile();

    const response = NextResponse.json({
      success: true,
      user: adminUser,
      profile: adminProfile,
      message: 'Authenticated as DB Administrator',
    });

    // Set cookie valid for 7 days
    response.cookies.set(DB_ADMIN_COOKIE_NAME, 'authenticated', {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Admin authentication failed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Signed out of DB Admin' });
  response.cookies.delete(DB_ADMIN_COOKIE_NAME);
  return response;
}
