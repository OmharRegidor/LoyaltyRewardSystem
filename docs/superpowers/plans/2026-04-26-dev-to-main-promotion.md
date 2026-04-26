# Promotion plan: `dev` → `main` (live prod)

This is the safe sequence to ship 40 commits + 25 migrations + a mobile OTA to production. Each step has a verification checkpoint. Stop and ask if any check returns unexpected output.

---

## What's shipping

- **40 commits** on `dev` ahead of `main` (full list in `git log origin/main..dev`)
- **25 new migrations** in `supabase/migrations/`
- **17 mobile JS files** OTA-eligible
- **2 mobile config files** (`app.json` `owner`, `eas.json` env removal) — affect future builds only, no impact on current installs

The schema changes are backwards-compatible with current `main` code (added columns are NULL-able or defaulted, RPC signatures preserved). This means **migrations can apply BEFORE the code merge** without breaking the live site.

---

## Phase 1 — Pre-flight (before touching anything)

**You do these:**

### 1.1 Snapshot prod DB
- Open Supabase dashboard → project `vcddpimnbcsojztbyaso` → Database → Backups
- Click **Create new backup**, label `pre-2026-04-26-dev-promotion`
- Wait for "Completed" status

### 1.2 Confirm what's already on prod
Run in Supabase Studio SQL Editor (prod):

```sql
SELECT version FROM supabase_migrations.schema_migrations
 WHERE version >= '20260408'
 ORDER BY version;
```

Send me the result. Anything missing from the list of 25 below is what we'll apply. (Expected: prod has nothing >= 20260408; the dev set is entirely new.)

### 1.3 Pick a low-traffic window
Suggested: 2–4 AM PHT. Backfill in `20260426010000` is bounded (idempotent, NOT EXISTS guards) but does scan `pos_sales` and `stamp_entries`.

---

## Phase 2 — Apply migrations to prod DB *(schema first, code later)*

**Why first:** every migration's schema change is backwards-compatible. The current live web code keeps working after schema changes; the new code will need the schema; doing schema first means we can never have new code hitting old schema.

### Option A — Supabase CLI (recommended, repeatable)

```bash
# Once per machine
supabase login
supabase link --project-ref vcddpimnbcsojztbyaso

# From repo root
supabase db push
```

`db push` reads `supabase_migrations.schema_migrations` on prod and applies only the missing migrations in timestamp order. Each runs in its own transaction.

### Option B — Manual via Studio SQL Editor (fallback)

Apply migrations one at a time in this exact order. Copy each file's contents into the SQL Editor and run. After each successful run, manually insert into the migration table:

```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260408100000', 'drop_and_recreate_process_staff_sale');
-- repeat per migration
```

### Migrations, in order

```
20260408100000_drop_and_recreate_process_staff_sale.sql
20260411000000_increase_max_stamps_to_50.sql
20260411000001_milestone_rewards.sql
20260411200000_add_pos_mode.sql
20260412000000_transaction_item_names.sql
20260416000000_fix_race_conditions_and_idempotency.sql
20260416100000_cascade_delete_stamp_pos_data.sql
20260417133529_create_admin_platform_stats_view.sql
20260417142132_optimize_admin_business_stats_view.sql
20260417142148_create_sum_business_points_30d_rpc.sql
20260417142304_create_delete_business_rpc.sql
20260417231421_add_admin_plan_changes_indexes.sql
20260417231458_create_admin_enterprise_accounts_rpc.sql
20260417232826_create_impersonation_tables.sql
20260417233912_create_admin_facet_rpcs.sql
20260417234639_create_admin_list_users_rpc.sql
20260417234817_create_admin_business_customers_rpcs.sql
20260418045257_fix_process_staff_sale_use_pos_sales.sql
20260418051500_fix_process_staff_sale_double_brand_points.sql
20260418054500_process_staff_sale_use_item_names_in_description.sql
20260418060000_process_staff_sale_amount_guards.sql
20260419120000_backfill_default_stamp_templates.sql
20260423000000_add_mode_to_impersonation_sessions.sql
20260426000000_drop_old_add_stamp_overload.sql
20260426010000_transactions_stamps_and_backfill.sql
```

### 2.1 Post-migration verification (run in Studio prod)

