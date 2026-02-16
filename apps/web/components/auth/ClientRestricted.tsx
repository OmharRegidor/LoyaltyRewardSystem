'use client';

// apps/web/components/auth/ClientRestricted.tsx
// Client component for role-based conditional rendering (UX-only gating)

import { type ReactNode } from 'react';
import { type AppRole, hasRole } from '../../lib/rbac';

interface ClientRestrictedProps {
  currentRole: AppRole;
  allowedRoles: AppRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

export default function ClientRestricted({
  currentRole,
  allowedRoles,
  fallback = null,
  children,
}: ClientRestrictedProps) {
  if (!hasRole(currentRole, allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
