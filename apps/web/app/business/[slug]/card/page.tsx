// apps/web/app/business/[slug]/card/page.tsx

import { notFound } from 'next/navigation';
import { getBusinessBySlug } from '@/lib/services/public-business.service';
import { createServiceClient } from '@/lib/supabase-server';
import { CardPageClient } from './card-page-client';

// ============================================
// TYPES
// ============================================

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

// ============================================
// HELPERS
// ============================================

async function getBusinessJoinCode(businessId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('businesses')
    .select('join_code')
    .eq('id', businessId)
    .single();

  return data?.join_code || null;
}

// ============================================
// PAGE COMPONENT
// ============================================

export default async function CardSignupPage({ params }: PageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const joinCode = await getBusinessJoinCode(business.id);

  return (
    <CardPageClient
      slug={slug}
      businessName={business.name}
      business={{
        points_per_purchase: business.points_per_purchase,
        pesos_per_point: business.pesos_per_point,
      }}
      joinCode={joinCode}
      initialCardData={null}
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
