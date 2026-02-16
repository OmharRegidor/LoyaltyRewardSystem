// apps/web/lib/server-auth.ts
// Server-only auth utilities (uses cookies, redirect from Next.js)

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from './supabase-server';
import { type AppRole, hasRole, getRoleHomePath } from './rbac';

export interface AuthUser {
  id: string;
  email: string;
  role: AppRole;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role_id, roles(name)')
    .eq('id', user.id)
    .single();

  const role =
    (profile?.roles as unknown as { name: AppRole } | null)?.name ?? 'customer';

  return {
    id: user.id,
    email: user.email ?? '',
    role,
  };
}

export async function getCurrentUserRole(): Promise<AppRole | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireRole(...allowedRoles: AppRole[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!hasRole(user.role, allowedRoles)) {
    redirect(getRoleHomePath(user.role));
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  return requireRole('admin');
}

/**
 * API route helper: returns AuthUser or null.
 * Use in route handlers where redirect() is not appropriate.
 */
export async function getApiUser(): Promise<AuthUser | null> {
  return getCurrentUser();
}
