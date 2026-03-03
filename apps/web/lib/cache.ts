// apps/web/lib/cache.ts

import { getRedis } from "./redis";

interface CacheOptions {
  ttlSeconds: number;
}

/**
 * Cache-aside helper: returns cached value or fetches & caches it.
 * Uses SET NX lock to prevent cache stampede.
 */
export async function cacheGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts: CacheOptions,
): Promise<T> {
  const redis = getRedis();
  if (!redis) return fetcher();

  // Try cache first
  const cached = await redis.get<T>(key);
  if (cached !== null && cached !== undefined) return cached;

  // Stampede lock: only one request rebuilds cache
  const lockKey = `lock:${key}`;
  const acquired = await redis.set(lockKey, "1", { nx: true, ex: 10 });

  if (!acquired) {
    // Another request is rebuilding; wait briefly and retry cache
    await new Promise((r) => setTimeout(r, 200));
    const retried = await redis.get<T>(key);
    if (retried !== null && retried !== undefined) return retried;
    // Still miss — just fetch directly
    return fetcher();
  }

  try {
    const value = await fetcher();
    await redis.set(key, value, { ex: opts.ttlSeconds });
    return value;
  } finally {
    await redis.del(lockKey);
  }
}

/** Invalidate a cache key */
export async function cacheInvalidate(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(key);
}

/** Invalidate multiple keys by pattern prefix */
export async function cacheInvalidatePrefix(prefix: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  let cursor = 0;
  do {
    const result = await redis.scan(cursor, { match: `${prefix}*`, count: 100 });
    const nextCursor = result[0];
    const keys = result[1];
    cursor = Number(nextCursor);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== 0);
}

// ============================================
// Domain-specific cache keys & helpers
// ============================================

export const CacheKeys = {
  rewards: (businessId: string) => `rewards:${businessId}`,
  points: (customerId: string) => `points:${customerId}`,
  leaderboard: (businessId: string) => `leaderboard:${businessId}`,
};

export const CacheTTL = {
  rewards: 300,      // 5 minutes
  points: 10,        // 10 seconds
  leaderboard: 60,   // 1 minute
};
