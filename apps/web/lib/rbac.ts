// apps/web/lib/rbac.ts
// Pure TypeScript RBAC utilities - safe for both client and server

export type AppRole = 'admin' | 'business_owner' | 'staff' | 'customer';

export function hasRole(
  userRole: AppRole | null | undefined,
  allowedRoles: AppRole[],
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export function assertRole(
  userRole: AppRole | null | undefined,
  allowedRoles: AppRole[],
): asserts userRole is AppRole {
  if (!hasRole(userRole, allowedRoles)) {
    throw new Error(
      `Access denied. Required role: ${allowedRoles.join(' or ')}`,
    );
  }
}

export function isAdmin(role: AppRole | null | undefined): boolean {
  return role === 'admin';
}

export function isBusinessOwner(role: AppRole | null | undefined): boolean {
  return role === 'business_owner';
}

export function isStaff(role: AppRole | null | undefined): boolean {
  return role === 'staff';
}

export function isCustomer(role: AppRole | null | undefined): boolean {
  return role === 'customer';
}

const ROUTE_ROLES: Record<string, AppRole[]> = {
  // All protected routes use layout-level ServerRestricted components
  // to show Access Denied inline instead of redirecting.
};

export function getAllowedRolesForPath(pathname: string): AppRole[] | null {
  for (const [prefix, roles] of Object.entries(ROUTE_ROLES)) {
    if (pathname.startsWith(prefix)) {
      return roles;
    }
  }
  return null;
}

export function getRoleHomePath(role: AppRole | null | undefined): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'business_owner':
      return '/dashboard';
    case 'staff':
      return '/staff';
    default:
      return '/';
  }
}
