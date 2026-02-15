// apps/web/app/admin/businesses/[id]/page.tsx

import { requireAdmin } from '@/lib/admin';
import { AdminLayout } from '@/components/admin/admin-layout';
import { BusinessDetailClient } from '@/components/admin/business-detail-client';

interface BusinessDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBusinessDetailPage({
  params,
}: BusinessDetailPageProps) {
  const { email } = await requireAdmin();
  const { id } = await params;

  return (
    <AdminLayout adminEmail={email}>
      <BusinessDetailClient businessId={id} />
    </AdminLayout>
  );
}
