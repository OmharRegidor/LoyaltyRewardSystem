// apps/web/app/dashboard/layout.tsx

import ServerRestricted from '@/components/auth/ServerRestricted';
import AccessDenied from '@/components/auth/AccessDenied';
import { SubscriptionProvider } from '@/hooks/useSubscription';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServerRestricted allowedRoles={['business_owner', 'admin']} fallback={<AccessDenied />}>
      <SubscriptionProvider>
        {children}
      </SubscriptionProvider>
    </ServerRestricted>
  );
}
