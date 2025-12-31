// src/types/rewards.types.ts

export interface Reward {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  points_cost: number;
  stock: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
  category: RewardCategory;
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

export type RewardCategory =
  | 'all'
  | 'food'
  | 'drinks'
  | 'discounts'
  | 'free'
  | 'prods';

export interface RewardFilter {
  category: RewardCategory;
  searchQuery: string;
}

export interface Redemption {
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
}
