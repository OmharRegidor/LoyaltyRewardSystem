# Cache Public Business Endpoints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing Redis cache helper into the two highest-traffic public business GET endpoints so repeated requests within a 5-minute window serve from Redis instead of Supabase.

**Architecture:** TTL-only cache-aside using the existing `cacheGet` helper in `apps/web/lib/cache.ts`. Adds one new cache key (`business:slug:<slug>`), reuses the existing `rewards:<businessId>` key, and wraps the service calls in two route handlers. No new infrastructure, no changes to dashboard write paths, no active invalidation.

**Tech Stack:** Next.js 16 App Router route handlers, Upstash Redis (already configured via `lib/redis.ts`), TypeScript.

**Spec:** `docs/superpowers/specs/2026-05-19-cache-public-business-endpoints-design.md`

**Branch:** `feat/cache-public-business-endpoints` (already created off `dev`)

**Note on testing:** No automated test framework is configured in this project (per `CLAUDE.md`). This plan uses `npm run lint` + `npm run typecheck` for static verification at each step and a manual verification task at the end. We do **not** add a test framework as part of this change — that is a separate decision out of scope.

**Note on commit messages:** User memory specifies no `Co-Authored-By` trailer. Use plain conventional-commit messages. Recent repo convention uses `feat(scope):` / `fix(scope):` / `chore(scope):` / `docs(scope):`.

---

## File Structure

**Modify:**
- `apps/web/lib/cache.ts` — add `CacheKeys.business(slug)` and `CacheTTL.business`.
- `apps/web/app/api/public/business/[slug]/route.ts` — wrap `getBusinessBySlug(slug)` call with `cacheGet`.
- `apps/web/app/api/public/business/[slug]/rewards/route.ts` — wrap both the `getBusinessBySlug(slug)` lookup and the `getPublicRewards(business.id)` call with `cacheGet`.

**Do not modify:**
- `apps/web/lib/redis.ts` — already wired correctly.
- `apps/web/lib/services/public-business.service.ts` — caching is layered at the route, not the service.
- `apps/web/app/api/public/business/[slug]/lookup/route.ts` — PIN-auth, customer-specific, never cached.
- Dashboard pages — out of scope (no active invalidation in this PR).

---

## Task 1: Add `business` cache key and TTL

**Files:**
- Modify: `apps/web/lib/cache.ts:75-86`

- [ ] **Step 1: Add the business key to `CacheKeys`**

Open `apps/web/lib/cache.ts`. Replace the `CacheKeys` and `CacheTTL` objects (currently lines 75–86) with:

```ts
export const CacheKeys = {
  business: (slug: string) => `business:slug:${slug}`,
  rewards: (businessId: string) => `rewards:${businessId}`,
  points: (customerId: string) => `points:${customerId}`,
  leaderboard: (businessId: string) => `leaderboard:${businessId}`,
};

export const CacheTTL = {
  business: 300,     // 5 minutes — business profile changes rarely
  rewards: 300,      // 5 minutes
  points: 10,        // 10 seconds
  leaderboard: 60,   // 1 minute
};
```

- [ ] **Step 2: Run lint + typecheck**

From `apps/web`:

```bash
npm run lint
npm run typecheck
```

Expected: both exit 0. No new errors introduced.

If `tsc` complains about unused exports, ignore — the new `business` key is consumed in Tasks 2 and 3.

- [ ] **Step 3: Commit**

From the repo root:

```bash
git add apps/web/lib/cache.ts
git commit -m "feat(cache): add business profile cache key and TTL"
```

Verify with `git status` — only `apps/web/lib/cache.ts` should be in the new commit. The pre-existing untracked files (`NoxaLoyalty-Proposal.html`, `app.json`, `apps/web/public/Business-logo/`, etc.) and pre-existing modifications to `.gitignore`, `apps/mobile/app.json`, `apps/web/.claude/settings.local.json` must remain untouched and out of this commit.

---

## Task 2: Cache the business profile endpoint

**Files:**
- Modify: `apps/web/app/api/public/business/[slug]/route.ts`

- [ ] **Step 1: Replace the route file**

