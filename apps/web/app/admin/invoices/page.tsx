import { requireAdmin } from '@/lib/server-auth';
import { AdminLayout } from '@/components/admin/admin-layout';
import { InvoiceManagementClient } from '@/components/admin/invoice-management-client';

export default async function AdminInvoicesPage() {
  const { email } = await requireAdmin();

  return (
    <AdminLayout adminEmail={email}>
      <InvoiceManagementClient />
    </AdminLayout>
  );
}
