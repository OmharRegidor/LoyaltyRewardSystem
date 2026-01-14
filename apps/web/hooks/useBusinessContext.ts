// apps/web/hooks/useBusinessContext.ts

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface Business {
  id: string;
  name: string;
  logoUrl: string | null;
  pesosPerPoint: number;
}

interface UseBusinessContextReturn {
  business: Business | null;
  isLoading: boolean;
  error: string | null;
}

export function useBusinessContext(): UseBusinessContextReturn {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBusiness() {
      const supabase = createClient();

      try {
        // Get current user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError('Not authenticated');
          setIsLoading(false);
          return;
        }

        // Check if user is a business owner
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('id, name, logo_url, pesos_per_point')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (businessError) {
          setError(businessError.message);
          setIsLoading(false);
          return;
        }

        if (businessData) {
          setBusiness({
            id: businessData.id,
            name: businessData.name,
            logoUrl: businessData.logo_url,
            pesosPerPoint: businessData.pesos_per_point || 10,
          });
        } else {
          // Check if user is staff
          const { data: staffData } = await supabase
            .from('staff')
            .select(
              'business_id, businesses(id, name, logo_url, pesos_per_point)'
            )
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (staffData?.businesses) {
            const biz = staffData.businesses as {
              id: string;
              name: string;
              logo_url: string | null;
              pesos_per_point: number | null;
            };
            setBusiness({
              id: biz.id,
              name: biz.name,
              logoUrl: biz.logo_url,
              pesosPerPoint: biz.pesos_per_point || 10,
            });
          } else {
            setError('No business found for this user');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBusiness();
  }, []);

  return { business, isLoading, error };
}