The file is small (32 lines). Replace its full contents with:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getBusinessBySlug } from '@/lib/services/public-business.service';
import { cacheGet, CacheKeys, CacheTTL } from '@/lib/cache';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const business = await cacheGet(
      CacheKeys.business(slug),
      () => getBusinessBySlug(slug),
      { ttlSeconds: CacheTTL.business },
    );

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: business,
    });
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Behavior is identical for the consumer. The only change: the `getBusinessBySlug(slug)` call is now wrapped by `cacheGet`, which also caches `null` results (intentional — see spec §"Error Handling").

- [ ] **Step 2: Run lint + typecheck**

From `apps/web`:

```bash
npm run lint
npm run typecheck
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/api/public/business/[slug]/route.ts
git commit -m "feat(cache): cache GET /api/public/business/[slug] with 5min TTL"
```

---

## Task 3: Cache the rewards endpoint

**Files:**
- Modify: `apps/web/app/api/public/business/[slug]/rewards/route.ts`

- [ ] **Step 1: Replace the route file**

The file is small (37 lines). Replace its full contents with:

```ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getBusinessBySlug,
  getPublicRewards,
} from '@/lib/services/public-business.service';
import { cacheGet, CacheKeys, CacheTTL } from '@/lib/cache';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const business = await cacheGet(
      CacheKeys.business(slug),
      () => getBusinessBySlug(slug),
      { ttlSeconds: CacheTTL.business },
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
      { ttlSeconds: CacheTTL.rewards },
    );

    return NextResponse.json({
      success: true,
      data: rewards,
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Notes:
- The `business` lookup at the top reuses the same `CacheKeys.business(slug)` key Task 2 introduced — first hit on either endpoint warms the cache for the other.
- Behavior is identical for the consumer.

- [ ] **Step 2: Run lint + typecheck**

From `apps/web`:

```bash
npm run lint
npm run typecheck
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/app/api/public/business/[slug]/rewards/route.ts"
git commit -m "feat(cache): cache GET /api/public/business/[slug]/rewards with 5min TTL"
```

(The path has square brackets; the quotes are required on PowerShell to avoid glob expansion.)

---

## Task 4: Manual verification

This task is verification only — no commits, no code.

**Prereqs:**
- `apps/web/.env.local` must include `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. If they are missing the cache is a no-op (graceful fallback) — endpoints still work but verification steps 1–4 will not show cache behavior. Confirm both variables are present before continuing, or skip to step 5.
- A known public business slug exists in the database. Pick any active business and note its slug.

- [ ] **Step 1: Cold-cache request (business endpoint)**

Start the dev server:

```bash
npm run dev:web
```

In a new terminal, hit the business endpoint twice with `curl` and time it:

```bash
curl -w "\nTime: %{time_total}s\n" http://localhost:3000/api/public/business/<slug>
curl -w "\nTime: %{time_total}s\n" http://localhost:3000/api/public/business/<slug>
```

Expected: first call shows ~100–300ms `Time:`; second call shows ~10–50ms `Time:` (faster).

- [ ] **Step 2: Cold-cache request (rewards endpoint)**

```bash
curl -w "\nTime: %{time_total}s\n" http://localhost:3000/api/public/business/<slug>/rewards
curl -w "\nTime: %{time_total}s\n" http://localhost:3000/api/public/business/<slug>/rewards
```

Expected: second call faster than the first.

- [ ] **Step 3: Verify keys in Upstash dashboard**

Log into the Upstash console and open the Redis instance dev points to. Confirm these keys exist:

- `business:slug:<your-slug>` — value should be a JSON object matching `PublicBusiness`.
- `rewards:<business-id>` — value should be a JSON array of rewards.

Both should show a TTL counting down from ~300 seconds.

- [ ] **Step 4: TTL expiry**

Wait 5+ minutes (or, faster: delete the `business:slug:<slug>` key manually from the Upstash dashboard). Hit the endpoint again; confirm it's slow again (cache miss → DB → repopulate).

- [ ] **Step 5: No-Redis fallback**

Stop the dev server. Temporarily comment out `UPSTASH_REDIS_REST_URL` in `apps/web/.env.local`. Restart the dev server. Hit both endpoints — they should still return correct data. Console should log `Upstash Redis not configured — falling back to no-op` once on first call.

