// apps/web/lib/plan-features.ts

// ============================================
// TYPES
// ============================================

export type PlanName = 'free' | 'enterprise';

export type FeatureName =
  | 'loyalty'
  | 'customers'
  | 'rewards'
  | 'staff'
  | 'branches'
  | 'analytics'
  | 'booking'
  | 'pos';

export type PlanFeatures = Record<FeatureName, boolean>;

// ============================================
// PLAN FEATURES CONFIGURATION
// ============================================

export const PLAN_FEATURES: Record<PlanName, PlanFeatures> = {
  free: {
    loyalty: true,
    customers: true,
    rewards: true,
    staff: true,
    branches: true,
    analytics: true,
    booking: false,
    pos: false,
  },
  enterprise: {
    loyalty: true,
    customers: true,
    rewards: true,
    staff: true,
    branches: true,
    analytics: true,
    booking: true,
    pos: true,
  },
};

// ============================================
// FEATURE DISPLAY NAMES (for UI)
// ============================================

interface FeatureDisplayInfo {
  name: string;
  description: string;
}

export const FEATURE_DISPLAY_NAMES: Record<FeatureName, FeatureDisplayInfo> = {
  loyalty: {
    name: 'Loyalty & Rewards',
    description: 'Points, rewards, and customer tiers',
  },
  customers: {
    name: 'Customer Management',
    description: 'Track and manage your customers',
  },
  rewards: {
    name: 'Rewards Catalog',
    description: 'Create and manage reward offerings',
  },
  staff: {
    name: 'Staff Management',
    description: 'Add and manage staff accounts',
  },
  branches: {
    name: 'Branch Management',
    description: 'Multi-location support',
  },
  analytics: {
    name: 'Analytics Dashboard',
    description: 'Insights and reporting',
  },
  booking: {
    name: 'Booking System',
    description: 'Appointment scheduling and management',
  },
  pos: {
    name: 'POS System',
    description: 'Point of sale integration',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a plan has access to a specific feature
 */
export function hasFeatureAccess(planName: PlanName, feature: FeatureName): boolean {
  return PLAN_FEATURES[planName][feature];
}

/**
 * Get list of features that are locked (not available) for a plan
 */
export function getLockedFeatures(planName: PlanName): FeatureName[] {
  const features = PLAN_FEATURES[planName];
  return (Object.keys(features) as FeatureName[]).filter(
    (feature) => !features[feature]
  );
}

/**
 * Get list of features that are available for a plan
 */
export function getAvailableFeatures(planName: PlanName): FeatureName[] {
  const features = PLAN_FEATURES[planName];
  return (Object.keys(features) as FeatureName[]).filter(
    (feature) => features[feature]
  );
}
