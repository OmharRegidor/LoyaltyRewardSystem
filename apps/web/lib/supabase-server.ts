// apps/web/lib/supabase-server.ts

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '../../../packages/shared/types/database';
import type { AdminDatabase } from './admin-database';

// ============================================
// SERVICE ROLE CLIENT (for server-side operations)
// ============================================

/**
 * Supabase Admin client with service role
 * USE ONLY in server-side code (API routes, server actions)
 * NEVER expose to client
 */
// Singleton service client to avoid creating new connections per request
let serviceClientInstance: ReturnType<typeof createClient<Database>> | null = null;

export function createServiceClient() {
  if (serviceClientInstance) return serviceClientInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  serviceClientInstance = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serviceClientInstance;
}

// ============================================
// ADMIN SERVICE CLIENT (typed for admin views/tables)
// ============================================

/**
 * Supabase Admin client typed with AdminDatabase
 * Includes admin views and tables not in the auto-generated types
 * USE ONLY in admin API routes
 */
// Singleton admin service client
let adminClientInstance: ReturnType<typeof createClient<AdminDatabase>> | null = null;

export function createAdminServiceClient() {
  if (adminClientInstance) return adminClientInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  adminClientInstance = createClient<AdminDatabase>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClientInstance;
}

// ============================================
// SERVER CLIENT (with user session)
// ============================================

/**
 * Supabase client for server components with user session
 * Respects RLS policies based on authenticated user
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}

// ============================================
// TYPES
// ============================================

export type ServiceClient = ReturnType<typeof createServiceClient>;
export type ServerClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;
