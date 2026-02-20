// apps/web/app/business/[slug]/card/page.tsx

import { notFound } from 'next/navigation';
import { getBusinessBySlug } from '@/lib/services/public-business.service';
import { verifyCardToken } from '@/lib/qr-code';
import { createServiceClient } from '@/lib/supabase-server';
import { CardPageClient } from './card-page-client';

// ============================================
// TYPES
// ============================================

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

// ============================================
// HELPERS
// ============================================

async function getCustomerByCardToken(token: string) {
  const payload = verifyCardToken(token);
  if (!payload) return null;

  const supabase = createServiceClient();
  const { data: customer } = await supabase
    .from('customers')
    .select('id, full_name, phone, qr_code_url, tier, total_points, card_token')
    .eq('id', payload.customerId)
    .single();

  if (!customer || customer.card_token !== token) return null;

  return {
    customerName: customer.full_name || 'Valued Customer',
    phone: customer.phone || '',
    qrCodeUrl: customer.qr_code_url || '',
    tier: customer.tier || 'bronze',
    totalPoints: customer.total_points || 0,
  };
}

async function getBusinessJoinCode(businessId: string): Promise<string | null> {
  const supabase = createServiceClient();
  // join_code column added via migration, not yet in generated types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('businesses')
    .select('join_code')
    .eq('id', businessId)
    .single();

  return data?.join_code || null;
}

// ============================================
// PAGE COMPONENT
// ============================================

export default async function CardSignupPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const joinCode = await getBusinessJoinCode(business.id);

  // If token is present, verify and fetch customer data for auto-open modal
  const cardData = token ? await getCustomerByCardToken(token) : null;

  return (
    <CardPageClient
      slug={slug}
      businessName={business.name}
      business={{
        points_per_purchase: business.points_per_purchase,
        pesos_per_point: business.pesos_per_point,
      }}
      joinCode={joinCode}
      initialCardData={cardData}
    />
  );
}

// ============================================
// METADATA
// ============================================

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    return {
      title: 'Business Not Found | NoxaLoyalty',
    };
  }

  return {
    title: `Get Your Loyalty Card | ${business.name}`,
    description: `Join ${business.name}'s loyalty rewards program. Sign up and start earning points on every purchase.`,
  };
}
