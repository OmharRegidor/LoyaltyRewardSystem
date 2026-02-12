// apps/web/app/business/[slug]/my-bookings/page.tsx

import { notFound } from 'next/navigation';
import { getBusinessBySlug } from '@/lib/services/public-business.service';
import { MyBookingsClient } from './my-bookings-client';

interface MyBookingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function MyBookingsPage({ params }: MyBookingsPageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business || business.business_type === 'retail') {
    notFound();
  }

  return <MyBookingsClient business={business} />;
}
