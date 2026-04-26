# MVP Hardening — P0 & P1 Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical (P0) and high-priority (P1) issues identified in the Noxa Dev Team review so NoxaLoyalty is safe to launch with real users.

**Architecture:** Database-level fixes via new SQL migration for race conditions and idempotency. API-level fixes for auth guards, input validation, rate limiting. Frontend fixes for error feedback. Infrastructure fixes for monitoring and connection pooling.

**Tech Stack:** PostgreSQL (PL/pgSQL), Next.js 16 API Routes, Supabase, Upstash Redis, Sonner (toast), Sentry

---

## File Map

### New Files
- `supabase/migrations/20260416000000_fix_race_conditions_and_idempotency.sql` — Row locks + idempotency keys for all stamp/sale functions
- `apps/web/lib/staff-auth.ts` — Shared `verifyStaffAccess` helper (deduplicates 5 route files)

### Modified Files
- `apps/web/app/api/cron/check-expired-plans/route.ts` — Invert auth guard
- `apps/web/app/api/staff/stamp/route.ts` — Use shared auth, add idempotency header
- `apps/web/app/api/staff/stamp/redeem/route.ts` — Use shared auth
- `apps/web/app/api/staff/stamp/redeem-milestone/route.ts` — Use shared auth
- `apps/web/app/api/staff/stamp/undo/route.ts` — Use shared auth
- `apps/web/app/staff/page.tsx` — Add error toasts, debounce guards
- `apps/web/app/layout.tsx` — Add Sonner `<Toaster />`
- `apps/web/lib/services/public-business.service.ts:629-646` — Fix in-memory scan
- `apps/web/lib/security.ts` — Replace in-memory Map with Upstash Redis
- `apps/web/app/api/staff/send-invite-email/route.ts` — Derive businessName from DB
- `apps/web/app/dashboard/page.tsx` — Debounce realtime reload, fix hardcoded growth stats
- `apps/web/app/dashboard/analytics/page.tsx` — Fix KPI trends, remove or compute CLV

---

## Task 1: SQL Migration — Row Locks + Idempotency

**Files:**
- Create: `supabase/migrations/20260416000000_fix_race_conditions_and_idempotency.sql`

This migration rewrites the critical PL/pgSQL functions to use `SELECT ... FOR UPDATE` row locking and adds idempotency support to `add_stamp`.

- [ ] **Step 1: Create migration file with `add_stamp` fix**

