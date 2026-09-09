'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import { showToast } from '@/components/ui/Toast';
import { saveProfile as storeSaveProfile, getProfiles } from '@/lib/data/store';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password?: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  setGuestProfile: (name: string, email: string) => void;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  switchActiveProfile: (profileId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_PROFILE_KEY = 'fintrack_guest_profile';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  const loadProfile = useCallback(async (currentUser: User) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      } else {
        const meta = currentUser.user_metadata || {};
        const fallbackProfile: Profile = {
          id: currentUser.id,
          email: currentUser.email || '',
          display_name: meta.full_name || meta.name || currentUser.email?.split('@')[0] || 'User',
          avatar_url: meta.avatar_url || meta.picture || undefined,
          currency: 'INR',
          default_payment_method: 'UPI',
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
    if (!isConfigured) {
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        loadProfile(currentUser);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        await loadProfile(currentUser);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
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
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : 'https://shrey-fintrack.vercel.app/auth/callback';

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

  const signInWithEmail = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!email) return { success: false, error: 'Email is required' };
    if (!password) return { success: false, error: 'Password is required' };

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        showToast(error.message, 'error');
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        await loadProfile(data.user);
        showToast('Signed in successfully ✓', 'success');
        return { success: true };
      }
      return { success: false, error: 'Failed to sign in' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Authentication error' };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password?: string,
    displayName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!email) return { success: false, error: 'Email is required' };
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const name = displayName?.trim() || email.split('@')[0];

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name,
            name: name,
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
          email: data.user.email || email,
          display_name: name,
          currency: 'INR',
          default_payment_method: 'UPI',
        });
        setProfile(profileData);
        showToast(`Account created for ${name} ✓`, 'success');
        return { success: true };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration error' };
    }
  };

  const signOut = async () => {
    if (isConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_PROFILE_KEY);
      }
    }
    setUser(null);
    setProfile(null);
    showToast('Signed out ✓', 'info');
  };

  const setGuestProfile = (name: string, email: string) => {
    const updated: Profile = {
      id: profile?.id || 'usr-1',
      display_name: name,
      email: email,
      currency: profile?.currency || 'INR',
      default_payment_method: profile?.default_payment_method || 'UPI',
      avatar_url: profile?.avatar_url,
    };
    setProfile(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(updated));
    }
    showToast('Profile updated ✓', 'success');
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
        signOut,
        setGuestProfile,
        updateProfile,
        switchActiveProfile,
      }}
    >
      {children}
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
