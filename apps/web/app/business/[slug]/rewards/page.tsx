// apps/web/app/business/[slug]/rewards/page.tsx

import { notFound } from 'next/navigation';
import {
  getBusinessBySlug,
  getPublicRewards,
} from '@/lib/services/public-business.service';
import { RewardsPageClient } from './components/rewards-page-client';

interface RewardsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RewardsPage({ params }: RewardsPageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const rewards = await getPublicRewards(business.id);

  return <RewardsPageClient business={business} rewards={rewards} />;
}
