# Auto-create default stamp card template on loyalty-mode switch

**Date:** 2026-04-19
**Status:** Approved (inline design)
**Scope:** Minimum viable — 1 client file edit + 1 DB backfill migration

## Problem

When a business owner sets `businesses.loyalty_mode = 'stamps'` in the web dashboard, no row is automatically created in `stamp_card_templates`. Until the owner separately fills in the Stamp Template form in Settings (reward title, total stamps, etc.), there is no active template.

In that window:

- The mobile brand screen (`apps/mobile/app/brand/[id].tsx`) has no template to read, so `useBrandRewards` returns `stampCard = null`.
- The screen falls back to a tiny yellow badge: *"🎫 Stamp card — visit to start collecting!"* instead of rendering the full flippable `StampLoyaltyCard`.
- Every surface that reads `stamp_card_templates` (public web business page, staff page) degrades the same way.

The owner expects a loyalty card to appear the moment they pick "Stamps."

## Goal

Guarantee an active `stamp_card_templates` row exists for any business whose `loyalty_mode = 'stamps'`, so the full stamp card UI renders everywhere immediately. The owner can still edit title, total stamps, reward, milestones, and image in the Settings Stamp Template editor.

## Non-goals

- No changes to mobile app code. `useBrandRewards` already has a template-fallback path (reads `stamp_card_templates` when the customer has no stamp card yet). Once a template exists, the full `StampLoyaltyCard` renders automatically with `0/N` stamps.
- No changes to the public web business page, staff page, or rewards dashboard — they all read the same table.
- No UI changes to the Stamp Template editor itself.
- No new runtime logic for *switching away* from stamps mode. Existing templates are left alone (the `is_active` flag already handles visibility).

## Design

### Change 1 — Auto-create on mode switch

File: `apps/web/app/dashboard/settings/page.tsx`

In `saveLoyaltyMode`, after successfully setting `businesses.loyalty_mode = 'stamps'`:

1. Fetch the current template via `GET /api/dashboard/stamp-template`.
2. If the response has no template (`data.template` is null/absent), `PUT /api/dashboard/stamp-template` with the defaults below.
3. On success, call `loadStampTemplate()` so the Stamp Template editor section on the same page reflects the new defaults (owner can immediately tweak them).
4. If either fetch fails, log and continue — mode switch itself still succeeds.

If the template already exists (e.g., owner toggled stamps → points → stamps), leave it alone — do not overwrite.

### Change 2 — Backfill migration

File: `supabase/migrations/<YYYYMMDDHHMMSS>_backfill_default_stamp_templates.sql` (repo uses `supabase/migrations/` with `YYYYMMDDHHMMSS_name.sql` naming, per the active migration directory).

For every row in `businesses` where `loyalty_mode = 'stamps'` and no active `stamp_card_templates` row exists, insert one with the defaults below. This handles pre-existing businesses (e.g., "Kiv's Dental Clinic" in the screenshot that motivated this work) that set stamp mode before this fix shipped.

```sql
INSERT INTO stamp_card_templates (
  business_id, title, total_stamps, reward_title,
  reward_description, reward_image_url, min_purchase_amount,
  auto_reset, is_active, milestones
)
SELECT
  b.id, 'Loyalty Card', 10, 'Free Reward',
  NULL, NULL, 0,
  TRUE, TRUE, '[]'::jsonb
FROM businesses b
WHERE b.loyalty_mode = 'stamps'
  AND NOT EXISTS (
    SELECT 1 FROM stamp_card_templates t
    WHERE t.business_id = b.id AND t.is_active = TRUE
  );
```

### Defaults

| Field | Value |
|---|---|
| `title` | `Loyalty Card` |
| `total_stamps` | `10` |
| `reward_title` | `Free Reward` |
| `reward_description` | `NULL` |
| `reward_image_url` | `NULL` |
| `min_purchase_amount` | `0` |
| `auto_reset` | `TRUE` |
| `is_active` | `TRUE` |
| `milestones` | `[]` |

`total_stamps = 10` matches the `useBrandRewards` hook's existing default (line 205 of the hook). The other values are conservative placeholders the owner will customize.

## Data flow after the change

```
Owner flips Settings → Loyalty Mode → "Stamps"
  ↓
saveLoyaltyMode('stamps')
  ↓ UPDATE businesses SET loyalty_mode = 'stamps'
  ↓ GET /api/dashboard/stamp-template → no template
  ↓ PUT /api/dashboard/stamp-template → inserts defaults
  ↓ loadStampTemplate() → Settings UI shows defaults
  ↓
Customer opens brand in mobile app
  ↓ useBrandRewards → no customer stamp_card yet
  ↓ Fallback query to stamp_card_templates → finds active default
  ↓ stampCard = { stamps_collected: 0, total_stamps: 10, reward_title: 'Free Reward', ... }
  ↓
<StampLoyaltyCard /> renders — flippable card with 0/10 stamps, "Free Reward"
```

## Error handling

- If the auto-create PUT fails for any reason (network, validation, RLS), log it to console and let the mode switch succeed anyway. The owner can still manually save the template from the Stamp Template section below. Failing the mode switch for a best-effort auxiliary write would be worse UX than silently skipping it.
- The backfill migration is idempotent by construction (NOT EXISTS clause), so running it multiple times is safe.

## Files touched

1. `apps/web/app/dashboard/settings/page.tsx` — edit `saveLoyaltyMode` only.
2. `supabase/migrations/<new>.sql` — new backfill migration.

## Files NOT touched

- `apps/mobile/**` — no change needed.
- `apps/web/app/api/dashboard/stamp-template/route.ts` — PUT handler already upserts, no change needed.
- `apps/web/app/staff/page.tsx`, `apps/web/app/business/[slug]/**` — read `stamp_card_templates` directly, pick up the new row for free.

## Verification

Manual checks after implementation:

1. New business → Settings → switch to Stamps. Confirm the Stamp Template editor immediately shows the defaults (not blank).
2. Query `stamp_card_templates` — confirm one active row exists for the business.
3. Open the brand in the mobile app — confirm the full flippable `StampLoyaltyCard` renders with `0/10 stamps → Free Reward` and the "Tap card to flip" hint.
4. Existing business already in stamps mode with no template — after migration, confirm template row exists and the card renders on mobile.
5. `npm run lint` and `npm run typecheck` from `apps/web` pass.
