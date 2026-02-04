// apps/web/app/card/[token]/page.tsx

import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase-server';
import { verifyCardToken } from '@/lib/qr-code';
import {
  getPublicRewards,
  getCustomerTransactions,
  type PublicReward,
  type PublicTransaction,
} from '@/lib/services/public-business.service';
import { CardView } from './card-view';

// ============================================
// TYPES
// ============================================

interface PageProps {
  params: Promise<{ token: string }>;
}

interface CustomerData {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  qrCodeUrl: string;
  tier: string;
  totalPoints: number;
  business: {
    id: string;
    name: string;
    logoUrl: string | null;
    address: string | null;
    city: string | null;
  } | null;
}

interface CardPageData {
  customer: CustomerData;
  rewards: PublicReward[];
  transactions: PublicTransaction[];
}

// ============================================
// DATA FETCHING
// ============================================

async function getCustomerByToken(token: string): Promise<CustomerData | null> {
  // 1. Verify token signature
  const payload = verifyCardToken(token);
  if (!payload) {
    return null;
  }

  // 2. Fetch customer from database
  const supabase = createServiceClient();

  const { data: customer, error } = await supabase
    .from('customers')
    .select(
      `
      id,
      full_name,
      email,
      phone,
      qr_code_url,
      tier,
      total_points,
      card_token,
      created_by_business_id,
      businesses:created_by_business_id (
        id,
        name,
        logo_url,
        address,
        city
      )
    `,
    )
    .eq('id', payload.customerId)
    .single();

  if (error || !customer) {
    return null;
  }

  // 3. Verify card token matches
  if (customer.card_token !== token) {
    return null;
  }

  // 4. Extract business info
  const business = Array.isArray(customer.businesses)
    ? customer.businesses[0]
    : customer.businesses;

  return {
    id: customer.id,
    fullName: customer.full_name || 'Valued Customer',
    email: customer.email || '',
    phone: customer.phone,
    qrCodeUrl: customer.qr_code_url || '',
    tier: customer.tier || 'bronze',
    totalPoints: customer.total_points || 0,
    business: business
      ? {
          id: business.id,
          name: business.name,
          logoUrl: business.logo_url,
          address: business.address,
          city: business.city,
        }
      : null,
  };
}

async function getCardPageData(token: string): Promise<CardPageData | null> {
  const customer = await getCustomerByToken(token);
  if (!customer) {
    return null;
  }

  // Fetch rewards and transactions in parallel if business exists
  let rewards: PublicReward[] = [];
  let transactions: PublicTransaction[] = [];

  if (customer.business) {
    const [rewardsResult, transactionsResult] = await Promise.all([
      getPublicRewards(customer.business.id),
      getCustomerTransactions(customer.id, customer.business.id),
    ]);
    rewards = rewardsResult;
    transactions = transactionsResult;
  }

  return { customer, rewards, transactions };
}

// ============================================
// PAGE COMPONENT
// ============================================

export default async function CardPage({ params }: PageProps) {
  const { token } = await params;

  // Validate token format
  if (!token || token.length < 10) {
    notFound();
  }

  const data = await getCardPageData(token);

  if (!data) {
    notFound();
  }

  return (
    <CardView
      customer={data.customer}
      token={token}
      rewards={data.rewards}
      transactions={data.transactions}
    />
  );
}

// ============================================
// METADATA
// ============================================

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  const data = await getCardPageData(token);

  if (!data) {
    return {
      title: 'Card Not Found | NoxaLoyalty',
    };
  }

  return {
    title: `${data.customer.fullName} - Loyalty Card | ${
      data.customer.business?.name || 'NoxaLoyalty'
    }`,
    description: `Digital loyalty card for ${data.customer.fullName}`,
    robots: 'noindex, nofollow', // Don't index card pages
  };
}
