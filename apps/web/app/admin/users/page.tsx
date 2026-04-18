import { requireAdmin } from '@/lib/server-auth';
import { AdminLayout } from '@/components/admin/admin-layout';
import { AdminUsersClient } from '@/components/admin/admin-users-client';

export default async function AdminUsersPage() {
  const { email } = await requireAdmin();
  return (
    <AdminLayout adminEmail={email}>
      <AdminUsersClient />
    </AdminLayout>
  );
}
