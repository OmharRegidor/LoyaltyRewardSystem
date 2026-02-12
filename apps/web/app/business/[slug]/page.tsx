// apps/web/app/business/[slug]/page.tsx

import { notFound } from 'next/navigation';
import {
  getBusinessBySlug,
  getPublicAvailability,
  getPublicServices,
  getPublicAddons,
} from '@/lib/services/public-business.service';
import { checkModuleAccess } from '@/lib/feature-gate';
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

  const { allowed: hasBooking } = await checkModuleAccess(business.id, 'booking');

  const [availability, services, addons] = await Promise.all([
    getPublicAvailability(business.id),
    hasBooking ? getPublicServices(business.id) : Promise.resolve([]),
    hasBooking ? getPublicAddons(business.id) : Promise.resolve([]),
  ]);

  return (
    <BusinessPageClient
      business={business}
      availability={availability}
      services={services}
      addons={addons}
      slug={slug}
      hasBooking={hasBooking}
    />
  );
}