```sql
-- 20260416000000_fix_race_conditions_and_idempotency.sql
-- Fixes: P0 race conditions + P0 idempotency

-- ============================================
-- 1. Add idempotency column to stamp_entries
-- ============================================
ALTER TABLE stamp_entries ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_stamp_entries_idempotency
  ON stamp_entries (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ============================================
-- 2. Fix add_stamp: row lock + idempotency
-- ============================================
CREATE OR REPLACE FUNCTION public.add_stamp(
  p_customer_id UUID,
  p_business_id UUID,
  p_staff_id UUID,
  p_sale_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_loyalty_mode TEXT;
  v_template RECORD;
  v_card RECORD;
  v_new_stamps INT;
  v_is_completed BOOLEAN;
  v_milestone_label TEXT;
  v_existing_entry RECORD;
BEGIN
  -- Idempotency check: if key already used, return previous result
  IF p_idempotency_key IS NOT NULL THEN
    SELECT se.id, sc.id AS card_id, sc.stamps_collected, sc.is_completed,
           sct.total_stamps, sct.reward_title
    INTO v_existing_entry
    FROM stamp_entries se
    JOIN stamp_cards sc ON sc.id = se.stamp_card_id
    JOIN stamp_card_templates sct ON sct.id = sc.template_id
    WHERE se.idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'card_id', v_existing_entry.card_id,
        'stamps_collected', v_existing_entry.stamps_collected,
        'total_stamps', v_existing_entry.total_stamps,
        'is_completed', v_existing_entry.is_completed,
        'is_duplicate', true
      );
    END IF;
  END IF;

  -- Verify business is in stamps mode
  SELECT loyalty_mode INTO v_loyalty_mode FROM businesses WHERE id = p_business_id;
  IF v_loyalty_mode IS NULL THEN
    RAISE EXCEPTION 'Business not found';
  END IF;
  IF v_loyalty_mode <> 'stamps' THEN
    RAISE EXCEPTION 'Business is not in stamps mode';
  END IF;

  -- Get active template
  SELECT * INTO v_template FROM stamp_card_templates
  WHERE business_id = p_business_id AND is_active = true
  LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active stamp card template found';
  END IF;

  -- Ensure customer_businesses link exists
  INSERT INTO customer_businesses (customer_id, business_id)
  VALUES (p_customer_id, p_business_id)
  ON CONFLICT (customer_id, business_id) DO NOTHING;

  -- Find or create active card — WITH ROW LOCK
  SELECT * INTO v_card FROM stamp_cards
  WHERE customer_id = p_customer_id
    AND business_id = p_business_id
    AND template_id = v_template.id
    AND is_completed = false
    AND is_redeemed = false
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO stamp_cards (customer_id, business_id, template_id, stamps_collected, total_stamps, milestones)
    VALUES (p_customer_id, p_business_id, v_template.id, 0, v_template.total_stamps, v_template.milestones)
    RETURNING * INTO v_card;
  END IF;

  -- Check if paused at milestone
  IF v_card.paused_at_milestone IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Card is paused at a milestone reward. Redeem the milestone first.',
      'is_milestone_paused', true,
      'milestone_position', v_card.paused_at_milestone,
      'milestone_label', (
        SELECT elem->>'label' FROM jsonb_array_elements(v_card.milestones) AS elem
        WHERE (elem->>'position')::int = v_card.paused_at_milestone
        LIMIT 1
      )
    );
  END IF;

  -- Calculate new stamp count
  v_new_stamps := v_card.stamps_collected + 1;

  -- Insert stamp entry (with idempotency key)
  INSERT INTO stamp_entries (stamp_card_id, stamped_by, sale_id, notes, idempotency_key)
  VALUES (v_card.id, p_staff_id, p_sale_id, p_notes, p_idempotency_key);

  -- Check if hitting a milestone (not the final stamp)
  IF v_new_stamps < v_card.total_stamps THEN
    SELECT elem->>'label' INTO v_milestone_label
    FROM jsonb_array_elements(v_card.milestones) AS elem
    WHERE (elem->>'position')::int = v_new_stamps
      AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_card.redeemed_milestones) AS rm
        WHERE (rm->>'position')::int = v_new_stamps
      )
    LIMIT 1;
  END IF;

  IF v_milestone_label IS NOT NULL AND v_new_stamps < v_card.total_stamps THEN
    -- Pause at milestone
    UPDATE stamp_cards SET
      stamps_collected = v_new_stamps,
      paused_at_milestone = v_new_stamps
    WHERE id = v_card.id;

    -- Log scan
    INSERT INTO scan_logs (business_id, customer_id, staff_id, action)
    VALUES (p_business_id, p_customer_id, p_staff_id, 'stamp');
    UPDATE staff SET scans_today = scans_today + 1 WHERE id = p_staff_id;

    RETURN jsonb_build_object(
      'success', true,
      'card_id', v_card.id,
      'stamps_collected', v_new_stamps,
      'total_stamps', v_card.total_stamps,
      'is_completed', false,
      'is_milestone', true,
      'milestone_label', v_milestone_label,
      'reward_title', v_template.reward_title
    );
  END IF;

  -- Normal stamp (or final stamp completing the card)
  v_is_completed := v_new_stamps >= v_card.total_stamps;

  UPDATE stamp_cards SET
    stamps_collected = v_new_stamps,
    is_completed = v_is_completed,
    completed_at = CASE WHEN v_is_completed THEN NOW() ELSE NULL END
  WHERE id = v_card.id;

  -- Log scan
  INSERT INTO scan_logs (business_id, customer_id, staff_id, action)
  VALUES (p_business_id, p_customer_id, p_staff_id, 'stamp');
  UPDATE staff SET scans_today = scans_today + 1 WHERE id = p_staff_id;

  RETURN jsonb_build_object(
    'success', true,
    'card_id', v_card.id,
    'stamps_collected', v_new_stamps,
    'total_stamps', v_card.total_stamps,
    'is_completed', v_is_completed,
    'is_milestone', false,
    'reward_title', v_template.reward_title
  );
END;
$$;
```

