# High-Traffic Resilience Audit

## Overview

This document covers the resilience hardening applied to the NoxaLoyalty platform, targeting the Supabase Free plan (60 connections).

---

## 1. Race Condition Fix (Atomic Sales)

### Problem
`createStaffSale()` made 4+ separate RPC calls. A failure mid-way left inconsistent state (points awarded but no transaction record, etc).

### Solution
- Created `process_staff_sale` PL/pgSQL function that runs everything in a single transaction
- Uses `SELECT ... FOR UPDATE` to lock the customer row, preventing concurrent modifications
- Added `idempotency_key` column on `transactions` (UNIQUE) to prevent duplicate submissions
- The API route generates a UUID idempotency key per request; clients can also pass `X-Idempotency-Key` header

### Verification
```sql
-- Two concurrent calls with same idempotency key — second returns {duplicate: true}
SELECT process_staff_sale(
  p_business_id := 'your-business-id',
  p_customer_id := 'your-customer-id',
  p_staff_id := 'your-staff-id',
  p_staff_name := 'Test',
  p_subtotal_centavos := 10000,
  p_idempotency_key := 'test-key-123',
  p_sale_items := '[{"name":"Test Item","quantity":1,"unit_price_centavos":10000}]'::jsonb
);
```

---

## 2. Rate Limiting (Upstash Redis)

### Problem
In-memory `Map`-based rate limiter resets on every Vercel cold start/deployment.

### Solution
- Installed `@upstash/redis` and `@upstash/ratelimit`
- Created `apps/web/lib/redis.ts` (singleton client)
- Created `apps/web/lib/rate-limit.ts` with sliding window limiters:
  - **Redeem**: 3/min per user
  - **Earn/POS**: 20/min per user
  - **Login**: 10/min per IP
  - **General API**: 100/min per IP
- Added middleware-level rate limiting for all `/api/` routes (100 req/min per IP)

### Setup Required
```env
# Add to apps/web/.env.local
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

Create a free Upstash Redis instance at https://upstash.com. The system gracefully falls back to the existing in-memory limiter if Redis is not configured.

---

## 3. Caching (Upstash Redis)

### Problem
Every API call hits Supabase directly, exhausting the 60-connection limit.

### Solution
Created `apps/web/lib/cache.ts` with:
- **Cache-aside pattern**: Check Redis first, fetch on miss, cache result
- **Stampede protection**: Uses `SET NX` lock so only one request rebuilds expired cache
- Pre-defined cache keys and TTLs:
  - `rewards:{business_id}` — 5 min TTL
  - `points:{customer_id}` — 10 sec TTL
  - `leaderboard:{business_id}` — 60 sec TTL

### Usage
```typescript
import { cacheGet, cacheInvalidate, CacheKeys, CacheTTL } from "@/lib/cache";

// Read-through cache
const rewards = await cacheGet(
  CacheKeys.rewards(businessId),
  () => fetchRewardsFromDB(businessId),
  { ttlSeconds: CacheTTL.rewards }
);

// Invalidate on mutation
await cacheInvalidate(CacheKeys.rewards(businessId));
```

---

## 4. Database Indexes

### Added Indexes
```sql
idx_transactions_type           -- Filter by earn/redeem
idx_customers_phone             -- Phone lookups (partial, WHERE phone IS NOT NULL)
idx_redemptions_customer_created -- Customer redemption history with date ordering
idx_transactions_idempotency_key -- Idempotency lookups (partial)
idx_businesses_owner_id          -- Used in nearly every RLS policy subquery
idx_customers_user_id            -- Used in RLS policies for transactions, notifications
```

### Already Existing (no changes needed)
- `idx_transactions_customer` (customer_id, created_at DESC)
- `idx_transactions_business` (business_id, created_at DESC)
- `idx_customers_email` (partial)
- `customer_businesses_customer_id_business_id_key` (unique composite)
- `idx_rewards_active_visible`

### Verification
```sql
EXPLAIN ANALYZE SELECT * FROM transactions WHERE customer_id = 'xxx' ORDER BY created_at DESC LIMIT 10;
-- Should show: Index Scan using idx_transactions_customer
```

---

## 5. Connection Pooling

### Problem
`createServiceClient()` created a new Supabase client on every function call.

### Solution
Made both `createServiceClient()` and `createAdminServiceClient()` singletons — they now reuse the same client instance across requests within a serverless function lifecycle.

Note: The Supabase JS SDK uses PostgREST (HTTP), not direct PostgreSQL connections. The real connection pressure comes from PostgREST → PgBouncer → PostgreSQL on Supabase's side, which is managed by Supabase infrastructure.

---

## 6. RLS Policy Audit

### Critical Fixes Applied
1. **Removed overly permissive customer policies** — Any authenticated user could read/update ALL customers:
   - Dropped: `Allow update for authenticated users`, `staff_can_read_customers`, `Staff can read customers`, `Staff can update customers`, `Staff can insert customers`
   - Replaced with properly scoped policies that check `created_by_business_id` against the staff member's business

2. **Added supporting indexes** for RLS subqueries:
   - `idx_businesses_owner_id` — used in ~20 RLS policies
   - `idx_customers_user_id` — used in transaction/notification policies

### Remaining Duplicates (Low Priority)
Several tables have duplicate SELECT policies (e.g., `businesses` has 5 SELECT policies). These don't cause correctness issues since PostgreSQL OR-combines PERMISSIVE policies, but they add minor evaluation overhead. Consider consolidating in a future cleanup.

---

## 7. k6 Load Test Scripts

Located in `tests/k6/`:

| Script | VUs | Duration | Purpose |
|--------|-----|----------|---------|
| `baseline.js` | 50 | 2 min | Establish p50/p90/p99 latency |
| `stress.js` | 0→1000 | 10 min | Find breaking point |
| `spike.js` | 0→1000 | 50 sec | Simulate campaign launch burst |
| `soak.js` | 200 | 15 min | Detect connection leaks |

### Running Tests
```bash
# Install k6: https://k6.io/docs/get-started/installation/
# Set environment variables:
export K6_SUPABASE_URL=https://your-project.supabase.co
export K6_SUPABASE_ANON_KEY=your-anon-key
export K6_TEST_TOKEN=your-test-user-jwt

k6 run tests/k6/baseline.js
```

**Warning**: Do NOT run stress/spike tests against production without monitoring. Start with baseline.

---

## Pre-Campaign Launch Checklist

- [ ] Upstash Redis configured and env vars set
- [ ] Run `k6 run tests/k6/baseline.js` to establish baseline
- [ ] Review Supabase dashboard for connection usage during baseline
- [ ] Run `k6 run tests/k6/stress.js` against staging
- [ ] Monitor Supabase Logs for connection errors
- [ ] Consider upgrading to Supabase Pro if baseline shows >40 connections at p95
- [ ] Enable Supabase dashboard alerts for connection count > 50

## Supabase Free Plan Limits

| Resource | Limit |
|----------|-------|
| Database connections | 60 (via PgBouncer) |
| Database size | 500 MB |
| Storage | 1 GB |
| Edge Functions | 500K invocations/month |
| Bandwidth | 5 GB |
| Realtime concurrent connections | 200 |
