import { requireAdmin } from '@/lib/server-auth';
import { AdminLayout } from '@/components/admin/admin-layout';
import { BusinessCustomersClient } from '@/components/admin/business-customers-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBusinessCustomersPage({ params }: PageProps) {
  const { email } = await requireAdmin();
  const { id } = await params;
  return (
    <AdminLayout adminEmail={email}>
      <BusinessCustomersClient businessId={id} />
    </AdminLayout>
  );
}