- [ ] **Step 2: Add `undo_last_stamp` fix with row lock**

Append to the same migration file:

```sql
-- ============================================
-- 3. Fix undo_last_stamp: row lock
-- ============================================
CREATE OR REPLACE FUNCTION public.undo_last_stamp(
  p_stamp_card_id UUID,
  p_staff_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_card RECORD;
  v_last_entry RECORD;
  v_new_count INT;
BEGIN
  -- Lock the card row to prevent concurrent modifications
  SELECT * INTO v_card FROM stamp_cards
  WHERE id = p_stamp_card_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stamp card not found';
  END IF;

  IF v_card.is_redeemed THEN
    RAISE EXCEPTION 'Cannot undo stamp on a redeemed card';
  END IF;

  -- Find last non-undone entry
  SELECT * INTO v_last_entry FROM stamp_entries
  WHERE stamp_card_id = p_stamp_card_id AND is_undone = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No stamps to undo';
  END IF;

  -- Mark entry as undone
  UPDATE stamp_entries SET
    is_undone = true,
    undone_at = NOW(),
    undone_by = p_staff_id
  WHERE id = v_last_entry.id;

  -- Decrement count
  v_new_count := GREATEST(0, v_card.stamps_collected - 1);

  UPDATE stamp_cards SET
    stamps_collected = v_new_count,
    is_completed = false,
    completed_at = NULL,
    paused_at_milestone = NULL
  WHERE id = p_stamp_card_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_count', v_new_count,
    'total_stamps', v_card.total_stamps
  );
END;
$$;
```

- [ ] **Step 3: Add `process_staff_sale` fix with row lock on points**

Append to the same migration file:

```sql
-- ============================================
-- 4. Fix process_staff_sale: row lock on customer_businesses for points exchange
-- ============================================
-- We need to add FOR UPDATE to the points balance check.
-- The full function is large, so we patch just the critical section.
-- Re-create the entire function with the fix applied.

-- (This replaces the existing function)
-- The key change is on the SELECT INTO v_current_points line:
-- OLD: SELECT COALESCE(cb.points, 0) INTO v_current_points FROM customer_businesses cb WHERE ...
-- NEW: SELECT COALESCE(cb.points, 0) INTO v_current_points FROM customer_businesses cb WHERE ... FOR UPDATE
```

Note: The full `process_staff_sale` function is 200+ lines. Rather than duplicating the entire function in this migration, we add a targeted fix: wrap the points-check query with `FOR UPDATE`. Read the current function from `20260408100000_drop_and_recreate_process_staff_sale.sql` and apply this single-line change at the SELECT INTO v_current_points query (around line 86-88 of the original).

- [ ] **Step 4: Add `redeem_milestone` and `redeem_stamp_card` row locks**

Append to the same migration file:

```sql
-- ============================================
-- 5. Fix redeem_milestone: row lock
-- ============================================
CREATE OR REPLACE FUNCTION public.redeem_milestone(
  p_stamp_card_id UUID,
  p_staff_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_card RECORD;
  v_position INT;
  v_milestone_label TEXT;
BEGIN
  -- Lock the card row
  SELECT * INTO v_card FROM stamp_cards
  WHERE id = p_stamp_card_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stamp card not found';
  END IF;

  IF v_card.is_redeemed THEN
    RAISE EXCEPTION 'Card already redeemed';
  END IF;

  IF v_card.paused_at_milestone IS NULL THEN
    RAISE EXCEPTION 'Card is not paused at a milestone';
  END IF;

  v_position := v_card.paused_at_milestone;

  -- Get milestone label
  SELECT elem->>'label' INTO v_milestone_label
  FROM jsonb_array_elements(v_card.milestones) AS elem
  WHERE (elem->>'position')::int = v_position
  LIMIT 1;

  -- Append to redeemed_milestones and clear pause
  UPDATE stamp_cards SET
    redeemed_milestones = COALESCE(redeemed_milestones, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'position', v_position,
      'redeemed_at', NOW(),
      'redeemed_by', p_staff_id
    )),
    paused_at_milestone = NULL
  WHERE id = p_stamp_card_id;

  RETURN jsonb_build_object(
    'success', true,
    'milestone_label', COALESCE(v_milestone_label, 'Milestone ' || v_position),
    'milestone_position', v_position,
    'stamps_collected', v_card.stamps_collected,
    'total_stamps', v_card.total_stamps
  );
END;
$$;
```

