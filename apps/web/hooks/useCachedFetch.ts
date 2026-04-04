// apps/web/hooks/useCachedFetch.ts
// React hook for cached data fetching with instant stale-while-revalidate.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { cachedFetch, getCached, invalidateCache } from '@/lib/client-cache';

interface UseCachedFetchOptions {
  /** Skip fetching (e.g., when a prerequisite isn't ready) */
  enabled?: boolean;
  /** Max age in ms before refetching (default 30s) */
  maxAge?: number;
}

interface UseCachedFetchReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCachedFetch<T>(
  url: string | null,
  options?: UseCachedFetchOptions
): UseCachedFetchReturn<T> {
  const enabled = options?.enabled ?? true;
  const maxAge = options?.maxAge;

  // Initialize with cached data for instant render
  const [data, setData] = useState<T | null>(() => {
    if (!url || !enabled) return null;
    return getCached<T>(url) ?? null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (!url || !enabled) return false;
    return getCached(url) === undefined; // Only loading if no cache
  });
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return;

    // If we have cached data, don't show loading state
    const cached = getCached<T>(url);
    if (!cached) setIsLoading(true);

    try {
      const result = await cachedFetch<T>(url, { maxAge });
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setIsLoading(false);
    }
  }, [url, enabled, maxAge]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    if (url) {
      invalidateCache(url);
      setIsLoading(true);
      fetchData();
    }
  }, [url, fetchData]);

  return { data, isLoading, error, refetch };
}
