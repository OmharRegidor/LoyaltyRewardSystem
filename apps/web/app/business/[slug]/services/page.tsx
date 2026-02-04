// apps/web/app/business/[slug]/services/page.tsx

import { notFound } from 'next/navigation';
import {
  getBusinessBySlug,
  getPublicServices,
} from '@/lib/services/public-business.service';
import { ServicesPageClient } from './components/services-page-client';

interface ServicesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const services = await getPublicServices(business.id);

  return <ServicesPageClient business={business} services={services} />;
}
