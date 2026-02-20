// apps/web/app/join/[code]/page.tsx

import { notFound } from 'next/navigation';
import { getBusinessByJoinCode } from '@/lib/services/public-business.service';
import { JoinPageClient } from './join-page-client';

interface JoinPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ email?: string }>;
}

export default async function JoinPage({ params, searchParams }: JoinPageProps) {
  const { code } = await params;
  const { email } = await searchParams;

  const business = await getBusinessByJoinCode(code);

  if (!business) {
    notFound();
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
