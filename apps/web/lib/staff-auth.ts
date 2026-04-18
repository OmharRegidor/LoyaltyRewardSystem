import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase-server';

export function createSupabaseFromCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
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
            // cookie setting may fail in server components
          }
        },
      },
    }
  );
}

interface StaffAccess {
  staffId: string;
  businessId: string;
}

export async function verifyStaffAccess(
  service: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<StaffAccess | null> {
  const { data: staff } = await service
    .from('staff')
    .select('id, business_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (staff) return { staffId: staff.id, businessId: staff.business_id };

  const { data: business } = await service
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  if (business) return { staffId: userId, businessId: business.id };

  return null;
}
