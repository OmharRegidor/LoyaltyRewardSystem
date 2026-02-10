// src/hooks/useBrands.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Brand, BrandFromSupabase } from '../types/brands.types';

function transformToBrand(raw: BrandFromSupabase): Brand {
  const activeBranches = (raw.branches || []).filter((b) => b.is_active);

  return {
    id: raw.id,
    name: raw.name,
    logo_url: raw.logo_url,
    description: raw.description,
    points_per_purchase: raw.points_per_purchase,
    branches: activeBranches,
    reward_count: raw.rewards?.length ?? 0,
  };
}

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBrands = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(
          `
          id,
          name,
          logo_url,
          description,
          points_per_purchase,
          branches (id, name, address, city, phone, is_active),
          rewards!inner (id)
        `,
        )
        .eq('rewards.is_active', true)
        .eq('rewards.is_visible', true);

      if (error) throw new Error(error.message);

      const transformed = (data as BrandFromSupabase[]).map(transformToBrand);
      setBrands(transformed);
    } catch (err) {
      console.error('[useBrands] Fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();

    const channel = supabase
      .channel('brands_rewards_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rewards' },
        () => fetchBrands(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBrands]);

  const filteredBrands = useMemo((): Brand[] => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return brands;

    return brands.filter((b) => {
      const nameMatch = b.name.toLowerCase().includes(query);
      const descMatch = b.description?.toLowerCase().includes(query) ?? false;
      const cityMatch = b.branches.some(
        (br) => br.city?.toLowerCase().includes(query) ?? false,
      );
      return nameMatch || descMatch || cityMatch;
    });
  }, [brands, searchQuery]);

  const refresh = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    await fetchBrands();
  }, [fetchBrands]);

  return {
    brands: filteredBrands,
    isLoading,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    refresh,
  };
}
