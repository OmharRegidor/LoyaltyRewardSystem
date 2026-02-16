// apps/web/app/admin/layout.tsx

import ServerRestricted from '@/components/auth/ServerRestricted';
import AccessDenied from '@/components/auth/AccessDenied';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServerRestricted allowedRoles={['admin']} fallback={<AccessDenied />}>
      {children}
    </ServerRestricted>
  );
}
