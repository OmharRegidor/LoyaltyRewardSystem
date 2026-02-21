// apps/web/app/join/[code]/page.tsx

import { getBusinessByJoinCode } from '@/lib/services/public-business.service';
import { createServiceClient } from '@/lib/supabase-server';
import { JoinPageClient } from './join-page-client';
import { JoinNotFound } from './join-not-found';
import { JoinAlreadyMember } from './join-already-member';

interface JoinPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ email?: string }>;
}

export default async function JoinPage({ params, searchParams }: JoinPageProps) {
  const { code } = await params;
  const { email } = await searchParams;

  const business = await getBusinessByJoinCode(code);

  if (!business) {
    return <JoinNotFound />;
  }

  // If email is provided (staff invite link), check if already a member
  if (email) {
    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .eq('created_by_business_id', business.id)
      .maybeSingle();

    if (existing) {
      return <JoinAlreadyMember businessName={business.name} />;
    }
  }

  return (
    <JoinPageClient
      joinCode={code}
      businessName={business.name}
      businessLogo={business.logo_url}
      pointsPerPurchase={business.points_per_purchase}
      pesosPerPoint={business.pesos_per_point}
      prefillEmail={email || ''}
    />
  );
}
