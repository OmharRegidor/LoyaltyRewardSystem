# Cache Public Business Endpoints — Design

**Date:** 2026-05-19
**Status:** Draft, pending implementation
**Branch:** `feat/cache-public-business-endpoints`

## Problem

Two public read endpoints are hit on every customer QR scan and every customer-facing page load:

- `GET /api/public/business/[slug]` — returns business profile (name, logo, branding, loyalty mode, stamp template)
- `GET /api/public/business/[slug]/rewards` — returns the active rewards catalog

Each request currently performs a fresh Supabase round-trip (1–2 queries for the business endpoint, 1 query for the rewards endpoint). Under realistic traffic — e.g. a busy shop with hundreds of customers scanning per hour — this is wasted DB load and connection-pool consumption for data that changes infrequently (owners edit branding and rewards on the order of days or weeks, not seconds).

A Redis-backed cache helper already exists in `apps/web/lib/cache.ts` with stampede protection, but no endpoint currently calls it. This design wires the helper into the two endpoints above.

## Goals

- Reduce Supabase load on the two highest-traffic public read endpoints.
- Use the existing `cacheGet` helper and Upstash Redis client — no new infrastructure.
- Preserve current behavior when Redis is not configured (graceful no-op).
- Keep changes scoped to two route files and the cache key registry (small blast radius, low merge-conflict risk).

## Non-goals

- Caching the PIN-authenticated lookup endpoint (`/api/public/business/[slug]/lookup`) — it returns customer-specific data and writes to the DB on every call.
- Caching customer points, stamp progress, or transactions — these change in real time during stamping/redemption.
- Active cache invalidation triggered from dashboard write paths — dashboard pages write directly to Supabase from the browser today, so there is no server-side mutation hook to call. Invalidation is deferred to TTL expiry; see Tradeoffs.
- Adding rate limiting to the GET endpoints — separate concern, separate PR.
- Refactoring dashboard pages to use API routes for writes — out of scope.

## Approach: TTL-Only Cache-Aside

Wrap the existing service-function calls in the two routes with `cacheGet(key, fetcher, { ttlSeconds: 300 })`. On a hit, return the cached value in ~5ms. On a miss, fetch from Supabase, store with a 5-minute TTL, return.

Owners see edits propagate to the customer side within at most 5 minutes. For logo/branding/rewards catalog, this delay is invisible to users.

## Changes

### File: `apps/web/lib/cache.ts`

Add a key + TTL for the business profile alongside the existing rewards entries.

```ts
export const CacheKeys = {
  business: (slug: string) => `business:slug:${slug}`,
  rewards: (businessId: string) => `rewards:${businessId}`,
  points: (customerId: string) => `points:${customerId}`,
  leaderboard: (businessId: string) => `leaderboard:${businessId}`,
};

export const CacheTTL = {
  business: 300,     // 5 minutes
  rewards: 300,      // 5 minutes (already exists)
  points: 10,
  leaderboard: 60,
};
```

### File: `apps/web/app/api/public/business/[slug]/route.ts`

Wrap the `getBusinessBySlug` call with `cacheGet`.

```ts
import { cacheGet, CacheKeys, CacheTTL } from '@/lib/cache';

// inside GET:
const business = await cacheGet(
  CacheKeys.business(slug),
  () => getBusinessBySlug(slug),
  { ttlSeconds: CacheTTL.business }
);
```

### File: `apps/web/app/api/public/business/[slug]/rewards/route.ts`

The business lookup at the top of this handler also benefits from caching. Reuse the same `business` key, then cache rewards by business ID.

```ts
import { cacheGet, CacheKeys, CacheTTL } from '@/lib/cache';

// inside GET:
const business = await cacheGet(
  CacheKeys.business(slug),
  () => getBusinessBySlug(slug),
  { ttlSeconds: CacheTTL.business }
);

if (!business) {
  return NextResponse.json(
    { success: false, error: 'Business not found' },
    { status: 404 }
  );
}

const rewards = await cacheGet(
  CacheKeys.rewards(business.id),
  () => getPublicRewards(business.id),
  { ttlSeconds: CacheTTL.rewards }
);
```

## Data Flow

**Cache hit (steady state):**

1. Request arrives at the route handler.
2. `cacheGet` calls `redis.get(key)` → returns cached value in ~5ms.
3. Route returns JSON response. No DB query.

**Cache miss (first request or after TTL expiry):**

1. `cacheGet` calls `redis.get(key)` → returns `null`.
2. `cacheGet` acquires a `SET NX` lock (`lock:<key>`, 10s expiry).
3. Fetcher runs (`getBusinessBySlug` or `getPublicRewards`) → Supabase query.
4. Result stored in Redis with TTL 300s.
5. Lock released. Response returned.