- [ ] **Step 5: Apply migration**

Run: `npx supabase db push` or use the Supabase MCP `apply_migration` tool.

---

## Task 2: Cron Auth Guard — Deny by Default

**Files:**
- Modify: `apps/web/app/api/cron/check-expired-plans/route.ts:10-12`

- [ ] **Step 1: Invert the guard**

Replace lines 10-12:
```ts
  // OLD: if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  // NEW: deny by default — if no secret is set, block all requests
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/cron/check-expired-plans/route.ts
git commit -m "fix(security): deny cron endpoint by default when CRON_SECRET is unset"
```

---

## Task 3: Shared Staff Auth Helper

**Files:**
- Create: `apps/web/lib/staff-auth.ts`
- Modify: `apps/web/app/api/staff/stamp/route.ts`
- Modify: `apps/web/app/api/staff/stamp/redeem/route.ts`
- Modify: `apps/web/app/api/staff/stamp/redeem-milestone/route.ts`
- Modify: `apps/web/app/api/staff/stamp/undo/route.ts`

- [ ] **Step 1: Create shared helper**

```ts
// apps/web/lib/staff-auth.ts

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase-server';

export function createSupabaseFromCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // cookie setting may fail in server components
          }
        },
      },
    }
  );
}

interface StaffAccess {
  staffId: string;
  businessId: string;
}

export async function verifyStaffAccess(
  service: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<StaffAccess | null> {
  const { data: staff } = await service
    .from('staff')
    .select('id, business_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (staff) return { staffId: staff.id, businessId: staff.business_id };

  const { data: business } = await service
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  if (business) return { staffId: userId, businessId: business.id };

  return null;
}
```

- [ ] **Step 2: Update stamp/route.ts to use shared helper**

Replace the file's local `createSupabaseClient` and `verifyStaffAccess` with imports:

```ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase-server';
import { createSupabaseFromCookies, verifyStaffAccess } from '@/lib/staff-auth';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseFromCookies(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, saleId, notes } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      );
    }

    const service = createServiceClient();
    const access = await verifyStaffAccess(service, user.id);
    if (!access) {
      return NextResponse.json(
        { error: 'Not authorized as staff or business owner' },
        { status: 403 }
      );
    }

    // Pass idempotency key from header
    const idempotencyKey = request.headers.get('x-idempotency-key') || null;

    const { data, error } = await service.rpc('add_stamp', {
      p_customer_id: customerId,
      p_business_id: access.businessId,
      p_staff_id: access.staffId,
      p_sale_id: saleId || null,
      p_notes: notes || null,
      p_idempotency_key: idempotencyKey,
    });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add stamp';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Update redeem/route.ts, redeem-milestone/route.ts, undo/route.ts**

Same pattern: remove local `createSupabaseClient` and `verifyStaffAccess`, import from `@/lib/staff-auth`. Keep each file's specific RPC call unchanged.

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/staff-auth.ts apps/web/app/api/staff/stamp/
git commit -m "refactor: extract shared verifyStaffAccess helper, add idempotency to stamp route"
```

---

## Task 4: Fix In-Memory Customer Scan

**Files:**
- Modify: `apps/web/lib/services/public-business.service.ts:629-646`

- [ ] **Step 1: Replace in-memory loop with DB query**

Replace lines 629-647 (the Lookup 2 section):

