// apps/web/lib/billing-copy.ts

/**
 * All user-facing copy for the billing system
 * Centralized for easy updates and localization
 */

// ============================================
// SUBSCRIPTION STATUS MESSAGES
// ============================================

export const SUBSCRIPTION_STATUS_COPY = {
  preview: {
    title: 'Preview Mode',
    description:
      "You're exploring NoxaLoyalty with sample data. Subscribe to unlock all features and start building your loyalty program.",
    cta: 'View Plans',
  },
  trialing: {
    title: 'Trial Active',
    description:
      'Your free trial is active. Enjoy full access to all features.',
    cta: 'View Plans',
  },
  active: {
    title: 'Active Subscription',
    description:
      'Your subscription is active. Thank you for being a NoxaLoyalty customer!',
    cta: 'Manage Billing',
  },
  past_due: {
    title: 'Payment Issue',
    description:
      "We couldn't process your last payment. Please update your payment method to continue using NoxaLoyalty.",
    cta: 'Update Payment',
  },
  canceled: {
    title: 'Subscription Ending',
    description:
      "Your subscription will end at the end of the current billing period. You'll retain access until then.",
    cta: 'Resume Subscription',
  },
  expired: {
    title: 'Subscription Expired',
    description:
      'Your subscription has ended. Subscribe again to regain access to all features.',
    cta: 'Resubscribe',
  },
  free_forever: {
    title: 'Partner Access',
    description:
      'You have unlimited access to NoxaLoyalty as a valued partner.',
    cta: null,
  },
} as const;

// ============================================
// UPGRADE PROMPTS
// ============================================

export const UPGRADE_PROMPTS = {
  generic: {
    title: 'Upgrade to Unlock',
    description:
      'This feature is available on paid plans. Upgrade to access all features and grow your business.',
    cta: 'View Plans',
  },

  // Feature-specific prompts
  advanced_analytics: {
    title: 'Unlock Advanced Analytics',
    description:
      'Get deeper insights into your customer behavior, revenue trends, and loyalty program performance with our Enterprise plan.',
    cta: 'Upgrade to Enterprise',
  },
  api_access: {
    title: 'API Access Available',
    description:
      'Integrate NoxaLoyalty with your existing systems using our powerful API. Available on the Enterprise plan.',
    cta: 'Upgrade to Enterprise',
  },
  custom_branding: {
    title: 'Customize Your Brand',
    description:
      'Remove NoxaLoyalty branding and customize the look and feel to match your business. Available on Enterprise.',
    cta: 'Upgrade to Enterprise',
  },
  webhook_notifications: {
    title: 'Real-time Webhooks',
    description:
      'Get instant notifications when customers earn or redeem points. Perfect for integrations.',
    cta: 'Upgrade to Enterprise',
  },

  // Limit-specific prompts
  customers_limit: {
    title: 'Customer Limit Reached',
    description:
      "You've reached the maximum number of customers on your current plan. Upgrade to add more customers to your loyalty program.",
    cta: 'Upgrade for More Customers',
  },
  branches_limit: {
    title: 'Branch Limit Reached',
    description:
      "You've reached the maximum number of branch locations. Upgrade to Enterprise for unlimited branches.",
    cta: 'Upgrade for More Branches',
  },
  staff_limit: {
    title: 'Staff Limit Reached',
    description:
      "You've reached the maximum number of staff accounts. Upgrade to add more team members.",
    cta: 'Upgrade for More Staff',
  },
} as const;

// ============================================
// PAYMENT MESSAGES
// ============================================

export const PAYMENT_MESSAGES = {
  checkout_success: {
    title: 'Welcome to NoxaLoyalty! 🎉',
    description:
      "Your subscription is now active. You have full access to all features. Let's start building your loyalty program!",
  },
  checkout_canceled: {
    title: 'Checkout Canceled',
    description:
      "No worries! Your checkout was canceled and you haven't been charged. Feel free to try again when you're ready.",
  },
  payment_failed: {
    title: 'Payment Failed',
    description:
      "We couldn't process your payment. Please check your card details and try again, or use a different payment method.",
  },
  payment_succeeded: {
    title: 'Payment Successful',
    description: 'Your payment has been processed successfully. Thank you!',
  },
  card_updated: {
    title: 'Payment Method Updated',
    description: 'Your payment method has been updated successfully.',
  },
} as const;

