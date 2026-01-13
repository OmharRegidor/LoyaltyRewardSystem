// apps/web/lib/supabase-server.ts

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '../../../packages/shared/types/database';

// ============================================
// SERVICE ROLE CLIENT (for server-side operations)
// ============================================

/**
 * Supabase Admin client with service role
 * USE ONLY in server-side code (API routes, server actions)
 * NEVER expose to client
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
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