```ts
  // Lookup 2: Search for customer already linked to this business
  // Push filter to DB instead of loading all rows into memory
  if (!existingCustomer && (normalizedEmail || normalizedPhone)) {
    // Try email match first
    if (normalizedEmail) {
      const { data } = await supabase
        .from('customer_businesses')
        .select('customer_id, customers!inner(id, qr_code_url, email, phone)')
        .eq('business_id', businessId)
        .eq('customers.email', normalizedEmail)
        .limit(1)
        .maybeSingle();
      if (data) {
        const c = Array.isArray(data.customers) ? data.customers[0] : data.customers;
        if (c) existingCustomer = { id: c.id, qr_code_url: c.qr_code_url, email: c.email, phone: c.phone };
      }
    }
    // Try phone match if email didn't find anything
    if (!existingCustomer && normalizedPhone) {
      const { data } = await supabase
        .from('customer_businesses')
        .select('customer_id, customers!inner(id, qr_code_url, email, phone)')
        .eq('business_id', businessId)
        .eq('customers.phone', normalizedPhone)
        .limit(1)
        .maybeSingle();
      if (data) {
        const c = Array.isArray(data.customers) ? data.customers[0] : data.customers;
        if (c) existingCustomer = { id: c.id, qr_code_url: c.qr_code_url, email: c.email, phone: c.phone };
      }
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/services/public-business.service.ts
git commit -m "fix(perf): push customer lookup filter to DB instead of in-memory scan"
```

---

## Task 5: Add Error Toasts to Staff Page

**Files:**
- Modify: `apps/web/app/layout.tsx` — Add Sonner Toaster
- Modify: `apps/web/app/staff/page.tsx` — Add toast calls in catch blocks + debounce guards

- [ ] **Step 1: Add Sonner Toaster to root layout**

In `apps/web/app/layout.tsx`, add:

```tsx
import { Toaster } from 'sonner';
```

And inside the `<body>` tag, add `<Toaster richColors position="top-center" />` before `<Analytics />`:

```tsx
<body className="font-sans antialiased overflow-x-hidden" suppressHydrationWarning>
  {children}
  <Toaster richColors position="top-center" />
  <Analytics />
</body>
```

- [ ] **Step 2: Add toast error feedback and debounce guards to staff page**

At the top of `apps/web/app/staff/page.tsx`, add:

```ts
import { toast } from 'sonner';
```

Then update the three handlers:

**handleQuickStamp** (line 678-679) — replace the catch block:
```ts
    } catch (err) {
      console.error('Quick stamp error:', err);
      toast.error('Failed to stamp card. Please try again.');
    } finally {
```

Also add a check after `res.json()`: if `!res.ok`, show the server error:
```ts
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to stamp card');
        return;
      }
```

**handleRedeemStampCard** (line 732-733) — replace the catch block:
```ts
    } catch (err) {
      console.error('Redeem stamp card error:', err);
      toast.error('Failed to redeem card. Please try again.');
    }
```

Also add `!res.ok` check like above.

**handleRedeemMilestone** (line 704-705) — replace the catch block:
```ts
    } catch (err) {
      console.error('Redeem milestone error:', err);
      toast.error('Failed to redeem milestone. Please try again.');
    }
```

Also add `!res.ok` check.

- [ ] **Step 3: Add idempotency key header to handleQuickStamp fetch**

```ts
const idempotencyKey = `stamp-${customer.id}-${Date.now()}`;
const res = await fetch('/api/staff/stamp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-idempotency-key': idempotencyKey,
  },
  body: JSON.stringify({ customerId: customer.id }),
});
```

- [ ] **Step 4: Add isRedeeming guard to handleRedeemStampCard**

Add state: `const [isRedeeming, setIsRedeeming] = useState(false);`

Wrap handleRedeemStampCard:
```ts
const handleRedeemStampCard = async () => {
  if (!stampCardData?.card_id || !staffData || isRedeeming) return;
  setIsRedeeming(true);
  try {
    // ... existing logic ...
  } catch (err) {
    console.error('Redeem stamp card error:', err);
    toast.error('Failed to redeem card. Please try again.');
  } finally {
    setIsRedeeming(false);
  }
};
```

