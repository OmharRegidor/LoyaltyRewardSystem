// src/types/wallet.types.ts

export type TransactionType = 'credit' | 'debit';
export type ReferenceType =
  | 'purchase'
  | 'redemption'
  | 'referral'
  | 'bonus'
  | 'adjustment';

export interface Transaction {
  id: string;
  customer_id: string;
  business_id: string | null;
  type: TransactionType;
  amount: number;
  title: string;
  description: string | null;
  reference_id: string | null;
  reference_type: ReferenceType | null;
  created_at: string;
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

export interface GroupedTransactions {
  title: string; // "TODAY", "YESTERDAY", "NOV 28"
  data: Transaction[];
}

export interface CustomerRedemption {
  id: string;
  customer_id: string;
  reward_id: string;
  business_id: string;
  points_used: number;
  redemption_code: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  expires_at: string;
  completed_at: string | null;
  created_at: string;
  reward?: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    points_cost: number;
  } | null;
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

export type WalletTab = 'transactions' | 'rewards';