// ============================================
// CANCELLATION MESSAGES
// ============================================

export const CANCELLATION_MESSAGES = {
  confirm_cancel: {
    title: 'Cancel Subscription?',
    description:
      "You'll lose access to premium features at the end of your current billing period. Your data will be preserved, and you can resubscribe anytime.",
    confirm_button: 'Yes, Cancel Subscription',
    cancel_button: 'Keep My Subscription',
  },
  canceled: {
    title: 'Subscription Canceled',
    description:
      "Your subscription has been canceled. You'll have access until {endDate}. We're sorry to see you go!",
  },
  reactivate: {
    title: 'Subscription Reactivated',
    description:
      "Great to have you back! Your subscription has been reactivated and you'll continue to be billed as normal.",
  },
  win_back: {
    title: 'We Miss You!',
    description:
      'Your loyalty program is waiting. Reactivate your subscription and pick up right where you left off.',
    cta: 'Reactivate Subscription',
  },
} as const;

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  generic:
    'Something went wrong. Please try again or contact support if the problem persists.',
  network:
    'Unable to connect. Please check your internet connection and try again.',
  unauthorized: 'Please sign in to continue.',
  subscription_required:
    'A subscription is required to perform this action. Please subscribe to continue.',
  feature_not_available:
    'This feature is not available on your current plan. Please upgrade to access it.',
  limit_exceeded:
    "You've reached the limit for your current plan. Please upgrade to continue.",
  payment_required:
    'Please update your payment method to continue using NoxaLoyalty.',
  invalid_plan:
    'The selected plan is not available. Please choose a different plan.',
  checkout_failed: 'Unable to start checkout. Please try again.',
  portal_failed: 'Unable to open billing portal. Please try again.',
} as const;

// ============================================
// PLAN COMPARISON
// ============================================

export const PLAN_COMPARISON = {
  core: {
    name: 'Core',
    tagline: 'Perfect for small to medium businesses',
    highlights: [
      'Up to 3,000 customers',
      '3 branch locations',
      '3 staff accounts',
      'QR-based loyalty system',
      'Basic analytics',
      'Email support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    tagline: 'For growing businesses with multiple locations',
    highlights: [
      'Unlimited customers',
      'Unlimited branches',
      'Unlimited staff',
      'Advanced analytics',
      'API access & webhooks',
      'Priority support',
      'Custom branding',
      'Dedicated account manager',
    ],
  },
} as const;

// ============================================
// TOOLTIPS
// ============================================

export const TOOLTIPS = {
  billing_interval: {
    monthly: 'Pay month-to-month with flexibility to cancel anytime.',
    annual: "Save 17% with annual billing. That's 2 months free!",
  },
  limits: {
    customers:
      'The maximum number of customers you can add to your loyalty program.',
    branches: 'The number of physical store locations you can manage.',
    staff: 'The number of staff accounts that can scan customer QR codes.',
  },
  features: {
    qr_loyalty: 'Customers earn and redeem points by scanning QR codes.',
    email_onboarding:
      'Add customers by email without requiring them to download an app.',
    basic_analytics:
      'View key metrics like total customers, points issued, and redemptions.',
    advanced_analytics:
      'Deep dive into customer segments, retention rates, and revenue impact.',
    api_access: 'Integrate NoxaLoyalty with your POS, CRM, or other systems.',
    custom_branding:
      'Remove NoxaLoyalty branding and use your own logo and colors.',
    webhook_notifications:
      'Get real-time notifications when loyalty events occur.',
    priority_support:
      'Get faster response times and dedicated support channels.',
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format price in PHP
 */
export function formatPrice(centavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(centavos / 100);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get plan limit text
 */
export function getLimitText(limit: number | null): string {
  return limit === null ? 'Unlimited' : limit.toLocaleString();
}

/**
 * Get usage status text
 */
export function getUsageStatusText(
  current: number,
  limit: number | null,
): string {
  if (limit === null) return 'Unlimited';
  const percentage = Math.round((current / limit) * 100);
  return `${current.toLocaleString()} / ${limit.toLocaleString()} (${percentage}%)`;
}
