import { Profile } from '@/types';
import { User } from '@supabase/supabase-js';

export const DB_ADMIN_USERNAME = 'dbadmin';
export const DB_ADMIN_EMAIL = 'dbadmin';
export const DB_ADMIN_PASSWORD = 'dbadmin@9958510891';
export const DB_ADMIN_SESSION_KEY = 'fintrack_db_admin_session';
export const DB_ADMIN_COOKIE_NAME = 'fintrack_db_admin_token';

export function isDbAdminIdentifier(identifier: string): boolean {
  if (!identifier) return false;
  const clean = identifier.trim().toLowerCase();
  const stripped = clean.replace(/[@._-\s]/g, '');
  return (
    clean === 'dbadmin' ||
    clean === 'db_admin' ||
    stripped === 'dbadmin' ||
    clean.startsWith('dbadmin@') ||
    clean.startsWith('db_admin@')
  );
}

export function isDbAdminPassword(password: string): boolean {
  return password === DB_ADMIN_PASSWORD;
}

export function getDbAdminProfile(): Profile {
  return {
    id: 'usr-dbadmin',
    email: 'dbadmin',
    display_name: 'DB Administrator',
    role: 'admin',
    currency: 'INR',
    default_payment_method: 'UPI',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: new Date().toISOString(),
  };
}

export function getDbAdminUser(): User {
  return {
    id: 'usr-dbadmin',
    app_metadata: { provider: 'admin_credentials' },
    user_metadata: {
      full_name: 'DB Administrator',
      name: 'DB Administrator',
      username: 'dbadmin',
      role: 'admin',
      is_db_admin: true,
    },
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00.000Z',
    email: 'dbadmin',
    phone: '',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  };
}
