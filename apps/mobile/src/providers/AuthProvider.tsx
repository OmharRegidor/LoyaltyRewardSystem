// src/providers/AuthProvider.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { AppState } from 'react-native';
import { Session, User, RealtimeChannel } from '@supabase/supabase-js';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { customerService } from '../services/customer.service';
import { notificationService } from '../services/notification.service';
import type { Customer } from '../types/database.types';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

interface AuthState {
  user: User | null;
  customer: Customer | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  isNewCustomer: boolean;
  needsPhone: boolean;
  totalPoints: number;
  lifetimePoints: number;
  customerIds: string[];
}

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
  clearNewCustomerFlag: () => void;
  dismissPhonePrompt: () => void;
  submitPhone: (phone: string) => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  customer: null,
  session: null,
  isLoading: false,
  isInitialized: false,
  isNewCustomer: false,
  needsPhone: false,
  totalPoints: 0,
  lifetimePoints: 0,
  customerIds: [],
};

const PHONE_PROMPT_SKIP_KEY = 'phone_prompt_skip_count';
const MAX_PHONE_PROMPTS = 3;

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
      metadata.full_name ||
      metadata.name ||
      (metadata.given_name
        ? `${metadata.given_name} ${metadata.family_name || ''}`.trim()
        : undefined);
  }

  return profile;
}

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const isLoadingCustomer = useRef(false);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const pushTokenRef = useRef<string | null>(null);

  // Separate function to load customer
  const loadCustomer = useCallback(
    async (user: User, session: Session, fromInit = false) => {
      if (isLoadingCustomer.current) return;
      isLoadingCustomer.current = true;

      try {
        const profile = extractUserProfile(user);
        const { customer, isNew } =
          await customerService.findOrCreate(profile);

        // Fetch all customer IDs and aggregate points across all businesses
        const [aggregated, customerIds] = await Promise.all([
          customerService.getAggregatedPoints(user.id),
          customerService.getAllCustomerIds(user.id),
        ]);

        // Check if phone prompt should be shown
        let needsPhone = false;
        if (customer && !customer.phone) {
          const skipCountStr = await AsyncStorage.getItem(PHONE_PROMPT_SKIP_KEY);
          const skipCount = skipCountStr ? parseInt(skipCountStr, 10) : 0;
          needsPhone = skipCount < MAX_PHONE_PROMPTS;
        }

        setState({
          user,
          customer,
          session,
          isLoading: false,
          isInitialized: true,
          // Only show onboarding modal for fresh signups, not app relaunches
          isNewCustomer: fromInit ? false : isNew,
          needsPhone,
          totalPoints: aggregated.totalPoints,
          lifetimePoints: aggregated.lifetimePoints,
          customerIds,
        });

        if (customer?.id) {
          setupRealtimeSubscription(user.id);

          // Register push token (non-blocking)
          notificationService.registerPushToken(customer.id).then((token) => {
            if (token) pushTokenRef.current = token;
          });
        }
      } catch (error) {
        console.error('[AuthProvider] Load customer error:', error);
        setState({
          user,
          customer: null,
          session,
          isLoading: false,
          isInitialized: true,
          isNewCustomer: false,
          needsPhone: false,
          totalPoints: 0,
          lifetimePoints: 0,
          customerIds: [],
        });
      } finally {
        isLoadingCustomer.current = false;
      }
    },
    [],
  );

  // Setup realtime subscription for customer points updates (all records for user)
  const setupRealtimeSubscription = useCallback((userId: string) => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase.channel(`customer-user-${userId}`).on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'customers',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        // Re-aggregate points from all customer records
        customerService.getAggregatedPoints(userId).then((aggregated) => {
          setState((prev) => ({
            ...prev,
            totalPoints: aggregated.totalPoints,
            lifetimePoints: aggregated.lifetimePoints,
          }));
        });
      },
    );

    realtimeChannelRef.current = channel;
    channel.subscribe((status) => {
      console.log('[Realtime] Subscription status:', status);
    });
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
          await loadCustomer(session.user, session, true);
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
      console.log('[AuthProvider] Auth state changed:', event);
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
          isNewCustomer: false,
          needsPhone: false,
          totalPoints: 0,
          lifetimePoints: 0,
          customerIds: [],
        });
      }
    });

    return () => {
      subscription.unsubscribe();
      cleanupRealtimeSubscription();
    };
  }, [loadCustomer, cleanupRealtimeSubscription]);

  // Keep auth token fresh & reconnect realtime when app returns from background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    // Start auto-refresh immediately
    supabase.auth.startAutoRefresh();
    return () => {
      sub.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) throw new Error('No ID token returned from Google');

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;
      // onAuthStateChange handles the rest
    } catch (error) {
      console.error('[AuthProvider] Sign in error:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Remove push token before signing out
      if (state.customer?.id && pushTokenRef.current) {
        await notificationService
          .removePushToken(state.customer.id, pushTokenRef.current)
          .catch(() => {});
        pushTokenRef.current = null;
      }

      cleanupRealtimeSubscription();
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[AuthProvider] Sign out error:', error);
      setState({
        user: null,
        customer: null,
        session: null,
        isLoading: false,
        isInitialized: true,
        isNewCustomer: false,
        needsPhone: false,
        totalPoints: 0,
        lifetimePoints: 0,
        customerIds: [],
      });
    }
  }, [cleanupRealtimeSubscription, state.customer?.id]);

  const clearNewCustomerFlag = useCallback(() => {
    setState((prev) => ({ ...prev, isNewCustomer: false }));
  }, []);

  const dismissPhonePrompt = useCallback(async () => {
    const skipCountStr = await AsyncStorage.getItem(PHONE_PROMPT_SKIP_KEY);
    const skipCount = skipCountStr ? parseInt(skipCountStr, 10) : 0;
    await AsyncStorage.setItem(PHONE_PROMPT_SKIP_KEY, String(skipCount + 1));
    setState((prev) => ({ ...prev, needsPhone: false }));
  }, []);

  const submitPhone = useCallback(async (phone: string) => {
    if (!state.customer) return;
    await customerService.updatePhone(state.customer.id, phone);
    // Clear skip counter since they completed it
    await AsyncStorage.removeItem(PHONE_PROMPT_SKIP_KEY);
    setState((prev) => ({
      ...prev,
      needsPhone: false,
      customer: prev.customer ? { ...prev.customer, phone } : null,
    }));
  }, [state.customer]);

  const refreshCustomer = useCallback(async () => {
    if (!state.user) return;

    try {
      const [customer, aggregated, customerIds] = await Promise.all([
        customerService.getByUserId(state.user.id),
        customerService.getAggregatedPoints(state.user.id),
        customerService.getAllCustomerIds(state.user.id),
      ]);
      setState((prev) => ({
        ...prev,
        customer,
        totalPoints: aggregated.totalPoints,
        lifetimePoints: aggregated.lifetimePoints,
        customerIds,
      }));
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
        clearNewCustomerFlag,
        dismissPhonePrompt,
        submitPhone,
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
