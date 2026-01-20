// src/providers/AuthProvider.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Session, User, RealtimeChannel } from '@supabase/supabase-js';
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

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract user profile from Supabase User object
 * Works with Google OAuth and other providers
 */
function extractUserProfile(user: User): {
  id: string;
  email?: string;
  fullName?: string;
} {
  const profile = {
    id: user.id,
    email: user.email,
    fullName: undefined as string | undefined,
  };

  // Try to get full name from user metadata
  // Google OAuth stores it in user_metadata.full_name or user_metadata.name
  const metadata = user.user_metadata;
  if (metadata) {
    profile.fullName =
      metadata.full_name || metadata.name || metadata.given_name
        ? `${metadata.given_name || ''} ${metadata.family_name || ''}`.trim()
        : undefined;
  }

  return profile;
}

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const redirectTo = Linking.createURL('auth/callback');
  const isLoadingCustomer = useRef(false);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  // Separate function to load customer
  const loadCustomer = useCallback(async (user: User, session: Session) => {
    if (isLoadingCustomer.current) return;
    isLoadingCustomer.current = true;

    try {
      // Extract profile from OAuth user
      const profile = extractUserProfile(user);

      // Find or create customer with profile data
      // This will:
      // 1. Link to existing customer by email (if staff-added)
      // 2. Or create new customer with name/email from OAuth
      const customer = await customerService.findOrCreate(profile);

      setState({
        user,
        customer,
        session,
        isLoading: false,
        isInitialized: true,
      });

      // Setup realtime subscription for this customer
      if (customer?.id) {
        setupRealtimeSubscription(customer.id);
      }
    } catch (error) {
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

  // Setup realtime subscription for customer points updates
  const setupRealtimeSubscription = useCallback((customerId: string) => {
    // Clean up existing subscription
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase.channel(`customer-${customerId}`).on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'customers',
        filter: `id=eq.${customerId}`,
      },
      (payload) => {
        // Update customer state with new data
        setState((prev) => ({
          ...prev,
          customer: prev.customer
            ? {
                ...prev.customer,
                total_points: (payload.new as Customer).total_points,
                lifetime_points: (payload.new as Customer).lifetime_points,
                tier: (payload.new as Customer).tier,
                last_visit: (payload.new as Customer).last_visit,
              }
            : null,
        }));
      },
    );

    realtimeChannelRef.current = channel;
  }, []);

  // Cleanup realtime subscription
  const cleanupRealtimeSubscription = useCallback(() => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          await loadCustomer(session.user, session);
        } else {
          setState((prev) => ({ ...prev, isInitialized: true }));
        }
      } catch (error) {
        console.error('[AuthProvider] Auth init error:', error);
        setState((prev) => ({ ...prev, isInitialized: true }));
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {

      if (event === 'SIGNED_IN' && session?.user) {
        setTimeout(() => {
          loadCustomer(session.user, session);
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        cleanupRealtimeSubscription();
        setState({
          user: null,
          customer: null,
          session: null,
          isLoading: false,
          isInitialized: true,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
      cleanupRealtimeSubscription();
    };
  }, [loadCustomer, cleanupRealtimeSubscription]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );

      if (result.type === 'success' && result.url) {
        const hashIndex = result.url.indexOf('#');

        if (hashIndex !== -1) {
          const hash = result.url.substring(hashIndex + 1);
          const params = new URLSearchParams(hash);

          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');


          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) {
              throw sessionError;
            }

          }
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('[AuthProvider] Sign in error:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [redirectTo]);

  const signOut = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      cleanupRealtimeSubscription();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[AuthProvider] Sign out error:', error);
      setState({
        user: null,
        customer: null,
        session: null,
        isLoading: false,
        isInitialized: true,
      });
    }
  }, [cleanupRealtimeSubscription]);

  const refreshCustomer = useCallback(async () => {
    if (!state.user) return;

    try {
      const customer = await customerService.getByUserId(state.user.id);
      setState((prev) => ({ ...prev, customer }));
    } catch (error) {
      console.error('[AuthProvider] Refresh customer error:', error);
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