Do the same for `handleRedeemMilestone` with `isRedeemingMilestone` state.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/layout.tsx apps/web/app/staff/page.tsx
git commit -m "fix(ux): add error toasts and debounce guards to staff stamp/redeem actions"
```

---

## Task 6: Replace In-Memory Rate Limiter with Upstash Redis

**Files:**
- Modify: `apps/web/lib/security.ts:29-91`

- [ ] **Step 1: Replace the Map-based rate limiter with Upstash**

The existing `apps/web/lib/rate-limit.ts` already has a working Upstash-based rate limiter. In `apps/web/lib/security.ts`, replace the `rateLimitStore` Map and `checkRateLimit` function to use the same Upstash Redis instance:

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Replace the Map-based store with Upstash Redis
let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

const RATE_LIMITS = {
  login: { maxRequests: 5, window: '15 m' as const },
  signup: { maxRequests: 3, window: '60 m' as const },
  password_reset: { maxRequests: 3, window: '60 m' as const },
  checkout: { maxRequests: 5, window: '1 m' as const },
  portal: { maxRequests: 10, window: '1 m' as const },
  api_general: { maxRequests: 100, window: '1 m' as const },
  api_write: { maxRequests: 30, window: '1 m' as const },
  qr_scan: { maxRequests: 30, window: '1 m' as const },
  points_award: { maxRequests: 20, window: '1 m' as const },
};

const limiters = new Map<string, Ratelimit>();

function getLimiter(endpointType: keyof typeof RATE_LIMITS): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  if (limiters.has(endpointType)) return limiters.get(endpointType)!;
  const config = RATE_LIMITS[endpointType];
  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(config.maxRequests, config.window),
    prefix: `rl:security:${endpointType}`,
  });
  limiters.set(endpointType, limiter);
  return limiter;
}

export async function checkRateLimit(
  key: string,
  endpointType: keyof typeof RATE_LIMITS
): Promise<RateLimitResult> {
  const limiter = getLimiter(endpointType);
  if (!limiter) {
    // No Redis configured — fail open in dev, but log warning
    return { allowed: true, remaining: Infinity, resetAt: new Date() };
  }
  const result = await limiter.limit(`${endpointType}:${key}`);
  return {
    allowed: result.success,
    remaining: result.remaining,
    resetAt: new Date(result.reset),
  };
}
```

Note: `checkRateLimit` is now `async` — update all call sites. Search for `checkRateLimit(` and add `await`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/security.ts
git commit -m "fix(security): replace in-memory rate limiter with Upstash Redis"
```

---

## Task 7: Fix Staff Invite Email — Derive businessName from DB

**Files:**
- Modify: `apps/web/app/api/staff/send-invite-email/route.ts`

- [ ] **Step 1: Look up businessName from DB instead of trusting request body**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server';
import { sendStaffInviteEmail } from '@/lib/email';
import { z } from 'zod';

const SendInviteEmailSchema = z.object({
  email: z.string().email(),
  staffName: z.string().min(1),
  inviteUrl: z.string().url(),
  role: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = SendInviteEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 },
      );
    }

    const { email, staffName, inviteUrl, role } = parsed.data;

    // Derive businessName from authenticated user's business — do not trust request body
    const service = createServiceClient();
    const { data: business } = await service
      .from('businesses')
      .select('name')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found for authenticated user' },
        { status: 403 },
      );
    }

    // Validate inviteUrl matches our app domain
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const allowedHost = new URL(appUrl).hostname.replace(/^www\./, '');
    try {
      const inviteHost = new URL(inviteUrl).hostname.replace(/^www\./, '');
      if (inviteHost !== allowedHost) {
        return NextResponse.json(
          { success: false, error: 'Invalid invite URL' },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid invite URL' },
        { status: 400 },
      );
    }

    const result = await sendStaffInviteEmail({
      to: email,
      staffName,
      businessName: business.name,
      inviteUrl,
      role,
    });

    return NextResponse.json({
      success: result.success,
      error: result.error,
    });
  } catch (error) {
    console.error('Send staff invite email error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/staff/send-invite-email/route.ts
git commit -m "fix(security): derive businessName from DB instead of trusting request body"
```

---

## Task 8: Fix Analytics KPIs

**Files:**
- Modify: `apps/web/app/dashboard/analytics/page.tsx:354-400`

- [ ] **Step 1: Remove hardcoded "vs last month" indicator and fix CLV**

Replace the hardcoded trend line (around line 395-397) with conditional rendering. Remove the Customer Lifetime Value KPI entirely since it's never computed, or replace it with something meaningful.

In the KPI card map (around line 379), remove the static trend indicator:

```tsx
// Remove this from each KPI card:
// <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
//   <TrendingUp className="w-3.5 h-3.5" /> vs last month
// </p>
```

Replace the `customerLTV` card with total redemptions count (already available in the data):

