import { requireAdmin } from '@/lib/server-auth';
import { AdminLayout } from '@/components/admin/admin-layout';
import { UpgradeManagementClient } from '@/components/admin/upgrade-management-client';

export default async function AdminUpgradesPage() {
  const { email } = await requireAdmin();

  return (
    <AdminLayout adminEmail={email}>
      <UpgradeManagementClient />
    </AdminLayout>
  );
}