Restore the env var when done and restart the server.

- [ ] **Step 6: 404 behavior (negative results are NOT cached)**

```bash
curl -w "\nHTTP %{http_code}\n" http://localhost:3000/api/public/business/this-slug-does-not-exist
curl -w "\nHTTP %{http_code}\n" http://localhost:3000/api/public/business/this-slug-does-not-exist
```

Both return `HTTP 404`. In Upstash, confirm **no** `business:slug:this-slug-does-not-exist` key appears — `cacheGet`'s hit-check excludes `null`, so negative results are not cached. Both calls touch Supabase. This is the documented behavior in the spec (§Error Handling). Negative caching is deferred to a future PR.

- [ ] **Step 7: Stale-data sanity check**

While the cache is warm, open the dashboard and edit the business's logo (or any cached field). Hit the public endpoint immediately — you'll see the **old** value. Wait ~5 minutes (or manually delete the key in Upstash) — the new value appears. This is the expected tradeoff documented in the spec.

---

## Task 5: Push and open PR

- [ ] **Step 1: Fetch latest dev**

```bash
git fetch origin
```

- [ ] **Step 2: Merge latest `dev` into the feature branch**

```bash
git merge origin/dev
```

If your collaborator pushed nothing, this is a no-op. If they pushed unrelated changes, the merge fast-forwards or creates a clean merge commit. If they touched any of the same files (`lib/cache.ts` or the two route files), resolve conflicts file-by-file — prefer their changes for unrelated edits, layer the caching on top.

After resolving any conflicts, re-run `npm run lint` and `npm run typecheck` to confirm the merged state still compiles.

- [ ] **Step 3: Push the branch**

```bash
git push -u origin feat/cache-public-business-endpoints
```

- [ ] **Step 4: Open PR via gh CLI**

```bash
gh pr create --base dev --title "feat: cache public business endpoints (5min TTL)" --body "$(cat <<'EOF'
## Summary
- Wire existing `cacheGet` helper into `/api/public/business/[slug]` and `/api/public/business/[slug]/rewards`
- Add `CacheKeys.business(slug)` and `CacheTTL.business = 300` to `lib/cache.ts`
- TTL-only invalidation (5 min); no active invalidation hooks in this PR

## Spec
`docs/superpowers/specs/2026-05-19-cache-public-business-endpoints-design.md`

## Why
These two endpoints are hit on every customer QR scan and customer-facing page load. Business profile and rewards catalog change on the order of days. Caching for 5 minutes eliminates the vast majority of DB queries during traffic spikes.

## Out of scope
- Active invalidation from dashboard write paths (deferred — dashboards write directly to Supabase from the browser today)
- Caching the PIN-auth `lookup` endpoint (per-customer, security-sensitive)
- Rate limiting on the GET endpoints (separate PR)

## Test plan
- [ ] Hit each cached endpoint twice from the browser/curl; second call is faster
- [ ] Confirm `business:slug:<slug>` and `rewards:<id>` keys appear in Upstash dashboard with ~300s TTL
- [ ] Confirm the endpoints still return correct data when Redis env vars are unset (graceful no-op)
- [ ] Confirm a 404 for a nonexistent slug is also cached (DB protection)
- [ ] Confirm dashboard edits propagate to customer side within 5 minutes
EOF
)"
```

This opens a PR against `dev`. Your collaborator can review and merge from GitHub.

---

## Self-Review (already run)

- **Spec coverage:** every section of the spec maps to a task. Cache key change → Task 1. Business endpoint → Task 2. Rewards endpoint → Task 3. Data flow, error handling, 404 caching, stale-data check, no-Redis fallback → Task 4. Branch + PR workflow → Task 5.
- **Placeholder scan:** no TBD / TODO / "implement later" / vague instructions. Every code step shows the full code.
- **Type consistency:** `CacheKeys.business(slug)` and `CacheTTL.business` are defined in Task 1 and consumed identically in Tasks 2 and 3. `getBusinessBySlug` return type (`PublicBusiness | null`) is the same shape `cacheGet` will store and return.
- **YAGNI:** no test framework added, no invalidation infra added, no rate-limit work pulled in.
