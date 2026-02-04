// apps/web/app/business/[slug]/page.tsx

import { notFound } from 'next/navigation';
import {
  getBusinessBySlug,
  getPublicAvailability,
} from '@/lib/services/public-business.service';
import { BusinessPageClient } from './components/business-page-client';

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const availability = await getPublicAvailability(business.id);

  return (
    <BusinessPageClient
      business={business}
      availability={availability}
      slug={slug}
    />
  );
}
