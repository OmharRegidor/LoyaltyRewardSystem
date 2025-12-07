// src/providers/AuthProvider.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '../lib/supabase';
import { customerService } from '../services/customer.service';
import type { Customer } from '../types/database.types';

// Required for OAuth redirect
WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  user: User | null;
  customer: Customer | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    customer: null,
    session: null,
    isLoading: false,
    isInitialized: false,
  });

  // Get redirect URL for OAuth
  const redirectTo = AuthSession.makeRedirectUri({
    scheme: 'your-app-scheme', // Replace with your app scheme
    path: 'auth/callback',
  });

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const customer = await customerService.getByUserId(session.user.id);
          setState({
            user: session.user,
            customer,
            session,
            isLoading: false,
            isInitialized: true,
          });
        } else {
          setState((prev) => ({ ...prev, isInitialized: true }));
        }
      } catch (error) {
        console.error('Auth init error:', error);
        setState((prev) => ({ ...prev, isInitialized: true }));
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setState((prev) => ({ ...prev, isLoading: true }));

        try {
          // Find or create customer record
          const customer = await customerService.findOrCreate(session.user.id);

          setState({
            user: session.user,
            customer,
            session,
            isLoading: false,
            isInitialized: true,
          });
        } catch (error) {
          console.error('Customer creation error:', error);
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          customer: null,
          session: null,
          isLoading: false,
          isInitialized: true,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true, // Important for Expo
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      // Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      if (result.type === 'success') {
        const url = new URL(result.url);
        const params = new URLSearchParams(url.hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [redirectTo]);

  const signOut = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const refreshCustomer = useCallback(async () => {
    if (!state.user) return;

    try {
      const customer = await customerService.getByUserId(state.user.id);
      setState((prev) => ({ ...prev, customer }));
    } catch (error) {
      console.error('Refresh customer error:', error);
    }
  }, [state.user]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithGoogle,
        signOut,
        refreshCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
