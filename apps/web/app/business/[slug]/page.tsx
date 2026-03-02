// apps/web/app/business/[slug]/page.tsx

import { notFound } from 'next/navigation';
import { getBusinessBySlug } from '@/lib/services/public-business.service';
import { BusinessPageClient } from './components/business-page-client';

// Force dynamic rendering to always fetch fresh data from database
export const dynamic = 'force-dynamic';

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  return (
    <BusinessPageClient
      business={business}
      slug={slug}
    />
  );
}
