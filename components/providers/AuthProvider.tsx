'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import { showToast } from '@/components/ui/Toast';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setGuestProfile: (name: string, email: string) => void;
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
        // Fallback from Google User Metadata
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
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      // Local/Guest mode profile
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(GUEST_PROFILE_KEY);
        if (stored) {
          try {
            setProfile(JSON.parse(stored));
          } catch {
            // fallback
          }
        } else {
          const defaultGuest: Profile = {
            id: 'guest-user',
            email: 'demo@fintrack.local',
            display_name: 'Personal User',
            currency: 'INR',
            default_payment_method: 'UPI',
          };
          setProfile(defaultGuest);
        }
      }
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        loadProfile(currentUser);
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
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

  const signInWithGoogle = async () => {
    if (!isConfigured) {
      showToast('Supabase is running in local mode. Please configure your .env.local to enable Google OAuth.', 'info');
      return;
    }

    try {
      const supabase = createClient();
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'http://localhost:3000/auth/callback';

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

  const signOut = async () => {
    if (isConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    } else {
      // Reset guest mode
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
      id: 'guest-user',
      display_name: name,
      email: email,
      currency: 'INR',
      default_payment_method: 'UPI',
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
        signOut,
        setGuestProfile,
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
