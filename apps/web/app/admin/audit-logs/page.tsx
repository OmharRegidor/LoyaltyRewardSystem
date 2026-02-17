import { requireAdmin } from '@/lib/server-auth';
import { AdminLayout } from '@/components/admin/admin-layout';
import { AuditLogsClient } from '@/components/admin/audit-logs-client';

export default async function AdminAuditLogsPage() {
  const { email } = await requireAdmin();

  return (
    <AdminLayout adminEmail={email}>
      <AuditLogsClient />
    </AdminLayout>
  );
}