```sql
-- A: add_stamp must have exactly one overload
SELECT oid::regprocedure::text AS signature
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE proname = 'add_stamp' AND nspname = 'public';
-- expected: 1 row, "add_stamp(uuid,uuid,uuid,uuid,text,text)"

-- B: new transactions columns exist
SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='transactions'
   AND column_name IN ('sale_id','stamps_added');
-- expected: 2 rows

-- C: backfill linked sales to transactions
SELECT COUNT(*) AS unlinked_sales
  FROM pos_sales ps
 WHERE ps.customer_id IS NOT NULL
   AND ps.status='completed'
   AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.sale_id = ps.id);
-- expected: 0 (every sale should now have a transactions row)

-- D: stamp_entries with sale_id reflect on transactions
SELECT COUNT(*) AS expected, COALESCE(SUM(t.stamps_added),0) AS actual
  FROM stamp_entries se
  LEFT JOIN transactions t ON t.sale_id = se.sale_id
 WHERE se.is_undone = false AND se.sale_id IS NOT NULL;
-- expected: actual >= expected (every linked stamp counted)

-- E: quick stamps got their own transaction row
SELECT COUNT(*) AS quick_stamps_in_db, (
  SELECT COUNT(*) FROM transactions
   WHERE stamps_added > 0 AND sale_id IS NULL
) AS quick_stamps_in_wallet
  FROM stamp_entries WHERE is_undone=false AND sale_id IS NULL;
-- expected: quick_stamps_in_wallet >= quick_stamps_in_db
```

### 2.2 If anything is wrong here — STOP

Roll back via the snapshot from 1.1 if numbers look catastrophically off. Backfill rows are real customer data; a mismatch alone is not a reason to roll back, but a wholesale failure to apply migrations is.

---

## Phase 3 — Merge `dev` → `main`

Open this URL to create the PR via GitHub UI (no `gh` CLI installed):
**https://github.com/OmharRegidor/LoyaltyRewardSystem/compare/main...dev**

Title: `Promote dev to main: stamps, impersonation, admin tools, wallet activity`

Body: paste the contents of the bottom of this file (after the divider).

Use **Squash and merge** for a single commit on `main`. After merge:

- Vercel auto-deploys to production (assuming `main` → prod project mapping is on)
- Watch the deploy in Vercel dashboard until "Ready"
- Open prod URL, log in as a real staff user

---

## Phase 4 — Web smoke test (on prod, after Vercel deploy lands)

1. Log in as a staff user of a stamps-mode business
2. Scan a customer
3. Click **Ring Up Sale + Stamp**, add a tracked product to cart, complete sale
4. Expect: stamp count increments **and** product stock decrements within ~1 second, **no** "Stamp not added" toast
5. Click "New Sale" → re-scan same customer → confirm stamp count persisted
6. Switch to a points-mode business, do a sale → confirm points still work
7. Open Admin → impersonate a business owner in **read-only** mode → all writes should be blocked
8. End impersonation, retry in **edit** mode → writes work except billing/admin

If any step fails, **stop here**. Roll back via Vercel dashboard (Promote previous deployment to Production).

---

## Phase 5 — Mobile OTA

Once web is verified, ship mobile.

```bash
cd apps/mobile

# One-time
eas login

# Push update to the production channel
eas update --branch production \
  --message "wallet stamp activity, 6mo retention, brand card cleanup, ring-up-sale fixes"
```

Confirm in EAS dashboard that the update is published to the `production` branch and matches the current installed runtime version.

### Mobile smoke test (on a real device)

1. Open prod app, force-close, open again (Expo Updates checks at startup, downloads in bg)
2. Force-close again, reopen — bundle should be the new one now
3. **Brands tab** — no "0 branches" line on any card
4. **Wallet tab** — for a stamps-mode customer: see "+1 stamp" entries on Ring Up Sale visits, plus "Stamp earned" rows for quick stamps
5. **Wallet footer** — reads "Showing last 6 months"
6. **Brand detail** — opens, stamp card displays even if customer has 0 stamps yet

If anything looks wrong: `eas update --branch production --republish [previous-update-id]` rolls back instantly.

---

## Phase 6 — Rollback paths (have these mentally pre-loaded)

| Layer | Rollback action |
|-------|-----------------|
| Mobile OTA | `eas update --branch production --republish [previous-id]` |
| Web | Vercel dashboard → previous deployment → Promote to Production |
| DB schema | Restore from Phase 1.1 snapshot (last resort — destroys any new transactions written since the snapshot). Or partial: re-apply the prior migration's CREATE OR REPLACE to undo a specific RPC change. |
| DB backfill | Idempotent. Re-running is safe. Nothing to undo unless the rows themselves are wrong. |

