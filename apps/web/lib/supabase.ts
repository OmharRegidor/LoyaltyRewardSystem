// apps/web/lib/supabase.ts

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../../packages/shared/types/database';

// ============================================
// BROWSER CLIENT (for client components)
// ============================================
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Type exports
export type SupabaseClient = ReturnType<typeof createClient>; 
export type { Database };
