// apps/web/types/staff-pos.types.ts

import type { CartItem, DiscountType, SaleItemInput } from "./pos.types";

// ============================================
// TIER CONFIGURATION (shared between staff page & hook)
// ============================================

export type TierKey = "bronze" | "silver" | "gold" | "platinum";

export interface TierConfig {
  name: string;
  multiplier: number;
  color: string;
  emoji: string;
}

export const TIERS: Record<TierKey, TierConfig> = {
  bronze: { name: "Bronze", multiplier: 1.0, color: "#CD7F32", emoji: "🥉" },
  silver: { name: "Silver", multiplier: 1.25, color: "#C0C0C0", emoji: "🥈" },
  gold: { name: "Gold", multiplier: 1.5, color: "#FFD700", emoji: "🥇" },
  platinum: {
    name: "Platinum",
    multiplier: 2.0,
    color: "#E5E4E2",
    emoji: "💎",
  },
};

// ============================================
// STAFF CART ITEM
// ============================================

export interface StaffCartItem extends CartItem {
  image_url?: string | null;
  stock_quantity?: number;
}

// ============================================
// EXCHANGE INFO
// ============================================

export interface ExchangeInfo {
  pointsUsed: number;
  pesosValueCentavos: number;
}

// ============================================
// DISCOUNT INFO
// ============================================

export interface DiscountInfo {
  type: DiscountType;
  value: number; // percentage (0-100) or fixed centavos
  reason?: string;
}

// ============================================
// STAFF SALE INPUT (API payload)
// ============================================

export interface StaffSaleInput {
  customer_id: string;
  items: SaleItemInput[];
  discount_type?: DiscountType;
  discount_centavos?: number;
  discount_reason?: string;
  exchange_points?: number;
  amount_tendered_centavos?: number;
  tier: TierKey;
}

// ============================================
// STAFF SALE RESULT (API response)
// ============================================

export interface StaffSaleResult {
  sale_id: string;
  sale_number: string;
  subtotal_centavos: number;
  discount_centavos: number;
  exchange_centavos: number;
  total_centavos: number;
  points_earned: number;
  points_redeemed: number;
  new_points_balance: number;
  tier_multiplier: number;
  base_points: number;
}