---

## Order of operations summary (the actual sequence)

1. Snapshot prod DB
2. Verify prod migration state (should be empty for >= 20260408)
3. **Apply 25 migrations** to prod via `supabase db push`
4. Run verification queries A–E
5. Open the compare URL → create PR with squash-merge
6. Wait for Vercel deploy → "Ready"
7. Web smoke test (Phase 4)
8. `eas update --branch production`
9. Mobile smoke test (Phase 5)
10. Done. Tag release in GitHub if you want a marker.

---

## What I cannot promise

I can't promise zero issues. Live systems have edge cases that don't appear in dev. What I **can** promise:

- Each step is **independently verifiable** before moving on
- Each step has a **rollback path**
- The schema-first order means new code never hits old schema
- The backfill is **idempotent** — safe to re-run if interrupted
- The OTA is **runtime-compatible** with current installed builds (verified: no `runtimeVersion` change, no native deps changed)

If you stop after step 3 (migrations applied, no merge yet), the live site keeps working exactly as it does now — just with a richer schema underneath. That's the lowest-risk state if you want to pause and observe.

---

## PR body to paste (copy from here down)

```
## Summary

Promotes 40 commits from `dev` to `main`, bundling several feature streams:

- **Stamp card system** (loyalty mode 'stamps'): templates, milestones, redemption, mobile UI
- **POS catalog mode** (`products`/`services`/`both`)
- **Admin platform & impersonation tools** (read-only + edit mode), enterprise account list, business deletion RPC
- **Wallet activity log** for stamps-mode businesses + 6-month UI retention
- **Staff POS reliability fixes** — auto-stamp now lands, optimistic stock UI, idempotent calls, real error toasts

## Migrations (25 new)

Schema changes:
- `20260411200000_add_pos_mode`
- `20260411000000_increase_max_stamps_to_50`
- `20260411000001_milestone_rewards`
- `20260412000000_transaction_item_names`
- `20260416100000_cascade_delete_stamp_pos_data`
- `20260417232826_create_impersonation_tables`
- `20260423000000_add_mode_to_impersonation_sessions`
- `20260426010000_transactions_stamps_and_backfill` *(adds sale_id + stamps_added to transactions, backfills history)*

RPC / function updates:
- Multiple `process_staff_sale` revisions (race conditions, pos_sales table, item names, double-credit fix, amount guards)
- `add_stamp` race-condition + idempotency fix, then 5-arg overload drop
- `20260408100000_drop_and_recreate_process_staff_sale`
- `20260417142148_create_sum_business_points_30d_rpc`
- `20260417142304_create_delete_business_rpc`
- `20260417231458_create_admin_enterprise_accounts_rpc`
- `20260417233912_create_admin_facet_rpcs`
- `20260417234639_create_admin_list_users_rpc`
- `20260417234817_create_admin_business_customers_rpcs`

Views / indexes / data:
- `20260417133529_create_admin_platform_stats_view`
- `20260417142132_optimize_admin_business_stats_view`
- `20260417231421_add_admin_plan_changes_indexes`
- `20260418045257_fix_process_staff_sale_use_pos_sales`
- `20260419120000_backfill_default_stamp_templates`
- `20260426000000_drop_old_add_stamp_overload`

All schema changes are backwards-compatible with current `main` web/mobile code (added columns are nullable or default 0, RPC signatures preserved). Safe to apply schema **before** merging code.

## Mobile (OTA-eligible)

17 JS files changed in `apps/mobile/`. **No `runtimeVersion` bump, no native deps, no `app.json` plugin changes.** Ships via `eas update --branch production`. The two non-JS file changes (`app.json` `owner` field, `eas.json` env block removal) do not affect existing installs.

## Test plan

After deploying, on prod:

- [ ] **DB** — `SELECT oid::regprocedure FROM pg_proc WHERE proname = 'add_stamp'` returns exactly one signature
- [ ] **DB** — `transactions.sale_id` and `transactions.stamps_added` columns exist
- [ ] **Web staff POS** — Ring Up Sale + Stamp lands stamp + drops stock + no toast error
- [ ] **Web staff POS** — Quick stamp button still works (cookie-auth fallback path)
- [ ] **Mobile wallet** — Stamps-mode customer sees "+1 stamp" entries
- [ ] **Mobile wallet** — Footer reads "Showing last 6 months"
- [ ] **Mobile brands** — No "0 branches" line
- [ ] **Admin** — Impersonation start/end works in both modes
```
