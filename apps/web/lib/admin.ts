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
  hasPos: boolean;
}

export interface AuditLogEntry {
  id: string;
  eventType: string;
  severity: string;
  businessId: string | null;
  businessName: string | null;
  userId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface ManualInvoice {
  id: string;
  business_id: string;
  invoice_number: string;
  description: string | null;
  amount_centavos: number;
  amount_paid_centavos: number;
  currency: string;
  status: 'open' | 'partially_paid' | 'paid' | 'void';
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  created_by_email: string;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManualInvoicePayment {
  id: string;
  invoice_id: string;
  amount_centavos: number;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  recorded_by_email: string;
  payment_date: string;
  created_at: string;
}

export interface ManualInvoiceWithBusiness extends ManualInvoice {
  business_name: string;
  owner_email: string | null;
}

export interface UpgradeRequest {
  id: string;
  business_id: string;
  owner_id: string;
  owner_email: string;
  screenshot_url: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by_email: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpgradeRequestWithBusiness extends UpgradeRequest {
  business_name: string;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  eventTypes: string[];
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
    current_period_start: string | null;
    current_period_end: string | null;
    current_plan_id: string | null;
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
    active_rewards: number;
    last_active_at: string | null;
  };
  notes: AdminNote[];
  tags: AdminTag[];
  planChanges: AdminPlanChange[];
  activityTrend: ActivityDataPoint[];
  availablePlans: PlanOption[];
}
