// src/hooks/useWallet.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useCustomer } from './useCustomer';
import type {
  Transaction,
  CustomerRedemption,
  GroupedTransactions,
  WalletTab,
} from '../types/wallet.types';

// ============================================
// TYPES
// ============================================

interface BusinessJoin {
  id: string;
  name: string;
  logo_url: string | null;
}

interface RewardJoin {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  points_cost: number;
}

interface TransactionRow {
  id: string;
  customer_id: string;
  business_id: string | null;
  reward_id: string | null;
  type: string;
  points: number;
  amount_spent: number | null;
  description: string | null;
  created_at: string;
  businesses: unknown;
}

interface RedemptionRow {
  id: string;
  customer_id: string;
  reward_id: string;
  business_id: string;
  points_used: number;
  redemption_code: string;
  status: string;
  expires_at: string;
  completed_at: string | null;
  created_at: string;
  rewards: unknown;
  businesses: unknown;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Safely extracts the first item from a Supabase joined relation
 * Supabase returns joins as arrays, so we need to handle this consistently
 */
function extractFirstFromJoin<T>(data: unknown): T | null {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] ?? null;
  return data as T;
}

/**
 * Checks if two dates are the same day
 */
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Formats a date for section headers (e.g., "NOV 28")
 */
function formatDateHeader(date: Date): string {
  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
}

/**
 * Gets the group key for a transaction date (TODAY, YESTERDAY, or formatted date)
 */
function getDateGroupKey(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) return 'TODAY';
  if (isSameDay(date, yesterday)) return 'YESTERDAY';
  return formatDateHeader(date);
}

/**
 * Groups transactions by date
 */
function groupTransactionsByDate(
  transactions: Transaction[]
): GroupedTransactions[] {
  const groups = new Map<string, Transaction[]>();

  transactions.forEach((tx) => {
    const groupKey = getDateGroupKey(new Date(tx.created_at));

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(tx);
  });

  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}

// ============================================
// TRANSFORMERS
// ============================================

/**
 * Transforms a database transaction row to the Transaction type
 */
function transformTransaction(row: TransactionRow): Transaction {
  const business = extractFirstFromJoin<BusinessJoin>(row.businesses);
  const isEarn = row.type === 'earn';

  return {
    id: row.id,
    customer_id: row.customer_id,
    business_id: row.business_id,
    type: isEarn ? 'credit' : 'debit',
    amount: row.points,
    title: row.description ?? (isEarn ? 'Points Earned' : 'Points Redeemed'),
    description: row.amount_spent
      ? `₱${row.amount_spent.toFixed(2)} spent`
      : null,
    reference_id: row.reward_id,
    reference_type: isEarn ? 'purchase' : 'redemption',
    created_at: row.created_at,
    business: business
      ? {
          id: business.id,
          name: business.name,
          logo_url: business.logo_url,
        }
      : null,
  };
}

/**
 * Transforms a database redemption row to the CustomerRedemption type
 */
function transformRedemption(row: RedemptionRow): CustomerRedemption {
  const reward = extractFirstFromJoin<RewardJoin>(row.rewards);
  const business = extractFirstFromJoin<BusinessJoin>(row.businesses);

  const defaultReward = {
    id: '',
    title: 'Unknown Reward',
    description: '',
    image_url: '',
    points_cost: row.points_used,
  };

  return {
    id: row.id,
    customer_id: row.customer_id,
    reward_id: row.reward_id,
    business_id: row.business_id,
    points_used: row.points_used,
    redemption_code: row.redemption_code,
    status: row.status as CustomerRedemption['status'],
    expires_at: row.expires_at,
    completed_at: row.completed_at,
    created_at: row.created_at,
    reward: reward
      ? {
          id: reward.id,
          title: reward.title,
          description: reward.description ?? '',
          image_url: reward.image_url ?? '',
          points_cost: reward.points_cost,
        }
      : defaultReward,
    business: business
      ? {
          id: business.id,
          name: business.name,
          logo_url: business.logo_url,
        }
      : null,
  };
}

// ============================================
// QUERY DEFINITIONS
// ============================================

const TRANSACTION_SELECT = `
  id,
  customer_id,
  business_id,
  reward_id,
  type,
  points,
  amount_spent,
  description,
  created_at,
  businesses:business_id (id, name, logo_url)
` as const;

const REDEMPTION_SELECT = `
  id,
  customer_id,
  reward_id,
  business_id,
  points_used,
  redemption_code,
  status,
  expires_at,
  completed_at,
  created_at,
  rewards:reward_id (id, title, description, image_url, points_cost),
  businesses:business_id (id, name, logo_url)
` as const;

const TRANSACTION_LIMIT = 50;

// ============================================
// HOOK
// ============================================

export function useWallet() {
  const { customer, points } = useCustomer();

  // State
  const [activeTab, setActiveTab] = useState<WalletTab>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [redemptions, setRedemptions] = useState<CustomerRedemption[]>([]);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchTransactions = useCallback(
    async (customerId: string): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select(TRANSACTION_SELECT)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(TRANSACTION_LIMIT);

      if (error) throw error;

      return (data as TransactionRow[]).map(transformTransaction);
    },
    []
  );

  const fetchRedemptions = useCallback(
    async (customerId: string): Promise<CustomerRedemption[]> => {
      const { data, error } = await supabase
        .from('redemptions')
        .select(REDEMPTION_SELECT)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data as RedemptionRow[]).map(transformRedemption);
    },
    []
  );

  const fetchLifetimePoints = useCallback(
    async (customerId: string): Promise<number> => {
      const { data, error } = await supabase
        .from('customers')
        .select('lifetime_points')
        .eq('id', customerId)
        .single();

      if (error) throw error;

      return (data as { lifetime_points: number | null })?.lifetime_points ?? 0;
    },
    []
  );

  const fetchAllData = useCallback(async () => {
    if (!customer?.id) return;

    try {
      setError(null);

      const [txData, redemptionData, lifetime] = await Promise.all([
        fetchTransactions(customer.id),
        fetchRedemptions(customer.id),
        fetchLifetimePoints(customer.id),
      ]);

      setTransactions(txData);
      setRedemptions(redemptionData);
      setLifetimePoints(lifetime);
    } catch (err) {
      console.error('Wallet fetch error:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to fetch wallet data')
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [customer?.id, fetchTransactions, fetchRedemptions, fetchLifetimePoints]);

  // ============================================
  // EFFECTS
  // ============================================

  // Initial fetch
  useEffect(() => {
    if (customer?.id) {
      fetchAllData();
    }
  }, [customer?.id, fetchAllData]);

  // Realtime subscription for new transactions
  useEffect(() => {
    if (!customer?.id) return;

    const channel = supabase
      .channel(`wallet-${customer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `customer_id=eq.${customer.id}`,
        },
        () => {
          console.log('New transaction detected, refreshing...');
          fetchAllData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customer?.id, fetchAllData]);

  // ============================================
  // HANDLERS
  // ============================================

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAllData();
  }, [fetchAllData]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(transactions),
    [transactions]
  );

  const activeRedemptions = useMemo(
    () => redemptions.filter((r) => r.status === 'pending'),
    [redemptions]
  );

  const pastRedemptions = useMemo(
    () => redemptions.filter((r) => r.status !== 'pending'),
    [redemptions]
  );

  // ============================================
  // RETURN
  // ============================================

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Data
    transactions,
    groupedTransactions,
    redemptions,
    activeRedemptions,
    pastRedemptions,

    // Points
    currentPoints: points,
    lifetimePoints,

    // Loading states
    isLoading,
    isRefreshing,
    error,

    // Actions
    refresh,
  };
}
