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

interface DatabaseCustomer {
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
}

function mapDatabaseCustomer(dbCustomer: DatabaseCustomer): Customer {
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

// ============================================
// NOTIFICATION SOUND
// ============================================

function playNotificationSound() {
  try {
    // Create a simple notification beep using Web Audio API
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
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

  // Fetch customers - ALL customers who have interacted with this business
  const fetchCustomers = useCallback(async () => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      setIsLoading(true);
      setError(null);

      // Get all unique customer IDs who have transactions with this business
      // OR were created by this business (staff-added)
      const { data, error: fetchError } = await supabase
        .from('customers')
        .select(
          `
          id,
          full_name,
          email,
          phone,
          total_points,
          lifetime_points,
          tier,
          last_visit,
          created_at,
          created_by_staff_id,
          created_by_business_id
        `
        )
        .or(
          `created_by_business_id.eq.${businessId},id.in.(${await getCustomerIdsWithTransactions(
            supabase,
            businessId
          )})`
        )
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Remove duplicates (in case a customer matches both conditions)
      const uniqueCustomers = removeDuplicates(data || []);
      const mappedCustomers = uniqueCustomers.map(mapDatabaseCustomer);

      setCustomers(mappedCustomers);
      setTotalCount(mappedCustomers.length);
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

  // Realtime subscription for new customers and updates
  useEffect(() => {
    if (!businessId) return;

    const supabase = createClient();

    // Subscribe to customer inserts (staff-added)
    const insertChannel = supabase
      .channel(`customers-insert-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customers',
          filter: `created_by_business_id=eq.${businessId}`,
        },
        (payload: RealtimePostgresChangesPayload<DatabaseCustomer>) => {
          console.log('[Realtime] New customer:', payload);

          if (payload.new && 'id' in payload.new) {
            const newCustomer: Customer = {
              ...mapDatabaseCustomer(payload.new as DatabaseCustomer),
              isNew: true,
            };

            // Add to top of list if not already present
            setCustomers((prev) => {
              if (prev.some((c) => c.id === newCustomer.id)) return prev;
              return [newCustomer, ...prev];
            });
            setTotalCount((prev) => prev + 1);

            playNotificationSound();
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
      .subscribe();

    // Subscribe to customer updates (points changes, tier upgrades)
    const updateChannel = supabase
      .channel(`customers-update-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customers',
        },
        (payload: RealtimePostgresChangesPayload<DatabaseCustomer>) => {
          console.log('[Realtime] Customer updated:', payload);

          if (payload.new && 'id' in payload.new) {
            const updatedCustomer = mapDatabaseCustomer(
              payload.new as DatabaseCustomer
            );

            setCustomers((prev) => {
              const exists = prev.some((c) => c.id === updatedCustomer.id);
              if (exists) {
                return prev.map((c) =>
                  c.id === updatedCustomer.id
                    ? { ...updatedCustomer, isNew: true }
                    : c
                );
              }
              return prev;
            });

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
      .subscribe();

    // Subscribe to new transactions (to add customers who just got scanned)
    const transactionChannel = supabase
      .channel(`transactions-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `business_id=eq.${businessId}`,
        },
        async (payload) => {
          console.log('[Realtime] New transaction:', payload);

          if (payload.new && 'customer_id' in payload.new) {
            const customerId = payload.new.customer_id as string;

            // Check if customer is already in the list
            const alreadyExists = customersRef.current.some(
              (c) => c.id === customerId
            );

            if (!alreadyExists) {
              // Fetch the customer and add to list
              const { data: customerData } = await supabase
                .from('customers')
                .select(
                  `
                  id,
                  full_name,
                  email,
                  phone,
                  total_points,
                  lifetime_points,
                  tier,
                  last_visit,
                  created_at,
                  created_by_staff_id,
                  created_by_business_id
                `
                )
                .eq('id', customerId)
                .single();

              if (customerData) {
                const newCustomer: Customer = {
                  ...mapDatabaseCustomer(customerData),
                  isNew: true,
                };

                setCustomers((prev) => [newCustomer, ...prev]);
                setTotalCount((prev) => prev + 1);

                playNotificationSound();
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
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[Realtime] Unsubscribing from channels');
      supabase.removeChannel(insertChannel);
      supabase.removeChannel(updateChannel);
      supabase.removeChannel(transactionChannel);
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

// ============================================
// HELPER: Get customer IDs with transactions
// ============================================

async function getCustomerIdsWithTransactions(
  supabase: ReturnType<typeof createClient>,
  businessId: string
): Promise<string> {
  const { data } = await supabase
    .from('transactions')
    .select('customer_id')
    .eq('business_id', businessId);

  if (!data || data.length === 0) {
    // Return a UUID that won't match anything
    return '00000000-0000-0000-0000-000000000000';
  }

  // Get unique customer IDs
  const uniqueIds = [...new Set(data.map((t) => t.customer_id))];
  return uniqueIds.join(',');
}

// ============================================
// HELPER: Remove duplicate customers
// ============================================

function removeDuplicates(customers: DatabaseCustomer[]): DatabaseCustomer[] {
  const seen = new Set<string>();
  return customers.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}