**Stampede (cold cache, many concurrent requests):**

1. First request acquires lock, fetches, populates cache.
2. Concurrent requests fail to acquire the lock, wait 200ms, retry cache read.
3. After the populator finishes, retried requests hit the now-warm cache.
4. If a retry is still a miss (rare — populator crashed), it falls through to a direct fetch without locking.

This is already implemented in `cacheGet`. No new code needed.

## Error Handling

| Scenario | Behavior |
|---|---|
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` env vars missing | `getRedis()` returns `null` → `cacheGet` calls the fetcher directly. Endpoints work normally with no caching. |
| Redis is configured but errors mid-request (network blip, Upstash outage) | Exception propagates out of `cacheGet` and is caught by the route's existing `try/catch`, which returns a 500. Sentry captures the error. **Acceptable** — Redis outages are rare, and we want visibility, not silent fallback. |
| Fetcher (Supabase) returns `null` (business not found) | `null` propagates back to the route, which returns 404. The `null` is **not** cached — `cacheGet`'s hit-check is `cached !== null && cached !== undefined`, so a stored `null` falls through to the fetcher on the next request. **Implication:** repeated requests for a non-existent slug each hit Supabase. Acceptable for MVP — non-existent slugs are rare and existing IP rate limiting on other public endpoints absorbs most abuse. Negative caching is deferred to a future change to `cacheGet` if it becomes a problem. |
| Fetcher throws | Lock is released in the `finally` block. No cache entry written. Next request retries. |

## Tradeoffs

1. **Up to 5 minutes of staleness** after an owner edits branding or rewards. Mitigation: TTL is configurable in one place (`CacheTTL`). If owners complain, lower to 60 seconds (the DB savings still apply at 1-minute TTL for high-traffic shops). If they complain again, upgrade to active invalidation (see Future Work).
2. **`null` results are not cached.** Repeated 404 lookups for the same slug each hit Supabase. This is a property of the existing `cacheGet` helper, not the endpoint changes. Adding negative caching would require modifying `cacheGet` to use a sentinel or a separate "miss" marker; deferred to a future PR if needed.
3. **No metrics on cache hit rate yet.** Sentry only catches errors. If we want to tune TTL based on real hit rates, add a metric later. Not in scope.

## Scalability Sanity Check (against `CLAUDE.md` rules)

- No new realtime channels.
- No new unbounded queries; no new in-memory filtering.
- No new sequential awaits in a loop.
- Relies on existing indexes (`businesses.slug`, `rewards.business_id`).
- Reduces DB load and connection-pool consumption on the two hottest public endpoints. Direct contribution to the connection-budget headroom called out in `CLAUDE.md`.

## Testing

No test framework is configured in the project (per `CLAUDE.md`), so verification is manual.

1. **Cold cache → warm cache.** Hit `/api/public/business/<known-slug>` twice from the browser. Second response is noticeably faster. Confirm the `business:slug:<slug>` key appears in the Upstash dashboard.
2. **Rewards endpoint.** Hit `/api/public/business/<known-slug>/rewards` twice. Confirm both `business:slug:<slug>` and `rewards:<id>` keys appear in Upstash.
3. **TTL expiry.** Wait 5+ minutes, hit again, confirm a fresh Supabase query happens (check Supabase logs or just observe timing).
4. **No Redis configured.** Temporarily unset `UPSTASH_REDIS_REST_URL` in the local env, restart dev server, hit endpoints, confirm they still work and return correct data.
5. **Stale-data check.** Edit a logo in the dashboard. Confirm customer side shows new logo within 5 minutes (or immediately after manually deleting the cache key from Upstash).
6. **404 behavior.** Hit `/api/public/business/<nonexistent-slug>`. Confirm 404. Hit again — confirm 404 still returns and that `cacheGet` does NOT store the `null` in Upstash (no `business:slug:<nonexistent-slug>` key appears). Both requests touch Supabase; this is the documented non-caching of negatives.
7. **Lint + typecheck.** `npm run lint` and `npm run typecheck` from `apps/web` pass with no new errors (per project pre-commit rule).

## Future Work (out of scope for this PR)

- Active invalidation: when an owner edits rewards or branding, immediately invalidate the relevant cache keys. Requires either moving dashboard writes to API routes, adding a small invalidation endpoint the dashboard calls after edits, or wiring a Supabase Database Webhook.
- Cache hit-rate metrics: send hit/miss counters to a metrics backend so TTLs can be tuned based on real traffic patterns.
- Cache the `/api/public/referral/validate` endpoint and the public business directory listing, once this pattern is proven.
- Add rate limiting to the cached GET endpoints (currently unrated, easy DoS target even with caching).
