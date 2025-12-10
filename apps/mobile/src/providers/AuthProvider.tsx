// src/providers/AuthProvider.tsx

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { customerService } from '../services/customer.service';
import type { Customer } from '../types/database.types';

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

const initialState: AuthState = {
  user: null,
  customer: null,
  session: null,
  isLoading: false,
  isInitialized: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const redirectTo = Linking.createURL('auth/callback');
  const isLoadingCustomer = useRef(false);

  // Separate function to load customer - called outside onAuthStateChange
  const loadCustomer = useCallback(async (user: User, session: Session) => {
    if (isLoadingCustomer.current) return;
    isLoadingCustomer.current = true;

    console.log('Loading customer for:', user.id);

    try {
      const customer = await customerService.findOrCreate(user.id);
      console.log('Customer loaded:', customer?.id);

      setState({
        user,
        customer,
        session,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Customer error:', error);
      setState({
        user,
        customer: null,
        session,
        isLoading: false,
        isInitialized: true,
      });
    } finally {
      isLoadingCustomer.current = false;
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          await loadCustomer(session.user, session);
        } else {
          setState(prev => ({ ...prev, isInitialized: true }));
        }
      } catch (error) {
        console.error('Auth init error:', error);
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          // Use setTimeout to escape the callback context
          setTimeout(() => {
            loadCustomer(session.user, session);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            customer: null,
            session: null,
            isLoading: false,
            isInitialized: true,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadCustomer]);

  const signInWithGoogle = useCallback(async () => {
    try {
      console.log('1. Starting Google sign in');
      setState(prev => ({ ...prev, isLoading: true }));

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      console.log('2. Opening browser');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      console.log('3. Browser closed, type:', result.type);

      if (result.type === 'success' && result.url) {
        const hashIndex = result.url.indexOf('#');

        if (hashIndex !== -1) {
          const hash = result.url.substring(hashIndex + 1);
          const params = new URLSearchParams(hash);

          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          console.log('4. Tokens found:', !!access_token && !!refresh_token);

          if (access_token && refresh_token) {
            console.log('5. Setting session...');
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) {
              console.log('6. Session error:', sessionError.message);
              throw sessionError;
            }

            console.log('6. Session set successfully');
          }
        }
      } else {
        console.log('4. Browser cancelled or failed');
        setState(prev => ({ ...prev, isLoading: false }));
      }

    } catch (error) {
      console.error('Sign in error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [redirectTo]);

  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      setState({
        user: null,
        customer: null,
        session: null,
        isLoading: false,
        isInitialized: true,
      });
    }
  }, []);

  const refreshCustomer = useCallback(async () => {
    if (!state.user) return;

    try {
      const customer = await customerService.getByUserId(state.user.id);
      setState(prev => ({ ...prev, customer }));
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