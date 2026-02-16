// apps/web/components/auth/ServerRestricted.tsx
// Async Server Component for role-based access control

import { type ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '../../lib/server-auth';
import { type AppRole, hasRole } from '../../lib/rbac';
import { redirect } from 'next/navigation';

interface ServerRestrictedProps {
  allowedRoles: AppRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

export default async function ServerRestricted({
  allowedRoles,
  fallback,
  children,
}: ServerRestrictedProps) {
  const user = await getCurrentUser();

  if (!user) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    redirect('/login');
  }

  if (!hasRole(user.role, allowedRoles)) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    notFound();
  }

  return <>{children}</>;
}
