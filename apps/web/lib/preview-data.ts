// apps/web/lib/preview-data.ts

/**
 * Preview Mode Fake Data
 *
 * This file contains fake/demo data shown to business owners
 * who haven't subscribed yet. This allows them to explore
 * the dashboard without real data.
 */

// ============================================
// TYPES
// ============================================

export interface PreviewCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  totalPoints: number;
  lifetimePoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lastVisit: string;
  createdAt: string;
}

export interface PreviewTransaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'earn' | 'redeem';
  points: number;
  description: string;
  staffName: string;
  createdAt: string;
}

export interface PreviewReward {
  id: string;
  name: string;
  pointsCost: number;
  description: string;
  redemptions: number;
  isActive: boolean;
}

export interface PreviewAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  totalRedemptions: number;
  revenue: number;
  averageOrderValue: number;
  repeatPurchaseRate: number;
  customerLifetimeValue: number;
}

// ============================================
// FAKE CUSTOMERS
// ============================================

export const PREVIEW_CUSTOMERS: PreviewCustomer[] = [
  {
    id: 'preview-1',
    fullName: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '+63 917 123 4567',
    totalPoints: 2450,
    lifetimePoints: 5200,
    tier: 'gold',
    lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'preview-2',
    fullName: 'Juan Dela Cruz',
    email: 'juan.delacruz@email.com',
    phone: '+63 918 234 5678',
    totalPoints: 1850,
    lifetimePoints: 3600,
    tier: 'silver',
    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'preview-3',
    fullName: 'Ana Reyes',
    email: 'ana.reyes@email.com',
    phone: '+63 919 345 6789',
    totalPoints: 4200,
    lifetimePoints: 8500,
    tier: 'platinum',
    lastVisit: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'preview-4',
    fullName: 'Pedro Garcia',
    email: 'pedro.garcia@email.com',
    phone: '+63 920 456 7890',
    totalPoints: 650,
    lifetimePoints: 1200,
    tier: 'bronze',
    lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'preview-5',
    fullName: 'Sofia Martinez',
    email: 'sofia.martinez@email.com',
    phone: '+63 921 567 8901',
    totalPoints: 1200,
    lifetimePoints: 2400,
    tier: 'silver',
    lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// FAKE TRANSACTIONS
// ============================================

export const PREVIEW_TRANSACTIONS: PreviewTransaction[] = [
  {
    id: 'txn-1',
    customerId: 'preview-3',
    customerName: 'Ana Reyes',
    type: 'earn',
    points: 150,
    description: 'Purchase - ₱1,500',
    staffName: 'Staff Demo',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'txn-2',
    customerId: 'preview-1',
    customerName: 'Maria Santos',
    type: 'redeem',
    points: -500,
    description: 'Redeemed: Free Coffee',
    staffName: 'Staff Demo',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'txn-3',
    customerId: 'preview-2',
    customerName: 'Juan Dela Cruz',
    type: 'earn',
    points: 200,
    description: 'Purchase - ₱2,000',
    staffName: 'Staff Demo',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'txn-4',
    customerId: 'preview-5',
    customerName: 'Sofia Martinez',
    type: 'earn',
    points: 100,
    description: 'Purchase - ₱1,000',
    staffName: 'Staff Demo',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'txn-5',
    customerId: 'preview-4',
    customerName: 'Pedro Garcia',
    type: 'earn',
    points: 75,
    description: 'Purchase - ₱750',
    staffName: 'Staff Demo',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// FAKE REWARDS
// ============================================

export const PREVIEW_REWARDS: PreviewReward[] = [
  {
    id: 'reward-1',
    name: 'Free Coffee',
    pointsCost: 500,
    description: 'Any regular-sized coffee drink',
    redemptions: 234,
    isActive: true,
  },
  {
    id: 'reward-2',
    name: '20% Discount',
    pointsCost: 1000,
    description: '20% off your next purchase',
    redemptions: 189,
    isActive: true,
  },
  {
    id: 'reward-3',
    name: 'Free Pastry',
    pointsCost: 300,
    description: 'Any pastry from our selection',
    redemptions: 156,
    isActive: true,
  },
  {
    id: 'reward-4',
    name: 'Double Points Day',
    pointsCost: 200,
    description: 'Earn 2x points on your next visit',
    redemptions: 142,
    isActive: true,
  },
  {
    id: 'reward-5',
    name: 'Free Lunch Set',
    pointsCost: 2500,
    description: 'Complete lunch set meal',
    redemptions: 98,
    isActive: true,
  },
];

// ============================================
// FAKE ANALYTICS
// ============================================

export const PREVIEW_ANALYTICS: PreviewAnalytics = {
  totalCustomers: 1247,
  activeCustomers: 892,
  totalPointsIssued: 125000,
  totalPointsRedeemed: 48000,
  totalRedemptions: 819,
  revenue: 429000,
  averageOrderValue: 1245,
  repeatPurchaseRate: 68,
  customerLifetimeValue: 5890,
};

// ============================================
// CHART DATA
// ============================================

export const PREVIEW_MONTHLY_DATA = [
  { month: 'Jan', revenue: 45000, points: 12000 },
  { month: 'Feb', revenue: 52000, points: 14500 },
  { month: 'Mar', revenue: 48000, points: 13000 },
  { month: 'Apr', revenue: 61000, points: 16200 },
  { month: 'May', revenue: 55000, points: 15100 },
  { month: 'Jun', revenue: 68000, points: 18500 },
];

export const PREVIEW_CUSTOMER_SEGMENTS = [
  { name: 'High Value', value: 35, color: '#6366f1' },
  { name: 'Regular', value: 45, color: '#06b6d4' },
  { name: 'At Risk', value: 15, color: '#f59e0b' },
  { name: 'Inactive', value: 5, color: '#ef4444' },
];

export const PREVIEW_RETENTION_DATA = [
  { week: 'Week 1', retention: 92 },
  { week: 'Week 2', retention: 88 },
  { week: 'Week 3', retention: 85 },
  { week: 'Week 4', retention: 87 },
  { week: 'Week 5', retention: 89 },
  { week: 'Week 6', retention: 91 },
  { week: 'Week 7', retention: 93 },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get preview data based on subscription status
 */
export function getPreviewDataForFeature<T>(
  hasAccess: boolean,
  realData: T | null,
  previewData: T
): T {
  if (hasAccess && realData !== null) {
    return realData;
  }
  return previewData;
}

/**
 * Check if current data is preview/demo data
 */
export function isPreviewData(id: string): boolean {
  return (
    id.startsWith('preview-') ||
    id.startsWith('txn-') ||
    id.startsWith('reward-')
  );
}
