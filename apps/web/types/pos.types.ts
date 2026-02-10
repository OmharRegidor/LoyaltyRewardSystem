// apps/web/types/pos.types.ts

// ============================================
// PAYMENT METHOD
// ============================================

export type PaymentMethod = 'cash';

export type DiscountType = 'percentage' | 'fixed';

export type SaleStatus = 'completed' | 'voided';

// ============================================
// PRODUCT TYPES
// ============================================

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price_centavos: number;
  category: string | null;
  sku: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  price: number; // In pesos - converted to centavos on save
  category?: string;
  sku?: string;
  image_url?: string;
  is_active: boolean;
  sort_order?: number;
}

// ============================================
// SALE ITEM TYPES
// ============================================

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit_price_centavos: number;
  total_centavos: number;
  created_at: string;
}

export interface SaleItemInput {
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price_centavos: number;
}

// ============================================
// SALE TYPES
// ============================================

export interface Sale {
  id: string;
  business_id: string;
  branch_id: string | null;
  customer_id: string | null;
  staff_id: string | null;
  sale_number: string;
  subtotal_centavos: number;
  discount_centavos: number;
  discount_type: DiscountType | null;
  discount_reason: string | null;
  total_centavos: number;
  payment_method: PaymentMethod;
  payment_reference: string | null;
  amount_tendered_centavos: number | null;
  change_centavos: number | null;
  points_earned: number;
  points_redeemed: number;
  reward_id: string | null;
  notes: string | null;
  status: SaleStatus;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
  customer?: {
    id: string;
    full_name: string | null;
    phone: string | null;
    total_points: number;
    tier: string;
  } | null;
  staff?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateSaleInput {
  business_id: string;
  branch_id?: string;
  customer_id?: string;
  staff_id?: string;
  items: SaleItemInput[];
  discount_centavos?: number;
  discount_type?: DiscountType;
  discount_reason?: string;
  payment_method: PaymentMethod;
  payment_reference?: string;
  amount_tendered_centavos?: number;
  notes?: string;
}

export interface VoidSaleInput {
  sale_id: string;
  void_reason: string;
  voided_by: string;
}

// ============================================
// DAILY SUMMARY TYPES
// ============================================

export interface DailySummary {
  date: string;
  total_sales: number;
  total_revenue_centavos: number;
  total_items_sold: number;
  total_discounts_centavos: number;
  total_points_earned: number;
  payment_breakdown: {
    cash: number;
  };
  voided_count: number;
}

// ============================================
// FILTER TYPES
// ============================================

export interface SalesFilter {
  start_date?: string;
  end_date?: string;
  payment_method?: PaymentMethod;
  status?: SaleStatus;
  customer_id?: string;
  staff_id?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface CartItem {
  id: string; // Temporary ID for UI
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price_centavos: number;
}

export interface LinkedCustomer {
  id: string;
  fullName: string;
  phone: string;
  totalPoints: number;
  tier: string;
}

export interface POSState {
  items: CartItem[];
  linkedCustomer: LinkedCustomer | null;
  discount: {
    amount_centavos: number;
    type: DiscountType;
    reason?: string;
  } | null;
  notes: string;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface DailyRevenueDataPoint {
  date: string;
  revenue_centavos: number;
  transactions: number;
}

export interface TopProductItem {
  product_id: string | null;
  name: string;
  quantity: number;
  revenue_centavos: number;
}

export interface SalesAnalytics {
  period: {
    start_date: string;
    end_date: string;
  };
  totals: {
    revenue_centavos: number;
    transactions: number;
    items_sold: number;
    avg_order_value_centavos: number;
  };
  daily_revenue: DailyRevenueDataPoint[];
  top_products: TopProductItem[];
}
