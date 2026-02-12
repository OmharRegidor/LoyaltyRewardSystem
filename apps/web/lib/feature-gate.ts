// apps/web/lib/feature-gate.ts

import { createClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export type FeatureName =
  | 'qr_loyalty'
  | 'email_onboarding'
  | 'basic_analytics'
  | 'advanced_analytics'
  | 'standard_support'
  | 'priority_support'
  | 'api_access'
  | 'custom_branding'
  | 'webhook_notifications'
  | 'dedicated_account_manager';

export type ModuleName = 'loyalty' | 'booking' | 'pos';

export interface ModuleCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface PlanModuleFlags {
  has_loyalty: boolean | null;
  has_booking: boolean | null;
  has_pos: boolean | null;
}

export type LimitType = 'customers' | 'branches' | 'staff';

export interface FeatureCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number | null;
  remaining: number | null;
  reason?: string;
}

// ============================================
// SERVER-SIDE FEATURE GATE
// ============================================

/**
 * Create a service-role Supabase client for server-side operations
 */
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Check if a business has access to a specific module (loyalty, booking, pos)
 * This is the SERVER-SIDE check that cannot be bypassed
 */
export async function checkModuleAccess(
  businessId: string,
  module: ModuleName
): Promise<ModuleCheckResult> {
  const supabase = getServiceClient();

  // Get subscription and plan module flags
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(
      `
      status,
      plans (
        has_loyalty,
        has_booking,
        has_pos
      )
    `
    )
    .eq('business_id', businessId)
    .single();

  // No subscription or not active
  if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
    return {
      allowed: false,
      reason: 'No active subscription',
    };
  }

  // Check module access in plan
  const planData = Array.isArray(subscription.plans)
    ? subscription.plans[0]
    : subscription.plans;

  if (!planData) {
    return {
      allowed: false,
      reason: 'No plan associated with subscription',
    };
  }

  const plan: PlanModuleFlags = {
    has_loyalty: 'has_loyalty' in planData ? (planData.has_loyalty as boolean | null) : null,
    has_booking: 'has_booking' in planData ? (planData.has_booking as boolean | null) : null,
    has_pos: 'has_pos' in planData ? (planData.has_pos as boolean | null) : null,
  };

  const moduleColumnMap: Record<ModuleName, keyof PlanModuleFlags> = {
    loyalty: 'has_loyalty',
    booking: 'has_booking',
    pos: 'has_pos',
  };

  const columnName = moduleColumnMap[module];
  const hasAccess = plan[columnName] === true;

  return {
    allowed: hasAccess,
    reason: hasAccess
      ? undefined
      : `Module "${module}" not available in your plan. Upgrade to Enterprise for access.`,
  };
}

/**
 * Check if a business has access to a specific feature
 * This is the SERVER-SIDE check that cannot be bypassed
 */
export async function checkFeatureAccess(
  businessId: string,
  feature: FeatureName
): Promise<FeatureCheckResult> {
  const supabase = getServiceClient();

  // Get subscription and plan features
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(
      `
      status,
      plans (
        features
      )
    `
    )
    .eq('business_id', businessId)
    .single();

  // No subscription or not active
  if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
    return {
      allowed: false,
      reason: 'No active subscription',
    };
  }

  // Check feature in plan
  const plan = Array.isArray(subscription.plans)
    ? subscription.plans[0]
    : subscription.plans;
  const features = (plan && 'features' in plan ? plan.features : {}) as Record<
    string,
    boolean
  >;
  const hasFeature = features[feature] === true;

  return {
    allowed: hasFeature,
    reason: hasFeature
      ? undefined
      : `Feature "${feature}" not available in your plan`,
  };
}

/**
 * Check if a business is within their plan limits
 * This is the SERVER-SIDE check that cannot be bypassed
 */
