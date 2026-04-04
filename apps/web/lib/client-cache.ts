// apps/web/lib/client-cache.ts
// Lightweight client-side fetch cache with stale-while-revalidate pattern.
// Returns cached data instantly on repeat visits, refreshes in background.

'use client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_MAX_AGE_MS = 30_000; // 30s — fresh
const STALE_MAX_AGE_MS = 300_000;  // 5m — stale but usable

/**
 * Fetch with client-side cache + stale-while-revalidate.
 * - Fresh (< 30s): return cached, no refetch
 * - Stale (30s–5m): return cached + refetch in background
 * - Expired (> 5m): fetch and wait
 * Deduplicates in-flight requests.
 */
export async function cachedFetch<T>(
  url: string,
  options?: { maxAge?: number; forceRefresh?: boolean }
): Promise<T> {
  const maxAge = options?.maxAge ?? DEFAULT_MAX_AGE_MS;
  const now = Date.now();

  if (!options?.forceRefresh) {
    const entry = cache.get(url);
    if (entry) {
      const age = now - entry.timestamp;
      if (age < maxAge) return entry.data as T;
      if (age < STALE_MAX_AGE_MS) {
        backgroundFetch<T>(url);
        return entry.data as T;
      }
    }
  }

  return fetchAndCache<T>(url);
}

async function fetchAndCache<T>(url: string): Promise<T> {
  const existing = inflight.get(url);
  if (existing) return existing as Promise<T>;

  const promise = fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      cache.set(url, { data, timestamp: Date.now() });
      return data as T;
    })
    .finally(() => {
      inflight.delete(url);
    });

  inflight.set(url, promise);
  return promise;
}

function backgroundFetch<T>(url: string): void {
  if (inflight.has(url)) return;
  fetchAndCache<T>(url).catch(() => {});
}

/**
 * Get cached data synchronously for instant render.
 * Returns undefined if no cache or expired.
 */
export function getCached<T>(url: string): T | undefined {
  const entry = cache.get(url);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > STALE_MAX_AGE_MS) {
    cache.delete(url);
    return undefined;
  }
  return entry.data as T;
}

/** Invalidate a single URL */
export function invalidateCache(url: string): void {
  cache.delete(url);
}

/** Invalidate all URLs matching a prefix */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
