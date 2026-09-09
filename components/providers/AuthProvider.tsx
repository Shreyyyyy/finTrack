'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import { showToast } from '@/components/ui/Toast';
import { saveProfile as storeSaveProfile, getProfiles } from '@/lib/data/store';
import { SignOutConfirmModal } from '@/components/auth/SignOutConfirmModal';

import {
  DB_ADMIN_USERNAME,
  DB_ADMIN_PASSWORD,
  DB_ADMIN_SESSION_KEY,
  isDbAdminIdentifier,
  isDbAdminPassword,
  getDbAdminProfile,
  getDbAdminUser,
} from '@/lib/auth/adminConfig';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password?: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  signInAsDbAdmin: (password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  confirmSignOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  switchActiveProfile: (profileId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_PROFILE_KEY = 'fintrack_guest_profile';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isConfigured = isSupabaseConfigured();

  const loadProfile = useCallback(async (currentUser: User) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      const isDbAdmin = Boolean(
        (currentUser.email && isDbAdminIdentifier(currentUser.email)) ||
        ((currentUser.user_metadata as any)?.username && isDbAdminIdentifier((currentUser.user_metadata as any)?.username)) ||
        currentUser.id === 'usr-dbadmin'
      );

      // STRICT ISOLATION: ONLY the dbadmin account has the admin role.
      // All other accounts (including Google sign-in and normal member accounts) are strictly 'member'.
      const role: 'admin' | 'member' = isDbAdmin ? 'admin' : 'member';

      if (!error && data) {
        setProfile({ ...data, role } as Profile);
        // If an old Supabase record marked a normal account as admin, demote it
        if (data.role === 'admin' && !isDbAdmin) {
          storeSaveProfile({ ...data, role: 'member' } as Profile);
        }
      } else {
        const meta = currentUser.user_metadata || {};
        const fallbackProfile: Profile = {
          id: currentUser.id,
          email: currentUser.email || '',
          display_name: meta.full_name || meta.name || currentUser.email?.split('@')[0] || 'User',
          avatar_url: meta.avatar_url || meta.picture || undefined,
          currency: 'INR',
          default_payment_method: 'UPI',
          role,
        };
        setProfile(fallbackProfile);
        // Persist default profile to Supabase
        await storeSaveProfile(fallbackProfile);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, []);

  useEffect(() => {
    // 1. Check if an active DB Admin session is saved locally
    if (typeof window !== 'undefined') {
      try {
        const savedAdmin = localStorage.getItem(DB_ADMIN_SESSION_KEY);
        if (savedAdmin) {
          const parsed = JSON.parse(savedAdmin);
          if (
            parsed?.role === 'admin' &&
            (isDbAdminIdentifier(parsed.email) || isDbAdminIdentifier(parsed.username) || parsed.id === 'usr-dbadmin' || parsed.id === 'usr-db-admin-master')
          ) {
            setUser(getDbAdminUser());
            setProfile(getDbAdminProfile());
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to restore admin session:', err);
      }
    }

    if (!isConfigured) {
      if (typeof window !== 'undefined') {
        try {
          const guestProfile = localStorage.getItem(GUEST_PROFILE_KEY);
          const savedUser = localStorage.getItem('fintrack_active_user_session');
          if (guestProfile) {
            const parsed = JSON.parse(guestProfile);
            setProfile(parsed);
            if (savedUser) {
              setUser(JSON.parse(savedUser));
            } else if (parsed?.id) {
              setUser({
                id: parsed.id,
                app_metadata: { provider: 'local_credentials' },
                user_metadata: { name: parsed.display_name },
                aud: 'authenticated',
                created_at: parsed.created_at || new Date().toISOString(),
                email: parsed.email,
                phone: '',
                role: 'authenticated',
                updated_at: new Date().toISOString(),
              });
            }
          }
        } catch {}
      }
      setIsLoading(false);
      return;
    }

    // Handle any stray ?code= parameter from OAuth redirect
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code && !window.location.pathname.startsWith('/auth/callback')) {
        window.location.replace(`/auth/callback?code=${encodeURIComponent(code)}`);
        return;
      }
    }

    const supabase = createClient();

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          await loadProfile(currentUser);
        } else {
          setProfile(null);
        }
      })
      .catch((err) => {
        console.warn('Failed to get session:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          await loadProfile(currentUser);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.warn('onAuthStateChange error:', err);
      } finally {
        setIsLoading(false);
      }
    });

    // Safety timeout: Ensure loading never hangs if network / auth is slow
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [isConfigured, loadProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    const targetId = user?.id || profile?.id || 'usr-1';
    const updated = await storeSaveProfile({
      ...profile,
      ...updates,
      id: targetId,
    });
    setProfile(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(updated));
    }
    showToast('Profile updated successfully ✓', 'success');
  };

  const switchActiveProfile = async (profileId: string) => {
    const profiles = await getProfiles();
    const found = profiles.find((p) => p.id === profileId);
    if (found) {
      setProfile(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(found));
      }
      showToast(`Active profile: ${found.display_name} ✓`, 'success');
    }
  };

  const signInWithGoogle = async () => {
    if (!isConfigured) {
      showToast('Supabase is running in demo mode.', 'info');
      return;
    }

    try {
      const supabase = createClient();
      const searchParams =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search)
          : null;
      const nextParam = searchParams?.get('next');
      const callbackBase =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : 'https://shrey-fintrack.vercel.app/auth/callback';
      const redirectUrl = nextParam
        ? `${callbackBase}?next=${encodeURIComponent(nextParam)}`
        : callbackBase;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        showToast(error.message, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to start Google sign in', 'error');
    }
  };

  const signInAsDbAdmin = async (
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!password) {
      return { success: false, error: 'Password is required' };
    }
    if (!isDbAdminPassword(password)) {
      showToast('Incorrect password for DB Admin', 'error');
      return { success: false, error: 'Incorrect password for DB Admin' };
    }

    try {
      // Call backend route to sync session / cookies
      try {
        await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: DB_ADMIN_USERNAME, password }),
        });
      } catch (apiErr) {
        console.warn('Backend admin login sync:', apiErr);
      }



      const adminUser = getDbAdminUser();
      const adminProfile = getDbAdminProfile();

      setUser(adminUser);
      setProfile(adminProfile);

      if (typeof window !== 'undefined') {
        localStorage.setItem(DB_ADMIN_SESSION_KEY, JSON.stringify(adminProfile));
        localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(adminProfile));
      }

      showToast('Signed in as DB Administrator ✓', 'success');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to authenticate DB Admin' };
    }
  };

  const signInWithEmail = async (
    emailOrUsername: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!emailOrUsername?.trim()) return { success: false, error: 'Email or Username is required' };
    if (!password) return { success: false, error: 'Password is required' };

    const identifier = emailOrUsername.trim();

    // Seamless DB Admin interception:
    if (isDbAdminIdentifier(identifier)) {
      return signInAsDbAdmin(password);
    }

    // Clear any leftover DB Admin session if regular user signs in
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DB_ADMIN_SESSION_KEY);
    }

    const isEmailFormat = identifier.includes('@');
    const cleanUsername = isEmailFormat ? identifier.split('@')[0] : identifier;
    const normalizedEmail = isEmailFormat ? identifier.toLowerCase() : `${cleanUsername.toLowerCase()}@fintrack.local`;

    // 1. Try Supabase if configured
    if (isConfigured) {
      try {
        const supabase = createClient();
        // Try normalized email first
        let authResult = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        // If error and raw identifier was different, retry with raw identifier
        if (authResult.error && isEmailFormat && normalizedEmail !== identifier) {
          authResult = await supabase.auth.signInWithPassword({
            email: identifier,
            password,
          });
        }

        if (!authResult.error && authResult.data?.user) {
          setUser(authResult.data.user);
          await loadProfile(authResult.data.user);
          if (typeof window !== 'undefined') {
            localStorage.setItem('fintrack_active_user_session', JSON.stringify(authResult.data.user));
          }
          showToast('Signed in successfully ✓', 'success');
          return { success: true };
        }

        // If error is not a network failure, let's see if there is a local account before erroring out
        if (authResult.error && !authResult.error.message.includes('fetch') && !authResult.error.message.includes('Network')) {
          // Check local credentials as well before failing
          const localUsersRaw = typeof window !== 'undefined' ? localStorage.getItem('fintrack_local_users') : null;
          if (localUsersRaw) {
            try {
              const localUsers = JSON.parse(localUsersRaw);
              const match = localUsers.find(
                (u: any) =>
                  (u.username?.toLowerCase() === cleanUsername.toLowerCase() ||
                   u.email?.toLowerCase() === identifier.toLowerCase() ||
                   u.email?.toLowerCase() === normalizedEmail.toLowerCase()) &&
                  u.passwordHash === btoa(password)
              );
              if (match) {
                const localProfile: Profile = {
                  id: match.id,
                  email: match.email,
                  display_name: match.display_name,
                  role: match.role || 'member',
                  currency: 'INR',
                  default_payment_method: 'UPI',
                  monthly_income: 0,
                  monthly_budget: 0,
                  savings_target: 0,
                  created_at: match.created_at,
                  updated_at: new Date().toISOString(),
                };
                const mockUser: User = {
                  id: match.id,
                  app_metadata: { provider: 'local_credentials' },
                  user_metadata: { full_name: match.display_name, name: match.display_name, username: match.username },
                  aud: 'authenticated',
                  created_at: match.created_at,
                  email: match.email,
                  phone: '',
                  role: 'authenticated',
                  updated_at: new Date().toISOString(),
                };
                setUser(mockUser);
                setProfile(localProfile);
                localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(localProfile));
                localStorage.setItem('fintrack_active_user_session', JSON.stringify(mockUser));
                showToast('Signed in successfully ✓', 'success');
                return { success: true };
              }
            } catch {}
          }

          showToast(authResult.error.message, 'error');
          return { success: false, error: authResult.error.message };
        }
      } catch (err: any) {
        console.warn('Supabase auth encountered error, checking local fallback:', err);
      }
    }

    // 2. Local / Demo mode or Offline authentication
    if (typeof window !== 'undefined') {
      try {
        const localUsersRaw = localStorage.getItem('fintrack_local_users');
        const localUsers = localUsersRaw ? JSON.parse(localUsersRaw) : [];

        const match = localUsers.find(
          (u: any) =>
            (u.username?.toLowerCase() === cleanUsername.toLowerCase() ||
             u.email?.toLowerCase() === identifier.toLowerCase() ||
             u.email?.toLowerCase() === normalizedEmail.toLowerCase()) &&
            u.passwordHash === btoa(password)
        );

        if (match) {
          const localProfile: Profile = {
            id: match.id,
            email: match.email,
            display_name: match.display_name,
            role: match.role || 'member',
            currency: 'INR',
            default_payment_method: 'UPI',
            monthly_income: 0,
            monthly_budget: 0,
            savings_target: 0,
            created_at: match.created_at,
            updated_at: new Date().toISOString(),
          };

          const mockUser: User = {
            id: match.id,
            app_metadata: { provider: 'local_credentials' },
            user_metadata: { full_name: match.display_name, name: match.display_name, username: match.username },
            aud: 'authenticated',
            created_at: match.created_at,
            email: match.email,
            phone: '',
            role: 'authenticated',
            updated_at: new Date().toISOString(),
          };

          setUser(mockUser);
          setProfile(localProfile);
          localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(localProfile));
          localStorage.setItem('fintrack_active_user_session', JSON.stringify(mockUser));
          showToast('Signed in successfully ✓', 'success');
          return { success: true };
        }

        // If no user exists yet
        if (localUsers.length === 0) {
          return {
            success: false,
            error: 'No account found for this username. Click "Create one" below to register!',
          };
        }

        return {
          success: false,
          error: 'Incorrect username/email or password. Please check your credentials.',
        };
      } catch {
        return { success: false, error: 'Authentication failed. Please try again.' };
      }
    }

    return { success: false, error: 'Authentication not available.' };
  };

  const signUpWithEmail = async (
    emailOrUsername: string,
    password?: string,
    displayName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!emailOrUsername?.trim()) return { success: false, error: 'Email or Username is required' };
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const identifier = emailOrUsername.trim();
    const isEmailFormat = identifier.includes('@');
    const cleanUsername = isEmailFormat ? identifier.split('@')[0] : identifier;
    const normalizedEmail = isEmailFormat ? identifier.toLowerCase() : `${cleanUsername.toLowerCase()}@fintrack.local`;
    const finalName = displayName?.trim() || cleanUsername;

    // 1. Try Supabase if configured
    if (isConfigured) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: finalName,
              name: finalName,
              username: cleanUsername,
            },
          },
        });

        if (error) {
          showToast(error.message, 'error');
          return { success: false, error: error.message };
        }

        if (data.user) {
          setUser(data.user);
          const profileData = await storeSaveProfile({
            id: data.user.id,
            email: data.user.email || normalizedEmail,
            display_name: finalName,
            currency: 'INR',
            default_payment_method: 'UPI',
          });
          setProfile(profileData);
          if (typeof window !== 'undefined') {
            localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profileData));
            localStorage.setItem('fintrack_active_user_session', JSON.stringify(data.user));
          }
          showToast(`Account created for ${finalName} ✓`, 'success');
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase sign up error, trying local fallback:', err);
      }
    }

    // 2. Local / Demo mode or Offline Registration
    if (typeof window !== 'undefined') {
      try {
        const localUsersRaw = localStorage.getItem('fintrack_local_users');
        const localUsers = localUsersRaw ? JSON.parse(localUsersRaw) : [];

        // Check if username/email is already taken locally
        const existing = localUsers.find(
          (u: any) =>
            u.username?.toLowerCase() === cleanUsername.toLowerCase() ||
            u.email?.toLowerCase() === identifier.toLowerCase() ||
            u.email?.toLowerCase() === normalizedEmail.toLowerCase()
        );

        if (existing) {
          return {
            success: false,
            error: 'An account with this username or email already exists. Please sign in.',
          };
        }

        const newUserId = 'usr-' + Math.random().toString(36).substring(2, 11);
        const newUserRecord = {
          id: newUserId,
          username: cleanUsername,
          email: normalizedEmail,
          passwordHash: btoa(password),
          display_name: finalName,
          role: 'member',
          created_at: new Date().toISOString(),
        };

        localUsers.push(newUserRecord);
        localStorage.setItem('fintrack_local_users', JSON.stringify(localUsers));

        const newProfile: Profile = {
          id: newUserId,
          email: normalizedEmail,
          display_name: finalName,
          currency: 'INR',
          default_payment_method: 'UPI',
          role: 'member',
          monthly_income: 0,
          monthly_budget: 0,
          savings_target: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await storeSaveProfile(newProfile);

        const mockUser: User = {
          id: newUserId,
          app_metadata: { provider: 'local_credentials' },
          user_metadata: { full_name: finalName, name: finalName, username: cleanUsername },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: normalizedEmail,
          phone: '',
          role: 'authenticated',
          updated_at: new Date().toISOString(),
        };

        setUser(mockUser);
        setProfile(newProfile);
        localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(newProfile));
        localStorage.setItem('fintrack_active_user_session', JSON.stringify(mockUser));

        showToast(`Account created for ${finalName} ✓`, 'success');
        return { success: true };
      } catch {
        return { success: false, error: 'Registration failed. Please try again.' };
      }
    }

    return { success: false, error: 'Registration not available.' };
  };

  // Trigger double-check confirmation modal
  const signOut = () => {
    setShowSignOutModal(true);
  };

  // Perform the actual sign out and redirect to /login
  const confirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      if (isConfigured) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
      try {
        await fetch('/api/auth/admin-login', { method: 'DELETE' });
      } catch {}
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_PROFILE_KEY);
        localStorage.removeItem(DB_ADMIN_SESSION_KEY);
        localStorage.removeItem('fintrack_active_user_session');
      }
      setUser(null);
      setProfile(null);
      setShowSignOutModal(false);
      showToast('Signed out successfully ✓', 'info');
      // Always redirect cleanly to /login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Failed to sign out:', err);
      showToast('Failed to sign out', 'error');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isConfigured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsDbAdmin,
        signOut,
        confirmSignOut,
        updateProfile,
        switchActiveProfile,
      }}
    >
      {children}
      <SignOutConfirmModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={confirmSignOut}
        userName={profile?.display_name || user?.email || undefined}
        isSigningOut={isSigningOut}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