export async function checkLimitAccess(
  businessId: string,
  limitType: LimitType
): Promise<LimitCheckResult> {
  const supabase = getServiceClient();

  // Get subscription and plan limits
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(
      `
      status,
      plans (
        max_customers,
        max_branches,
        max_staff_per_branch
      )
    `
    )
    .eq('business_id', businessId)
    .single();

  // No subscription or not active
  if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      remaining: 0,
      reason: 'No active subscription',
    };
  }

  // Get current usage
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('customer_count, branch_count, staff_count')
    .eq('business_id', businessId)
    .single();

  const planData = Array.isArray(subscription.plans)
    ? subscription.plans[0]
    : subscription.plans;
  const plan = planData
    ? {
        max_customers: ('max_customers' in planData
          ? planData.max_customers
          : null) as number | null,
        max_branches: ('max_branches' in planData
          ? planData.max_branches
          : null) as number | null,
        max_staff_per_branch: ('max_staff_per_branch' in planData
          ? planData.max_staff_per_branch
          : null) as number | null,
      }
    : {
        max_customers: null,
        max_branches: null,
        max_staff_per_branch: null,
      };

  // Determine limit and current based on type
  let current: number;
  let limit: number | null;

  switch (limitType) {
    case 'customers':
      current = usage?.customer_count || 0;
      limit = plan?.max_customers || null;
      break;
    case 'branches':
      current = usage?.branch_count || 0;
      limit = plan?.max_branches || null;
      break;
    case 'staff':
      current = usage?.staff_count || 0;
      // Staff limit is per branch * number of branches
      limit =
        plan?.max_staff_per_branch && plan?.max_branches
          ? plan.max_staff_per_branch * plan.max_branches
          : null;
      break;
    default:
      return {
        allowed: false,
        current: 0,
        limit: 0,
        remaining: 0,
        reason: 'Invalid limit type',
      };
  }

  // If limit is null, it's unlimited
  if (limit === null) {
    return {
      allowed: true,
      current,
      limit: null,
      remaining: null,
    };
  }

  const remaining = limit - current;
  const allowed = current < limit;

  return {
    allowed,
    current,
    limit,
    remaining: Math.max(0, remaining),
    reason: allowed
      ? undefined
      : `${limitType} limit reached (${current}/${limit})`,
  };
}

/**
 * Check if business has active subscription
 */
export async function checkSubscriptionAccess(
  businessId: string
): Promise<{ hasAccess: boolean; status: string }> {
  const supabase = getServiceClient();

  // Get subscription status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('business_id', businessId)
    .single();

  const status = subscription?.status || 'preview';
  const hasAccess = ['active', 'trialing'].includes(status);

  return { hasAccess, status };
}

/**
 * Increment usage count when adding resources
 * Call this AFTER successfully adding a customer/branch/staff
 */
export async function incrementUsage(
  businessId: string,
  type: LimitType
): Promise<void> {
  const supabase = getServiceClient();

  const column =
    type === 'customers'
      ? 'customer_count'
      : type === 'branches'
      ? 'branch_count'
      : 'staff_count';

  await supabase.rpc('increment_usage', {
    p_business_id: businessId,
    p_column: column,
  });
}

/**
 * Decrement usage count when removing resources
 * Call this AFTER successfully removing a customer/branch/staff
 */
export async function decrementUsage(
  businessId: string,
  type: LimitType
): Promise<void> {
  const supabase = getServiceClient();

  const column =
    type === 'customers'
      ? 'customer_count'
      : type === 'branches'
      ? 'branch_count'
      : 'staff_count';

  await supabase.rpc('decrement_usage', {
    p_business_id: businessId,
    p_column: column,
  });
}

// ============================================
// HELPER: Require Active Subscription
// ============================================

/**
 * Middleware helper to require active subscription
 * Use in API routes before performing actions
 */
export async function requireActiveSubscription(
  businessId: string
): Promise<void> {
  const { hasAccess, status } = await checkSubscriptionAccess(businessId);

  if (!hasAccess) {
    const error = new Error(
      status === 'preview'
        ? 'Subscription required. Please subscribe to perform this action.'
        : status === 'past_due'
        ? 'Payment past due. Please update your payment method.'
        : status === 'expired'
        ? 'Subscription expired. Please renew to continue.'
        : 'Subscription inactive.'
    );
    (error as Error & { code: string }).code = 'SUBSCRIPTION_REQUIRED';
    throw error;
  }
}

/**
 * Middleware helper to require feature access
 */
export async function requireFeature(
  businessId: string,
  feature: FeatureName
): Promise<void> {
  const result = await checkFeatureAccess(businessId, feature);

  if (!result.allowed) {
    const error = new Error(result.reason || 'Feature not available');
    (error as Error & { code: string }).code = 'FEATURE_NOT_AVAILABLE';
    throw error;
  }
}

/**
 * Middleware helper to require limit not exceeded
 */
export async function requireWithinLimit(
  businessId: string,
  limitType: LimitType
): Promise<void> {
  const result = await checkLimitAccess(businessId, limitType);

  if (!result.allowed) {
    const error = new Error(result.reason || 'Limit exceeded');
    (error as Error & { code: string }).code = 'LIMIT_EXCEEDED';
    throw error;
  }
}

/**
 * Middleware helper to require module access (loyalty, booking, pos)
 */
export async function requireModule(
  businessId: string,
  module: ModuleName
): Promise<void> {
  const result = await checkModuleAccess(businessId, module);

  if (!result.allowed) {
    const error = new Error(result.reason || 'Module not available');
    (error as Error & { code: string }).code = 'MODULE_NOT_AVAILABLE';
    throw error;
  }
}