```tsx
{
  label: 'Total Redemptions',
  value: rewardPerformance.reduce((sum, r) => sum + r.redemptions, 0).toLocaleString(),
  color: 'blue',
  icon: Gift,
},
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/dashboard/analytics/page.tsx
git commit -m "fix(analytics): remove misleading hardcoded KPI trends, replace unused CLV"
```

---

## Task 9: Fix Unbounded POS Queries

**Files:**
- Modify: `apps/web/lib/services/pos.service.ts` — `getDailySummary` and `getSalesAnalytics`

- [ ] **Step 1: Add .limit() to getDailySummary and getSalesAnalytics**

For `getDailySummary` (around line 582), add `.limit(5000)` to the initial pos_sales query as a safety cap. The daily scope naturally limits rows, but this prevents edge cases.

For `getSalesAnalytics` (around line 838), add `.limit(10000)` to the pos_sales query. The date range is already capped at 90 days by the API route, but the service function itself should have a guard.

These are interim fixes. The proper long-term fix is to move aggregation to DB RPCs, but that's a larger effort that can be done post-MVP.

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/services/pos.service.ts
git commit -m "fix(perf): add .limit() safety caps to POS analytics queries"
```

---

## Task 10: Debounce Dashboard Realtime Reload

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx:601-625`

- [ ] **Step 1: Add debounce to realtime handler**

Add a debounce ref and modify the realtime callback:

```tsx
// At top of component, add:
const reloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// In the useEffect with the realtime subscription, replace the callback:
.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'transactions',
    filter: `business_id=eq.${businessId}`,
  },
  () => {
    // Debounce: wait 2 seconds after last event before reloading
    if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
    reloadTimeoutRef.current = setTimeout(() => {
      loadRealTimeData(supabase, businessId);
    }, 2000);
  },
)

// In the cleanup:
return () => {
  if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
  supabase.removeChannel(channel);
};
```

- [ ] **Step 2: Fix hardcoded growth stats**

In `loadRealTimeData`, the growth stats are hardcoded to `0` with TODO comments (around line 751-758). Calculate actual growth by comparing this month vs last month for customers:

```ts
// After fetching customers count, also count customers added this month vs last month
const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

const [{ count: thisMonthCustomers }, { count: lastMonthCustomers }] = await Promise.all([
  supabase
    .from('customer_businesses')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('created_at', startOfMonth),
  supabase
    .from('customer_businesses')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('created_at', startOfLastMonth)
    .lt('created_at', startOfMonth),
]);

const customersGrowth = lastMonthCustomers
  ? Math.round(((thisMonthCustomers! - lastMonthCustomers) / lastMonthCustomers) * 100)
  : 0;
```

Then use `customersGrowth` in the stats object instead of `0`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/dashboard/page.tsx
git commit -m "fix(perf): debounce realtime reload, calculate actual growth stats"
```

---

## Task 11: Add Sentry Error Monitoring

**Files:**
- Modify: `apps/web/package.json` (add dependency)
- Create: `apps/web/sentry.client.config.ts`
- Create: `apps/web/sentry.server.config.ts`
- Modify: `apps/web/next.config.mjs`

- [ ] **Step 1: Install Sentry**

```bash
cd apps/web && npx @sentry/wizard@latest -i nextjs
```

This wizard will:
- Add `@sentry/nextjs` to `package.json`
- Create `sentry.client.config.ts` and `sentry.server.config.ts`
- Wrap `next.config.mjs` with `withSentryConfig`
- Create `.env.sentry-build-plugin` for the auth token

If the wizard is not available, manually install:

```bash
cd apps/web && npm install @sentry/nextjs
```

Then create minimal config files:

```ts
// apps/web/sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});
```

```ts
// apps/web/sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

- [ ] **Step 2: Add NEXT_PUBLIC_SENTRY_DSN to Vercel env vars**

Create a Sentry project at sentry.io, get the DSN, and add it as `NEXT_PUBLIC_SENTRY_DSN` in Vercel environment variables.

- [ ] **Step 3: Commit**

```bash
git add apps/web/sentry.client.config.ts apps/web/sentry.server.config.ts apps/web/package.json apps/web/next.config.mjs
git commit -m "feat(monitoring): add Sentry error tracking"
```

---

## Task 12: Regenerate Database Types

