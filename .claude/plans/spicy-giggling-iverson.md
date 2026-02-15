# Fix: Two Redemption Bugs

## Context

Two issues in the reward redemption flow:

1. **Code length mismatch**: `redeem_reward` RPC generates 8-char hex codes (e.g., "535271F2") but the staff verification page only accepts 6 characters (`maxLength={6}`, `slice(0, 6)`). Staff can never verify a code because it gets truncated.

2. **Per-business points wrong after redemption**: User had 250 per-business pts, redeemed a 250pt reward, but per-business balance shows 180 instead of 0 (global balance correctly shows 0). This is caused by historical double-counting of earn points — the `trg_auto_link_customer_business` trigger adds points on transaction insert, AND `add_business_points` was previously called explicitly too. The `fix_double_counted_points` migration recalculates from the transaction ledger but needs to be applied.

## Plan

### Step 1: Fix `redeem_reward` code length (8 → 6)

**File:** `supabase/migrations/20260216100000_fix_redeem_reward_per_business.sql` (line 56)

```sql
-- Change from:
v_redemption_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
-- To:
v_redemption_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
```

### Step 2: Append per-business points recalculation to the migration

**File:** `supabase/migrations/20260216100000_fix_redeem_reward_per_business.sql`

Add at the end of the file (same content as `fix_double_counted_points` migration):

```sql
-- Recalculate per-business points from transaction ledger
UPDATE customer_businesses cb
SET points = COALESCE((
  SELECT SUM(
    CASE WHEN t.type = 'earn' THEN t.points ELSE -t.points END
  )
  FROM transactions t
  WHERE t.customer_id = cb.customer_id
    AND t.business_id = cb.business_id
), 0);
```

This recalculates all per-business balances from the transactions table (single source of truth), fixing any historical double-counting.

## Files to modify

| File | Change |
|------|--------|
| `supabase/migrations/20260216100000_fix_redeem_reward_per_business.sql` | Line 56: `1, 8` → `1, 6`; append points recalculation |

## Verification

1. Run the updated SQL in Supabase SQL Editor
2. Verify per-business points are correct (recalculated from transactions)
3. Redeem a new reward → code should be 6 characters
4. Enter the 6-char code on staff page → verification should succeed
5. Per-business points should correctly reflect the deduction
