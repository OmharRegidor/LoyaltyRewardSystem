// apps/web/lib/rate-limit.ts

import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

type LimiterKey = "redeem" | "earn" | "login" | "api";

const limiters = new Map<LimiterKey, Ratelimit>();

function getLimiter(key: LimiterKey): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  if (limiters.has(key)) return limiters.get(key)!;

  const configs: Record<LimiterKey, { tokens: number; window: `${number} s` | `${number} m` }> = {
    redeem: { tokens: 3, window: "60 s" },
    earn: { tokens: 20, window: "60 s" },
    login: { tokens: 10, window: "60 s" },
    api: { tokens: 100, window: "60 s" },
  };

  const cfg = configs[key];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.tokens, cfg.window),
    prefix: `rl:${key}`,
  });

  limiters.set(key, limiter);
  return limiter;
}

export async function checkRedisRateLimit(
  limiterKey: LimiterKey,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = getLimiter(limiterKey);

  // If Redis not configured, allow all (fallback to in-memory in security.ts)
  if (!limiter) {
    return { allowed: true, remaining: 999, retryAfterMs: 0 };
  }

  const result = await limiter.limit(identifier);
  return {
    allowed: result.success,
    remaining: result.remaining,
    retryAfterMs: result.success ? 0 : result.reset - Date.now(),
  };
}
