// apps/web/app/business/[slug]/my-bookings/page.tsx

import { notFound } from 'next/navigation';
import { getBusinessBySlug } from '@/lib/services/public-business.service';
import { checkModuleAccess } from '@/lib/feature-gate';
import { MyBookingsClient } from './my-bookings-client';

interface MyBookingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function MyBookingsPage({ params }: MyBookingsPageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const { allowed: hasBooking } = await checkModuleAccess(business.id, 'booking');
  if (!hasBooking) {
    notFound();
  }

  return <MyBookingsClient business={business} />;
}
