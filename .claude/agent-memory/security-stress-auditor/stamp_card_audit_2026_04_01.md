---
name: Stamp Card Security Audit 2026-04-01
description: Critical findings from stamp card feature audit - auth bypass, race conditions, feature gate gaps
type: project
---

## Critical Findings (unresolved as of 2026-04-01)

1. **Auth bypass on stamp APIs** -- `/api/staff/stamp/`, `/undo/`, `/redeem/` accept staffId/businessId from request body without verifying the caller is staff at that business. Compare to `/api/staff/pos/sale/` which correctly calls `verifyStaffAndGetBusiness()`.

2. **TOCTOU race in stamp RPCs** -- `add_stamp`, `undo_last_stamp`, `redeem_stamp_card` in migration `20260401000000_stamp_cards.sql` all SELECT then UPDATE without `FOR UPDATE` row locks.

3. **SECURITY DEFINER RPCs granted to `authenticated`** -- Any mobile customer can call `add_stamp` etc. directly via Supabase client. Need to revoke `authenticated` from mutation RPCs.

4. **No feature gate on stamp endpoints** -- Free plan businesses can use stamps despite `plan-features.ts` defining `stampCard: false` for free plan. API routes don't check plan.

5. **Auto-stamp after sale is non-atomic** -- `staff/page.tsx` calls completeSale() then a separate fetch to /api/staff/stamp, which can fail independently on flaky networks.

## Pattern: API route auth in this project
- POS sale route (`/api/staff/pos/sale/route.ts`) uses Bearer token auth + `verifyStaffAndGetBusiness()` -- this is the correct pattern
- Stamp routes use cookie-based auth + body-supplied IDs -- this is the broken pattern
- Dashboard routes verify business ownership via `owner_id = user.id` -- correct for owner-only routes

**Why:** Stamp routes were added following the simpler cookie-auth pattern from other routes but forgot that staff identity must be server-derived, not client-supplied.

**How to apply:** Any new `/api/staff/*` route must derive staffId and businessId from the authenticated user, never from the request body.
