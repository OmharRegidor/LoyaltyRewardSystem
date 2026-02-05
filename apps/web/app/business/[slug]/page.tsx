// apps/web/app/business/[slug]/page.tsx

import { notFound } from 'next/navigation';
import {
  getBusinessBySlug,
  getPublicAvailability,
  getPublicServices,
  getPublicAddons,
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

  const [availability, services, addons] = await Promise.all([
    getPublicAvailability(business.id),
    getPublicServices(business.id),
    getPublicAddons(business.id),
  ]);

  return (
    <BusinessPageClient
      business={business}
      availability={availability}
      services={services}
      addons={addons}
      slug={slug}
    />
  );
}
