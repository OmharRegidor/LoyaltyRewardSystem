// src/lib/constants.ts

// ============================================
// COLORS
// ============================================

export const COLORS = {
  // Primary gradient (purple to blue)
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  secondary: '#06b6d4',

  // Gradient colors for header
  gradient: {
    start: '#8B5CF6',
    middle: '#6366F1',
    end: '#3B82F6',
  },

  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',

  // Accent
  gold: '#F59E0B',

  // Neutrals
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Dark mode
  dark: {
    background: '#0a0a0a',
    card: '#1a1a1a',
    border: '#262626',
  },
} as const;

// ============================================
// SPACING
// ============================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

// ============================================
// TYPOGRAPHY
// ============================================

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// ============================================
// BORDER RADIUS
// ============================================

export const BORDER_RADIUS = {
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// ============================================
// SHADOWS
// ============================================

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  colored: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  }),
} as const;

// ============================================
// TIER SYSTEM
// ============================================

export const TIERS = {
  bronze: { name: 'Bronze', minPoints: 0, multiplier: 1.0, color: '#CD7F32' },
  silver: {
    name: 'Silver',
    minPoints: 500,
    multiplier: 1.25,
    color: '#C0C0C0',
  },
  gold: { name: 'Gold', minPoints: 2000, multiplier: 1.5, color: '#FFD700' },
  platinum: {
    name: 'Platinum',
    minPoints: 5000,
    multiplier: 2.0,
    color: '#E5E4E2',
  },
} as const;

export type TierKey = keyof typeof TIERS;
export type Tier = (typeof TIERS)[TierKey];

export const getTier = (lifetimePoints: number): Tier => {
  if (lifetimePoints >= TIERS.platinum.minPoints) return TIERS.platinum;
  if (lifetimePoints >= TIERS.gold.minPoints) return TIERS.gold;
  if (lifetimePoints >= TIERS.silver.minPoints) return TIERS.silver;
  return TIERS.bronze;
};

export const getNextTier = (lifetimePoints: number): Tier | null => {
  if (lifetimePoints >= TIERS.platinum.minPoints) return null;
  if (lifetimePoints >= TIERS.gold.minPoints) return TIERS.platinum;
  if (lifetimePoints >= TIERS.silver.minPoints) return TIERS.gold;
  return TIERS.silver;
};

export const getProgressToNextTier = (lifetimePoints: number) => {
  const currentTier = getTier(lifetimePoints);
  const nextTier = getNextTier(lifetimePoints);

  if (!nextTier) return { progress: 1, remaining: 0 };

  const range = nextTier.minPoints - currentTier.minPoints;
  const progress = (lifetimePoints - currentTier.minPoints) / range;
  const remaining = nextTier.minPoints - lifetimePoints;

  return { progress: Math.min(progress, 1), remaining };
};