**Files:**
- Modify: `packages/shared/types/database.ts`

- [ ] **Step 1: Regenerate types**

```bash
npm run db:types
```

This will regenerate `packages/shared/types/database.ts` with the latest schema including `pos_sales`, `sale_items`, `stamp_cards`, `stamp_entries`, `stamp_card_templates`, and the new `add_stamp` function signature with `p_idempotency_key`.

- [ ] **Step 2: Remove `as any` / `as never` casts that are now unnecessary**

After type regeneration, search for and remove casts in:
- `apps/web/lib/services/pos.service.ts` — all `(supabase as any)` casts
- `apps/web/app/api/staff/stamp/redeem-milestone/route.ts` — the `as never` casts

- [ ] **Step 3: Run typecheck**

```bash
cd apps/web && npm run typecheck
```

Fix any new type errors that surface.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/types/database.ts apps/web/lib/services/pos.service.ts apps/web/app/api/staff/stamp/redeem-milestone/route.ts
git commit -m "chore: regenerate DB types, remove as-any casts"
```

---

## Task 13: Mobile — Prompt Before OTA Reload

**Files:**
- Modify: `apps/mobile/app/_layout.tsx:66-80`

- [ ] **Step 1: Replace immediate reload with user prompt**

Replace the OTA update useEffect:

```tsx
const [updateAvailable, setUpdateAvailable] = useState(false);

useEffect(() => {
  if (__DEV__) return;
  (async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        setUpdateAvailable(true);
      }
    } catch {
      // Silent fail — update will apply on next natural restart
    }
  })();
}, []);

// Add a handler to apply the update when user confirms
const handleApplyUpdate = async () => {
  await Updates.reloadAsync();
};
```

Then render a simple banner when `updateAvailable` is true:

```tsx
{updateAvailable && (
  <View style={{ backgroundColor: '#7F0404', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
    <Text style={{ color: 'white', fontSize: 14 }}>Update available</Text>
    <TouchableOpacity onPress={handleApplyUpdate}>
      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Restart Now</Text>
    </TouchableOpacity>
  </View>
)}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/_layout.tsx
git commit -m "fix(mobile): prompt user before applying OTA update instead of force-restarting"
```

---

## Task 14: Mobile — Move Secrets from eas.json to EAS Secrets

**Files:**
- Modify: `apps/mobile/eas.json`

- [ ] **Step 1: Create EAS secrets**

```bash
cd apps/mobile
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://vcddpimnbcsojztbyaso.supabase.co" --scope project
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<the-actual-key>" --scope project
eas secret:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "<the-actual-id>" --scope project
```

- [ ] **Step 2: Remove hardcoded values from eas.json**

Replace the `env` blocks in each profile to reference EAS secrets (which are injected automatically during EAS Build):

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "channel": "development"
    },
    "preview": {
      "distribution": "store",
      "android": { "buildType": "apk" },
      "channel": "preview"
    },
    "production": {
      "autoIncrement": true,
      "channel": "production"
    }
  }
}
```

Note: EAS automatically injects secrets with `EXPO_PUBLIC_` prefix as environment variables during build. No `env` block needed in eas.json.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/eas.json
git commit -m "fix(security): remove hardcoded secrets from eas.json, use EAS secrets"
```

---

## Execution Order

Tasks can be parallelized in groups:

**Group 1 (independent, can run in parallel):**
- Task 1 (SQL migration)
- Task 2 (cron guard)
- Task 3 (shared staff auth)
- Task 6 (rate limiter)
- Task 7 (invite email)

**Group 2 (depends on Task 3):**
- Task 5 (staff page toasts + idempotency — needs shared auth from Task 3)

**Group 3 (independent, can run in parallel):**
- Task 4 (customer scan fix)
- Task 8 (analytics KPIs)
- Task 9 (POS query limits)
- Task 10 (dashboard debounce)

**Group 4 (depends on Task 1 migration being applied):**
- Task 12 (regenerate types — needs new migration applied to get updated function signatures)

**Group 5 (independent):**
- Task 11 (Sentry)
- Task 13 (mobile OTA)
- Task 14 (mobile secrets)

**Final step:** Run `npm run lint && npm run typecheck` from `apps/web` to verify everything compiles.
