// apps/web/app/card/[token]/page.tsx

import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase-server';
import { verifyCardToken } from '@/lib/qr-code';
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

// ============================================
// DATA FETCHING
// ============================================

async function getCustomerByToken(token: string): Promise<CustomerData | null> {
  // 1. Verify token signature
  const payload = verifyCardToken(token);
  if (!payload) {
    console.log('Invalid token signature');
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
    `
    )
    .eq('id', payload.customerId)
    .single();

  if (error || !customer) {
    console.log('Customer not found:', error);
    return null;
  }

  // 3. Verify card token matches
  if (customer.card_token !== token) {
    console.log('Token mismatch');
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

// ============================================
// PAGE COMPONENT
// ============================================

export default async function CardPage({ params }: PageProps) {
  const { token } = await params;

  // Validate token format
  if (!token || token.length < 10) {
    notFound();
  }

  const customer = await getCustomerByToken(token);

  if (!customer) {
    notFound();
  }

  return <CardView customer={customer} token={token} />;
}

// ============================================
// METADATA
// ============================================

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  const customer = await getCustomerByToken(token);

  if (!customer) {
    return {
      title: 'Card Not Found | LoyaltyHub',
    };
  }

  return {
    title: `${customer.fullName} - Loyalty Card | ${
      customer.business?.name || 'LoyaltyHub'
    }`,
    description: `Digital loyalty card for ${customer.fullName}`,
    robots: 'noindex, nofollow', // Don't index card pages
  };
}
