// src/hooks/useWallet.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { walletService } from '../services/wallet.service';
import { useCustomer } from './useCustomer';
import type {
  Transaction,
  CustomerRedemption,
  GroupedTransactions,
  WalletTab,
} from '../types/wallet.types';

// Mock transactions for development
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    customer_id: 'c1',
    business_id: 'b1',
    type: 'credit',
    amount: 50,
    title: 'Purchase at Bean & Brew',
    description: null,
    reference_id: null,
    reference_type: 'purchase',
    created_at: new Date().toISOString(),
    business: { id: 'b1', name: 'Bean & Brew', logo_url: null },
  },
  {
    id: '2',
    customer_id: 'c1',
    business_id: null,
    type: 'credit',
    amount: 100,
    title: 'Referral Bonus',
    description: 'Friend signed up using your code',
    reference_id: null,
    reference_type: 'referral',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    business: null,
  },
  {
    id: '3',
    customer_id: 'c1',
    business_id: 'b1',
    type: 'debit',
    amount: 100,
    title: 'Redeemed: Free Coffee',
    description: null,
    reference_id: null,
    reference_type: 'redemption',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    business: { id: 'b1', name: 'Bean & Brew', logo_url: null },
  },
  {
    id: '4',
    customer_id: 'c1',
    business_id: 'b2',
    type: 'credit',
    amount: 35,
    title: 'Purchase at Sweet Delights',
    description: null,
    reference_id: null,
    reference_type: 'purchase',
    created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // Yesterday
    business: { id: 'b2', name: 'Sweet Delights', logo_url: null },
  },
  {
    id: '5',
    customer_id: 'c1',
    business_id: null,
    type: 'credit',
    amount: 80,
    title: 'Double Points Event',
    description: 'Weekend bonus',
    reference_id: null,
    reference_type: 'bonus',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Nov 28
    business: null,
  },
  {
    id: '6',
    customer_id: 'c1',
    business_id: 'b3',
    type: 'debit',
    amount: 50,
    title: 'Redeemed: 10% Discount',
    description: null,
    reference_id: null,
    reference_type: 'redemption',
    created_at: new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000
    ).toISOString(),
    business: { id: 'b3', name: 'Pizza Palace', logo_url: null },
  },
];

const MOCK_REDEMPTIONS: CustomerRedemption[] = [
  {
    id: 'r1',
    customer_id: 'c1',
    reward_id: 'rw1',
    business_id: 'b1',
    points_used: 500,
    redemption_code: 'RDM-ABC12345',
    status: 'pending',
    expires_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(), // 20 hours left
    completed_at: null,
    created_at: new Date().toISOString(),
    reward: {
      id: 'rw1',
      title: 'Free Coffee & Pastry',
      description: 'Enjoy a complimentary coffee with a pastry',
      image_url:
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
      points_cost: 500,
    },
    business: { id: 'b1', name: 'Bean & Brew Cafe', logo_url: null },
  },
  {
    id: 'r2',
    customer_id: 'c1',
    reward_id: 'rw2',
    business_id: 'b2',
    points_used: 750,
    redemption_code: 'RDM-XYZ98765',
    status: 'completed',
    expires_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    reward: {
      id: 'rw2',
      title: '20% Off Next Order',
      description: 'Get 20% off your entire order',
      image_url:
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
      points_cost: 750,
    },
    business: { id: 'b2', name: 'Downtown Bistro', logo_url: null },
  },
  {
    id: 'r3',
    customer_id: 'c1',
    reward_id: 'rw3',
    business_id: 'b3',
    points_used: 600,
    redemption_code: 'RDM-DEF45678',
    status: 'expired',
    expires_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    reward: {
      id: 'rw3',
      title: '2-for-1 Happy Hour',
      description: 'Buy one cocktail, get one free',
      image_url:
        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400',
      points_cost: 600,
    },
    business: { id: 'b3', name: 'The Sunset Lounge', logo_url: null },
  },
];

// Toggle for mock vs real data
const USE_MOCK_DATA = true;

/**
 * Group transactions by date (TODAY, YESTERDAY, or date)
 */
function groupTransactionsByDate(
  transactions: Transaction[]
): GroupedTransactions[] {
  const groups: Map<string, Transaction[]> = new Map();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  transactions.forEach((tx) => {
    const txDate = new Date(tx.created_at);
    let groupKey: string;

    if (isSameDay(txDate, today)) {
      groupKey = 'TODAY';
    } else if (isSameDay(txDate, yesterday)) {
      groupKey = 'YESTERDAY';
    } else {
      groupKey = formatDateHeader(txDate);
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(tx);
  });

  return Array.from(groups.entries()).map(([title, data]) => ({
    title,
    data,
  }));
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDateHeader(date: Date): string {
  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
}

export function useWallet() {
  const { customer, points } = useCustomer();

  const [activeTab, setActiveTab] = useState<WalletTab>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [redemptions, setRedemptions] = useState<CustomerRedemption[]>([]);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!customer) return;

    try {
      setError(null);

      if (USE_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setTransactions(MOCK_TRANSACTIONS);
        setRedemptions(MOCK_REDEMPTIONS);
        setLifetimePoints(3420);
      } else {
        const [txData, redemptionData, lifetime] = await Promise.all([
          walletService.getTransactions(customer.id),
          walletService.getRedemptions(customer.id),
          walletService.getLifetimePoints(customer.id),
        ]);
        setTransactions(txData);
        setRedemptions(redemptionData);
        setLifetimePoints(lifetime);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch wallet data')
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [customer]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh handler
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
  }, [fetchData]);

  // Group transactions by date
  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(transactions),
    [transactions]
  );

  // Separate redemptions by status
  const activeRedemptions = useMemo(
    () => redemptions.filter((r) => r.status === 'pending'),
    [redemptions]
  );

  const pastRedemptions = useMemo(
    () => redemptions.filter((r) => r.status !== 'pending'),
    [redemptions]
  );

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
    refresh,
  };
}
