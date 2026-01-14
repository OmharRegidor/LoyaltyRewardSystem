// apps/web/hooks/useCustomers.ts

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export type TierLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Customer {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  totalPoints: number;
  lifetimePoints: number;
  tier: TierLevel;
  lastVisit: string | null;
  createdAt: string;
  createdByStaffId: string | null;
  createdByBusinessId: string | null;
  isNew?: boolean; // For highlighting new customers
}

interface UseCustomersOptions {
  businessId: string | null;
  onNewCustomer?: (customer: Customer) => void;
}

interface UseCustomersReturn {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalCount: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapDatabaseCustomer(dbCustomer: {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  total_points: number | null;
  lifetime_points: number | null;
  tier: string | null;
  last_visit: string | null;
  created_at: string | null;
  created_by_staff_id: string | null;
  created_by_business_id: string | null;
}): Customer {
  return {
    id: dbCustomer.id,
    fullName: dbCustomer.full_name || 'Unknown Customer',
    email: dbCustomer.email,
    phone: dbCustomer.phone,
    totalPoints: dbCustomer.total_points || 0,
    lifetimePoints: dbCustomer.lifetime_points || 0,
    tier: (dbCustomer.tier as TierLevel) || 'bronze',
    lastVisit: dbCustomer.last_visit,
    createdAt: dbCustomer.created_at || new Date().toISOString(),
    createdByStaffId: dbCustomer.created_by_staff_id,
    createdByBusinessId: dbCustomer.created_by_business_id,
  };
}

function isValidTier(tier: string | null): tier is TierLevel {
  return (
    tier !== null && ['bronze', 'silver', 'gold', 'platinum'].includes(tier)
  );
}

// ============================================
// NOTIFICATION SOUND
// ============================================

function playNotificationSound() {
  try {
    // Create a simple notification beep using Web Audio API
    const audioContext = new (window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (err) {
    console.log('Could not play notification sound:', err);
  }
}

// ============================================
// HOOK
// ============================================

export function useCustomers({
  businessId,
  onNewCustomer,
}: UseCustomersOptions): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const customersRef = useRef<Customer[]>([]);

  // Keep ref in sync
  useEffect(() => {
    customersRef.current = customers;
  }, [customers]);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      setIsLoading(true);
      setError(null);

      const {
        data,
        error: fetchError,
        count,
      } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('created_by_business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        throw fetchError;
      }

      const mappedCustomers = (data || []).map(mapDatabaseCustomer);
      setCustomers(mappedCustomers);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Fetch customers error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch customers'
      );
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  // Initial fetch
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Realtime subscription
  useEffect(() => {
    if (!businessId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`customers-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customers',
          filter: `created_by_business_id=eq.${businessId}`,
        },
        (
          payload: RealtimePostgresChangesPayload<{
            id: string;
            full_name: string | null;
            email: string | null;
            phone: string | null;
            total_points: number | null;
            lifetime_points: number | null;
            tier: string | null;
            last_visit: string | null;
            created_at: string | null;
            created_by_staff_id: string | null;
            created_by_business_id: string | null;
          }>
        ) => {
          console.log('[Realtime] New customer:', payload);

          if (payload.new && 'id' in payload.new) {
            const newCustomer: Customer = {
              ...mapDatabaseCustomer(payload.new),
              isNew: true, // Mark for highlighting
            };

            // Add to top of list
            setCustomers((prev) => [newCustomer, ...prev]);
            setTotalCount((prev) => prev + 1);

            // Play sound
            playNotificationSound();

            // Callback
            onNewCustomer?.(newCustomer);

            // Remove highlight after 3 seconds
            setTimeout(() => {
              setCustomers((prev) =>
                prev.map((c) =>
                  c.id === newCustomer.id ? { ...c, isNew: false } : c
                )
              );
            }, 3000);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customers',
        },
        (
          payload: RealtimePostgresChangesPayload<{
            id: string;
            full_name: string | null;
            email: string | null;
            phone: string | null;
            total_points: number | null;
            lifetime_points: number | null;
            tier: string | null;
            last_visit: string | null;
            created_at: string | null;
            created_by_staff_id: string | null;
            created_by_business_id: string | null;
          }>
        ) => {
          console.log('[Realtime] Customer updated:', payload);

          if (payload.new && 'id' in payload.new) {
            const updatedCustomer = mapDatabaseCustomer(payload.new);

            setCustomers((prev) =>
              prev.map((c) =>
                c.id === updatedCustomer.id
                  ? { ...updatedCustomer, isNew: true }
                  : c
              )
            );

            // Remove highlight after 3 seconds
            setTimeout(() => {
              setCustomers((prev) =>
                prev.map((c) =>
                  c.id === updatedCustomer.id ? { ...c, isNew: false } : c
                )
              );
            }, 3000);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    return () => {
      console.log('[Realtime] Unsubscribing from customers channel');
      supabase.removeChannel(channel);
    };
  }, [businessId, onNewCustomer]);

  return {
    customers,
    isLoading,
    error,
    refetch: fetchCustomers,
    totalCount,
  };
}
