// apps/web/lib/admin.ts
// Admin type definitions (auth logic moved to server-auth.ts + rbac.ts)

// ============================================
// TYPES
// ============================================

export interface AdminPlatformStats {
  total_businesses: number;
  businesses_30d: number;
  businesses_7d: number;
  enterprise_count: number;
  free_count: number;
  total_customers: number;
  customers_30d: number;
  total_transactions: number;
  transactions_30d: number;
  total_points_issued: number;
  points_issued_30d: number;
  total_bookings: number;
  bookings_30d: number;
  active_subscriptions: number;
}

export interface AdminBusinessStats {
  id: string;
  name: string;
  slug: string;
  owner_email: string | null;
  created_at: string | null;
  subscription_status: string;
  business_type: string | null;
  phone: string | null;
  plan_name: string | null;
  customer_count: number;
  staff_count: number;
  transaction_count: number;
  transactions_30d: number;
  branch_count: number;
  points_issued: number;
  last_active_at: string | null;
}

export interface AdminBusinessListResponse {
  businesses: AdminBusinessStats[];
  totalCount: number;
  facets: {
    plans: Record<string, number>;
    types: Record<string, number>;
    statuses: Record<string, number>;
  };
  adminEmail: string;
}

export interface AdminNote {
  id: string;
  business_id: string;
  author_email: string;
  content: string;
  created_at: string;
}

export interface AdminTag {
  id: string;
  business_id: string;
  tag: string;
  created_at: string;
}

export interface AdminPlanChange {
  id: string;
  business_id: string;
  changed_by_email: string;
  old_plan_id: string | null;
  new_plan_id: string | null;
  old_plan_name: string | null;
  new_plan_name: string | null;
  reason: string | null;
  created_at: string;
}

export interface PlanOption {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number | null;
  price_annual: number | null;
}

export interface BusinessSearchResult {
  id: string;
  name: string;
  ownerEmail: string | null;
  planName: string | null;
}

export interface PlanChangeRow {
  id: string;
  businessId: string;
  businessName: string;
  oldPlanName: string | null;
  newPlanName: string | null;
  changedByEmail: string;
  reason: string | null;
  createdAt: string;
}

export interface PlanChangesResponse {
  changes: PlanChangeRow[];
  plans: PlanOption[];
}

export interface EnterpriseAccount {
  id: string;
  businessId: string;
  businessName: string;
  ownerEmail: string | null;
  upgradedAt: string;
  planName: string;
  hasBooking: boolean;
  hasPos: boolean;
}

export interface ActivityDataPoint {
  day: string;
  transactions: number;
  new_customers: number;
  points_earned: number;
}

export interface BusinessDetailResponse {
  business: {
    id: string;
    name: string;
    slug: string;
    owner_email: string | null;
    created_at: string | null;
    subscription_status: string;
    business_type: string | null;
    phone: string | null;
    city: string | null;
    address: string | null;
    logo_url: string | null;
    points_per_purchase: number | null;
    plan_name: string | null;
    billing_interval: string | null;
    current_period_end: string | null;
    current_plan_id: string | null;
    has_booking: boolean;
    has_pos: boolean;
    has_loyalty: boolean;
  };
  stats: {
    customer_count: number;
    staff_count: number;
    transaction_count: number;
    transactions_30d: number;
    branch_count: number;
    points_issued: number;
    new_customers_30d: number;
    points_issued_30d: number;
    bookings_30d: number;
    active_rewards: number;
    active_services: number;
    last_active_at: string | null;
  };
  notes: AdminNote[];
  tags: AdminTag[];
  planChanges: AdminPlanChange[];
  activityTrend: ActivityDataPoint[];
  availablePlans: PlanOption[];
}
