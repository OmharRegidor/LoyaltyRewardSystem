# Impersonation Edit Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins start impersonation in an "edit" mode that permits writes (with billing/plan still blocked) after typing a required reason, while keeping today's read-only mode as the default.

**Architecture:** A `mode` field is added to the signed impersonation cookie payload and to the `impersonation_sessions` row. A new unsigned client-readable cookie (`noxa_impersonation_mode`) mirrors it for UX. Four enforcement layers (middleware, Supabase client wrapper, DOM interceptor, CSS) either stand down or apply narrower blocklists when `mode === 'edit'`. The admin dialog gains a mode picker + required reason; the banner flips to amber when editing.

**Tech Stack:** Next.js 16 (App Router), Supabase (Postgres + Auth + Storage), HMAC-signed cookies (WebCrypto), Tailwind v4, shadcn/ui dialogs.

**Spec:** `docs/superpowers/specs/2026-04-23-impersonation-edit-mode-design.md`

**Project conventions:**
- No unit/integration test framework — verification is `npm run lint` + `npm run typecheck` from `apps/web`, plus manual browser test at the end.
- Never use `any` / `as any`. Prefer interfaces.
- Pre-commit: run lint + typecheck; commit only if both pass.

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `supabase/migrations/20260423000000_add_mode_to_impersonation_sessions.sql` | Create | Adds `mode` + `reason` columns to `impersonation_sessions` |
| `packages/shared/types/database.ts` | Modify (regenerated) | Reflects new columns |
| `apps/web/lib/impersonation-signer.ts` | Modify | Adds `mode` to `ImpersonationCookiePayload` and a backward-compat fallback in the decoder |
| `apps/web/lib/impersonation-client.ts` | Modify | Adds `IMPERSONATION_MODE_COOKIE_NAME` constant |
| `apps/web/lib/impersonation.ts` | Modify | `setImpersonationCookies` accepts/sets mode cookie; `clearImpersonationCookies` deletes it |
| `apps/web/app/api/admin/impersonate/route.ts` | Modify | Accepts `mode` + `reason`, validates, persists to session row, encodes into cookie |
| `apps/web/app/auth/impersonate/route.ts` | Modify | Carries `mode` through the activation flow; sets mode display cookie |
| `apps/web/app/api/impersonate/end/route.ts` | Modify | Deletes the mode display cookie |
| `apps/web/middleware.ts` | Modify | Branches on mode — read-only blocks everything, edit blocks billing/plan/admin paths |
| `apps/web/lib/supabase.ts` | Modify | Branches on mode — edit lets writes through except `manual_invoices*` tables and `businesses.update()` with plan/module payload |
| `apps/web/components/admin/admin-users-client.tsx` | Modify | Dialog gets radio group + reason textarea; submits `{ mode, reason }` |
| `apps/web/components/shared/impersonation-banner.tsx` | Modify | Reads mode cookie, renders red vs amber, conditionally installs interceptor, sets `data-impersonation-mode` body attr |
| `apps/web/app/globals.css` | Modify | Scopes dimming selectors to `body[data-impersonation-mode='read_only']` |

---

## Task 1: Database migration — add mode + reason columns

**Files:**
- Create: `supabase/migrations/20260423000000_add_mode_to_impersonation_sessions.sql`

- [ ] **Step 1: Create the migration file**

Write this exact content:

```sql
-- Add mode + reason columns for impersonation edit mode.
-- Existing rows default to 'read_only' so prior behavior is unchanged.
ALTER TABLE public.impersonation_sessions
  ADD COLUMN mode text NOT NULL DEFAULT 'read_only'
    CHECK (mode IN ('read_only', 'edit')),
  ADD COLUMN reason text;

-- reason is required by the API layer when mode='edit'; we do NOT enforce it
-- at the DB layer so read-only sessions can keep reason NULL without tripping
-- a CHECK.

CREATE INDEX idx_impersonation_sessions_mode
  ON public.impersonation_sessions(mode)
  WHERE mode = 'edit';
```

- [ ] **Step 2: Apply migration to dev Supabase**

This project uses Supabase MCP against the dev project (per memory: `womlcxkgguxolrmnxtni`). Use the `mcp__supabase__apply_migration` tool with `name: add_mode_to_impersonation_sessions` and the SQL body above.

Expected: migration applies without error.

- [ ] **Step 3: Verify columns and index exist**

Use `mcp__supabase__execute_sql` to run:

```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'impersonation_sessions'
  AND column_name IN ('mode', 'reason');
```

Expected: 2 rows — `mode (text, 'read_only'::text, NO)`, `reason (text, NULL, YES)`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260423000000_add_mode_to_impersonation_sessions.sql
git commit -m "feat(db): add mode + reason columns to impersonation_sessions"
```

---

## Task 2: Regenerate database types

**Files:**
- Modify: `packages/shared/types/database.ts` (auto-generated)

- [ ] **Step 1: Regenerate types**

From repo root:

```bash
npm run db:types
```

Expected: command exits 0. `packages/shared/types/database.ts` now includes `mode` and `reason` on `impersonation_sessions` Row/Insert/Update.

- [ ] **Step 2: Confirm the change**

```bash
git diff packages/shared/types/database.ts | grep -E "mode|reason" | head
```

Expected: lines showing new `mode` and `reason` fields in the `impersonation_sessions` type.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/types/database.ts
git commit -m "chore(types): regenerate DB types for impersonation mode/reason"
```

---

## Task 3: Extend cookie payload type + add mode cookie name

**Files:**
- Modify: `apps/web/lib/impersonation-signer.ts`
- Modify: `apps/web/lib/impersonation-client.ts`

- [ ] **Step 1: Add `IMPERSONATION_MODE_COOKIE_NAME` constant**

Edit `apps/web/lib/impersonation-client.ts`. Replace the whole file with:

```ts
// apps/web/lib/impersonation-client.ts
// Client-safe constants shared with the server-only impersonation module.

export const IMPERSONATION_COOKIE_NAME = 'noxa_impersonation';
export const IMPERSONATION_DISPLAY_COOKIE_NAME = 'noxa_impersonation_target';
export const IMPERSONATION_MODE_COOKIE_NAME = 'noxa_impersonation_mode';

export type ImpersonationMode = 'read_only' | 'edit';
```

- [ ] **Step 2: Add `mode` to the cookie payload type**

Edit `apps/web/lib/impersonation-signer.ts`. Change the `ImpersonationCookiePayload` interface at lines 5-10 to:

```ts
import type { ImpersonationMode } from './impersonation-client';

export interface ImpersonationCookiePayload {
  sessionId: string;
  adminUserId: string;
  targetUserId: string;
  targetRole: 'business_owner' | 'staff';
  mode: ImpersonationMode;
}
```

- [ ] **Step 3: Make the decoder backward-compatible**

Still in `impersonation-signer.ts`, replace the `decodeImpersonationCookie` function body (lines ~67-86). Keep everything before `return parsed;` the same; change:

```ts
    if (!parsed.sessionId || !parsed.adminUserId || !parsed.targetUserId) return null;
    return parsed;
```

to:

```ts
    if (!parsed.sessionId || !parsed.adminUserId || !parsed.targetUserId) return null;
    // Backward compat: cookies minted before the mode field default to read_only.
    if (parsed.mode !== 'read_only' && parsed.mode !== 'edit') {
      parsed.mode = 'read_only';
    }
    return parsed;
```

- [ ] **Step 4: Lint + typecheck**

```bash
cd apps/web && npm run lint && npm run typecheck
```

Expected: both pass. Warnings OK, errors not.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/impersonation-signer.ts apps/web/lib/impersonation-client.ts
git commit -m "feat(impersonation): add mode field to signed cookie payload"
```

---

## Task 4: Update cookie setters to include mode display cookie

**Files:**
- Modify: `apps/web/lib/impersonation.ts`

- [ ] **Step 1: Update imports + setters**

Replace the whole file contents (`apps/web/lib/impersonation.ts`) with:

```ts
// apps/web/lib/impersonation.ts
// Server-only helpers for impersonation: cookie setting, opaque token generation, hashing.
// Cookie signing/verification lives in ./impersonation-signer so it is edge-compatible.

import crypto from 'crypto';
import { cookies } from 'next/headers';
import {
  IMPERSONATION_COOKIE_NAME,
  IMPERSONATION_DISPLAY_COOKIE_NAME,
  IMPERSONATION_MODE_COOKIE_NAME,
  type ImpersonationMode,
} from './impersonation-client';
import {
  encodeImpersonationCookie,
  type ImpersonationCookiePayload,
} from './impersonation-signer';

export type { ImpersonationCookiePayload } from './impersonation-signer';
export {
  encodeImpersonationCookie,
  decodeImpersonationCookie,
} from './impersonation-signer';
export {
  IMPERSONATION_COOKIE_NAME,
  IMPERSONATION_DISPLAY_COOKIE_NAME,
  IMPERSONATION_MODE_COOKIE_NAME,
};
export type { ImpersonationMode };

export function generateOpaqueToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export function hashOpaqueToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function setImpersonationCookies(
  payload: ImpersonationCookiePayload,
  displayEmail: string,
): Promise<void> {
  const store = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  const encoded = await encodeImpersonationCookie(payload);
  store.set(IMPERSONATION_COOKIE_NAME, encoded, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
  });
  store.set(IMPERSONATION_DISPLAY_COOKIE_NAME, displayEmail, {
    httpOnly: false,
    sameSite: 'lax',
    secure,
    path: '/',
  });
  store.set(IMPERSONATION_MODE_COOKIE_NAME, payload.mode, {
    httpOnly: false,
    sameSite: 'lax',
    secure,
    path: '/',
  });
}

export async function clearImpersonationCookies(): Promise<void> {
  const store = await cookies();
  store.delete(IMPERSONATION_COOKIE_NAME);
  store.delete(IMPERSONATION_DISPLAY_COOKIE_NAME);
  store.delete(IMPERSONATION_MODE_COOKIE_NAME);
}
```

- [ ] **Step 2: Lint + typecheck**

```bash
cd apps/web && npm run lint && npm run typecheck
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/impersonation.ts
git commit -m "feat(impersonation): set/clear mode display cookie alongside signed cookie"
```

---

## Task 5: Accept `mode` + `reason` in the start-impersonation API

**Files:**
- Modify: `apps/web/app/api/admin/impersonate/route.ts`

- [ ] **Step 1: Add types + validation**

Replace the `Body` interface (lines 7-9) with:

```ts
type ImpersonationModeInput = 'read_only' | 'edit';

interface Body {
  targetUserId: string;
  mode: ImpersonationModeInput;
  reason?: string;
}

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;
```

- [ ] **Step 2: Validate the request body**

In the `POST` handler, replace the existing body check (currently lines ~23-26):

```ts
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body?.targetUserId) {
    return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
  }
```

with:

```ts
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body?.targetUserId) {
    return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
  }
  if (body.mode !== 'read_only' && body.mode !== 'edit') {
    return NextResponse.json({ error: 'invalid_mode' }, { status: 400 });
  }
  const reasonTrimmed = (body.reason ?? '').trim();
  if (body.mode === 'edit' && reasonTrimmed.length < MIN_REASON_LENGTH) {
    return NextResponse.json({ error: 'reason_required' }, { status: 400 });
  }
  const reasonToStore =
    body.mode === 'edit' ? reasonTrimmed.slice(0, MAX_REASON_LENGTH) : null;
```

- [ ] **Step 3: Persist mode + reason to the session row**

Find the `.from('impersonation_sessions').insert({...})` call (around lines 71-85). Add two fields to the insert object:

```ts
      mode: body.mode,
      reason: reasonToStore,
```

Place them alongside the existing fields — order doesn't matter. Example of final insert:

```ts
  const { data: session, error: insertError } = await service
    .from('impersonation_sessions')
    .insert({
      admin_user_id: admin.id,
      admin_email: admin.email,
      target_user_id: profile.id,
      target_email: targetEmail,
      target_role: role,
      opaque_token_hash: tokenHash,
      magic_otp: linkData.properties.email_otp,
      expires_at: expiresAt,
      ip_address: getClientIp(request),
      user_agent: request.headers.get('user-agent'),
      mode: body.mode,
      reason: reasonToStore,
    })
    .select('id')
    .single();
```

- [ ] **Step 4: Lint + typecheck**

```bash
cd apps/web && npm run lint && npm run typecheck
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/admin/impersonate/route.ts
git commit -m "feat(impersonation): accept mode + reason in start-impersonation API"
```

---

## Task 6: Carry mode through the activation route

**Files:**
- Modify: `apps/web/app/auth/impersonate/route.ts`

- [ ] **Step 1: Import the new cookie constant**

At the top of `apps/web/app/auth/impersonate/route.ts`, update the import block (lines 4-9) to:

```ts
import {
  encodeImpersonationCookie,
  hashOpaqueToken,
  IMPERSONATION_COOKIE_NAME,
  IMPERSONATION_DISPLAY_COOKIE_NAME,
  IMPERSONATION_MODE_COOKIE_NAME,
} from '@/lib/impersonation';
```

- [ ] **Step 2: Encode `mode` into the signed cookie**

Find the `encodeImpersonationCookie({...})` call (around lines 92-97). Update it to read `mode` off the session row:

```ts
  const sessionMode = session.mode === 'edit' ? 'edit' : 'read_only';
  const encoded = await encodeImpersonationCookie({
    sessionId: session.id,
    adminUserId: session.admin_user_id,
    targetUserId: session.target_user_id,
    targetRole: session.target_role as 'business_owner' | 'staff',
    mode: sessionMode,
  });
```

- [ ] **Step 3: Set the mode display cookie on the response**

Immediately after the existing `response.cookies.set(IMPERSONATION_DISPLAY_COOKIE_NAME, ...)` block (around lines 104-109), add:

```ts
  response.cookies.set(IMPERSONATION_MODE_COOKIE_NAME, sessionMode, {
    httpOnly: false,
    sameSite: 'lax',
    secure,
    path: '/',
  });
```

- [ ] **Step 4: Lint + typecheck**

```bash
cd apps/web && npm run lint && npm run typecheck
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/auth/impersonate/route.ts
git commit -m "feat(impersonation): carry mode through activation and display cookie"
```

---

## Task 7: Clear mode display cookie on end

**Files:**
- Modify: `apps/web/app/api/impersonate/end/route.ts`

- [ ] **Step 1: Import the mode cookie constant**

Change the existing import block (lines 4-8):

```ts
import {
  IMPERSONATION_COOKIE_NAME,
  IMPERSONATION_DISPLAY_COOKIE_NAME,
  IMPERSONATION_MODE_COOKIE_NAME,
  decodeImpersonationCookie,
} from '@/lib/impersonation';
```

- [ ] **Step 2: Delete the cookie on the response**

After the two existing `response.cookies.delete(...)` lines (around lines 45-46), add:

```ts
  response.cookies.delete(IMPERSONATION_MODE_COOKIE_NAME);
```

- [ ] **Step 3: Lint + typecheck**

```bash
cd apps/web && npm run lint && npm run typecheck
```

Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/api/impersonate/end/route.ts
git commit -m "feat(impersonation): clear mode display cookie on end"
```

---

## Task 8: Middleware — edit mode blocklist

**Files:**
- Modify: `apps/web/middleware.ts`

- [ ] **Step 1: Add the edit-mode blocked paths list**

Near the top of the file (after the existing `IMPERSONATION_ALLOWED_WRITE_PATHS` declaration at line 10-12), add:

```ts
const EDIT_MODE_BLOCKED_WRITE_PATHS = [
  '/api/billing/',
  '/api/admin/',
  '/api/manual-invoices/',
];

function isEditModeBlocked(pathname: string): boolean {
  return EDIT_MODE_BLOCKED_WRITE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p),
  );
}
```

- [ ] **Step 2: Branch on mode in the impersonation block**

Replace the existing impersonation block (lines 121-136):

```ts
  // Impersonation: read-only enforcement
  const impersonationPayload = await decodeImpersonationCookie(
    request.cookies.get(IMPERSONATION_COOKIE_NAME)?.value,
  );
  const isImpersonating = impersonationPayload !== null;

  if (isImpersonating) {
    const method = request.method.toUpperCase();
    const isWrite = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
    if (isWrite && !isImpersonationAllowedWrite(pathname)) {
      return new NextResponse(
        JSON.stringify({ error: 'Read-only during impersonation' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }
```

with:

```ts
  // Impersonation: enforce mode-aware write rules.
  const impersonationPayload = await decodeImpersonationCookie(
    request.cookies.get(IMPERSONATION_COOKIE_NAME)?.value,
  );

  if (impersonationPayload) {
    const method = request.method.toUpperCase();
    const isWrite = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
    if (isWrite) {
      const alwaysAllowed = isImpersonationAllowedWrite(pathname);
      if (!alwaysAllowed) {
        if (impersonationPayload.mode === 'read_only') {
          return new NextResponse(
            JSON.stringify({ error: 'Read-only during impersonation' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (impersonationPayload.mode === 'edit' && isEditModeBlocked(pathname)) {
          return new NextResponse(
            JSON.stringify({ error: 'Blocked: billing and plan endpoints are off-limits during impersonation edit mode' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } },
          );
        }
      }
    }
  }
```

- [ ] **Step 3: Lint + typecheck**

```bash
cd apps/web && npm run lint && npm run typecheck
```

Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/middleware.ts
git commit -m "feat(impersonation): branch middleware on mode; edit-mode billing/admin blocklist"
```

---

## Task 9: Supabase client wrapper — partial allowance in edit mode

**Files:**
- Modify: `apps/web/lib/supabase.ts`

- [ ] **Step 1: Replace the wrapper's impersonation check + builder logic**

Replace the whole content of `apps/web/lib/supabase.ts` with:

```ts
// apps/web/lib/supabase.ts

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../../../packages/shared/types/database';
import {
  IMPERSONATION_DISPLAY_COOKIE_NAME,
  IMPERSONATION_MODE_COOKIE_NAME,
  type ImpersonationMode,
} from './impersonation-client';

// Writes are blocked at multiple layers during impersonation:
//   1. Next.js middleware blocks POST/PUT/PATCH/DELETE on our own routes.
//   2. This wrapper intercepts direct client-side Supabase mutations
//      (.update/.insert/.delete/.upsert) that would otherwise bypass (1)
//      by going straight to the Supabase REST endpoint.
//
// In read-only mode every mutation is blocked. In edit mode, writes pass
// through EXCEPT writes to billing tables, and `businesses.update()` payloads
// that attempt to change plan / module flags.

const BLOCKED_METHODS = new Set(['update', 'insert', 'delete', 'upsert']);
const EDIT_MODE_BLOCKED_TABLES = new Set([
  'manual_invoices',
  'manual_invoice_payments',
]);
const BUSINESSES_PROTECTED_COLUMNS = new Set(['plan', 'has_loyalty', 'has_pos']);

interface ImpersonationState {
  active: boolean;
  mode: ImpersonationMode;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(prefix));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    return null;
  }
}

function getImpersonationState(): ImpersonationState {
  const active = readCookie(IMPERSONATION_DISPLAY_COOKIE_NAME) !== null;
  if (!active) return { active: false, mode: 'read_only' };
  const modeRaw = readCookie(IMPERSONATION_MODE_COOKIE_NAME);
  const mode: ImpersonationMode = modeRaw === 'edit' ? 'edit' : 'read_only';
  return { active: true, mode };
}

function blockedBuilder(method: string, reason: string): unknown {
  const error = {
    message: `Blocked: cannot ${method} during impersonation (${reason}).`,
    code: 'impersonation_blocked',
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rejection: any = Promise.resolve({ data: null, error });
  rejection.then = rejection.then.bind(rejection);
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return rejection[prop as keyof typeof rejection];
      }
      return () => new Proxy({}, handler);
    },
  };
  return new Proxy({}, handler);
}

function wrapFromBuilder(builder: unknown, table: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Proxy(builder as any, {
    get(target, prop, receiver) {
      if (typeof prop !== 'string' || !BLOCKED_METHODS.has(prop)) {
        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      }
      const state = getImpersonationState();
      if (!state.active) {
        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      }
      if (state.mode === 'read_only') {
        return () => blockedBuilder(prop, 'read-only mode');
      }
      // state.mode === 'edit'
      if (EDIT_MODE_BLOCKED_TABLES.has(table)) {
        return () => blockedBuilder(prop, 'billing tables are off-limits in edit mode');
      }
      if (table === 'businesses' && prop === 'update') {
        const original = Reflect.get(target, prop, receiver) as (payload: Record<string, unknown>) => unknown;
        return (payload: Record<string, unknown>) => {
          const keys = payload ? Object.keys(payload) : [];
          const touchesProtected = keys.some((k) => BUSINESSES_PROTECTED_COLUMNS.has(k));
          if (touchesProtected) {
            return blockedBuilder('update', 'plan/module flags are off-limits in edit mode');
          }
          return original.call(target, payload);
        };
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

// ============================================
// BROWSER CLIENT (for client components)
// ============================================
export function createClient() {
  const raw = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const originalFrom = raw.from.bind(raw);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (raw as any).from = (table: string) =>
    wrapFromBuilder(originalFrom(table as never), table);

  // Block storage mutations in read-only only. In edit mode, logo uploads on
  // behalf of the owner are a valid use case.
  const STORAGE_BLOCKED = new Set(['upload', 'update', 'remove', 'move', 'copy', 'createSignedUploadUrl']);
  const originalStorageFrom = raw.storage.from.bind(raw.storage);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (raw.storage as any).from = (bucket: string) => {
    const bucketApi = originalStorageFrom(bucket);
    return new Proxy(bucketApi, {
      get(target, prop, receiver) {
        if (typeof prop === 'string' && STORAGE_BLOCKED.has(prop)) {
          const state = getImpersonationState();
          if (state.active && state.mode === 'read_only') {
            return () =>
              Promise.resolve({
                data: null,
                error: {
                  message: `Blocked: cannot ${prop} during impersonation (read-only mode).`,
                  code: 'impersonation_read_only',
                },
              });
          }
        }
        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  };

  return raw;
}

// Type exports
export type SupabaseClient = ReturnType<typeof createClient>;
export type { Database };
```

- [ ] **Step 2: Lint + typecheck**

```bash
cd apps/web && npm run lint && npm run typecheck
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/supabase.ts
git commit -m "feat(impersonation): edit-mode partial allowance in Supabase client wrapper"
```

---

## Task 10: Admin users dialog — mode picker + reason

**Files:**
- Modify: `apps/web/components/admin/admin-users-client.tsx`

- [ ] **Step 1: Update local state + imports**

Replace the `impersonateTarget` + `impersonating` state declarations (lines 60-63) with:

```tsx
  const [impersonateTarget, setImpersonateTarget] = useState<
    { userId: string; email: string; role: string } | null
  >(null);
  const [impersonating, setImpersonating] = useState(false);
  const [mode, setMode] = useState<'read_only' | 'edit'>('read_only');
  const [reason, setReason] = useState('');
  const REASON_MIN_LENGTH = 10;
```

- [ ] **Step 2: Reset new fields when the dialog closes**

Find the `onOpenChange` on the `AlertDialog` (around line 265). Replace it with:

```tsx
        onOpenChange={(open) => {
          if (!open && !impersonating) {
            setImpersonateTarget(null);
            setMode('read_only');
            setReason('');
          }
        }}
```

- [ ] **Step 3: Submit mode + reason in the POST body**

Replace the body of `handleImpersonate` (lines 96-118) with:

```tsx
  const handleImpersonate = async () => {
    if (!impersonateTarget || impersonating) return;
    if (mode === 'edit' && reason.trim().length < REASON_MIN_LENGTH) return;
    setImpersonating(true);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: impersonateTarget.userId,
          mode,
          reason: mode === 'edit' ? reason.trim() : undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Failed to start impersonation');
      }
      const payload = (await res.json()) as { activationUrl: string };
      window.open(payload.activationUrl, '_blank', 'noopener,noreferrer');
      setImpersonateTarget(null);
      setMode('read_only');
      setReason('');
      toast.success('Impersonation link opened in a new tab');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start impersonation');
    } finally {
      setImpersonating(false);
    }
  };
```

- [ ] **Step 4: Replace the dialog body**

Replace the `<AlertDialogDescription asChild>` block (lines 273-285) with mode-aware content. The dialog now contains a radio group, a conditional reason textarea, and a submit button gated on the reason length. Replace the entire `<AlertDialog>` JSX (from line 263 through the closing `</AlertDialog>`) with:

```tsx
      <AlertDialog
        open={!!impersonateTarget}
        onOpenChange={(open) => {
          if (!open && !impersonating) {
            setImpersonateTarget(null);
            setMode('read_only');
            setReason('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Login as {impersonateTarget?.email}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You will be signed in as this {impersonateTarget?.role === 'business_owner' ? 'business owner' : 'staff member'} in a new tab.
                </p>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-gray-900">Mode</legend>
                  <label className="flex items-start gap-2 cursor-pointer rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50">
                    <input
                      type="radio"
                      name="impersonation-mode"
                      value="read_only"
                      checked={mode === 'read_only'}
                      onChange={() => setMode('read_only')}
                      className="mt-0.5"
                    />
                    <span className="text-sm">
                      <span className="font-medium">Read-only</span>{' '}
                      <span className="text-gray-500">(recommended)</span>
                      <span className="block text-xs text-gray-500">
                        View only — no writes allowed.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50">
                    <input
                      type="radio"
                      name="impersonation-mode"
                      value="edit"
                      checked={mode === 'edit'}
                      onChange={() => setMode('edit')}
                      className="mt-0.5"
                    />
                    <span className="text-sm">
                      <span className="font-medium text-amber-700">Edit mode</span>
                      <span className="block text-xs text-gray-500">
                        Writes are saved as this user. Billing and plan changes are still blocked.
                      </span>
                    </span>
                  </label>
                </fieldset>
                {mode === 'edit' && (
                  <div className="space-y-1">
                    <label htmlFor="impersonation-reason" className="text-sm font-medium text-gray-900">
                      Reason (required)
                    </label>
                    <textarea
                      id="impersonation-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g., Owner requested update to store hours"
                      rows={3}
                      maxLength={500}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                    <p className="text-xs text-gray-500">
                      Your reason is saved to the audit log. Minimum {REASON_MIN_LENGTH} characters.
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  This action is logged. The activation link expires in 5 minutes and can only be used once.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={impersonating}>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={handleImpersonate}
                disabled={
                  impersonating ||
                  (mode === 'edit' && reason.trim().length < REASON_MIN_LENGTH)
                }
              >
                {impersonating && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                Open impersonation tab
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
```

- [ ] **Step 5: Lint + typecheck**

```bash
cd apps/web && npm run lint && npm run typecheck
```

Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/admin/admin-users-client.tsx
git commit -m "feat(admin): mode picker + reason field in impersonation dialog"
```

---

## Task 11: Impersonation banner — mode-aware visuals + conditional interceptor

**Files:**
- Modify: `apps/web/components/shared/impersonation-banner.tsx`

- [ ] **Step 1: Replace the whole banner component**

Replace the full content of `apps/web/components/shared/impersonation-banner.tsx` with:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, LogOut, Loader2 } from 'lucide-react';
import {
  IMPERSONATION_DISPLAY_COOKIE_NAME,
  IMPERSONATION_MODE_COOKIE_NAME,
  type ImpersonationMode,
} from '@/lib/impersonation-client';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(prefix));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    return null;
  }
}

function readMode(): ImpersonationMode {
  const raw = readCookie(IMPERSONATION_MODE_COOKIE_NAME);
  return raw === 'edit' ? 'edit' : 'read_only';
}

export function ImpersonationBanner() {
  const [email, setEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<ImpersonationMode>('read_only');
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    const check = () => {
      setEmail(readCookie(IMPERSONATION_DISPLAY_COOKIE_NAME));
      setMode(readMode());
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  // Toggle body attributes so global CSS can scope dimming to read-only only.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (email) {
      document.body.setAttribute('data-impersonation', 'true');
      document.body.setAttribute('data-impersonation-mode', mode);
      document.body.style.paddingTop = '52px';
    } else {
      document.body.removeAttribute('data-impersonation');
      document.body.removeAttribute('data-impersonation-mode');
      document.body.style.paddingTop = '';
    }
    return () => {
      document.body.removeAttribute('data-impersonation');
      document.body.removeAttribute('data-impersonation-mode');
      document.body.style.paddingTop = '';
    };
  }, [email, mode]);

  // Capture-phase interceptor: only installed in read-only mode. In edit mode
  // writes flow to their handlers normally.
  useEffect(() => {
    if (typeof document === 'undefined' || !email || mode !== 'read_only') return;

    const isBlocked = (el: Element | null): boolean => {
      if (!el) return false;
      const allowed = el.closest('[data-allow-during-impersonation]');
      if (allowed) return false;
      const anchor = el.closest('a');
      if (anchor && !anchor.hasAttribute('data-write-action')) return false;
      const blocker = el.closest(
        'button, input, select, textarea, label, [role="button"], [role="menuitem"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [contenteditable="true"], [onclick], [data-write-action]',
      );
      return blocker !== null;
    };

    const block = (e: Event) => {
      if (!isBlocked(e.target as Element | null)) return;
      e.preventDefault();
      e.stopPropagation();
    };

    const events: (keyof DocumentEventMap)[] = [
      'click',
      'mousedown',
      'mouseup',
      'submit',
      'input',
      'change',
      'keydown',
      'keypress',
      'keyup',
    ];
    events.forEach((evt) => document.addEventListener(evt, block, true));
    return () => {
      events.forEach((evt) => document.removeEventListener(evt, block, true));
    };
  }, [email, mode]);

  if (!email) return null;

  const handleEnd = async () => {
    if (ending) return;
    setEnding(true);
    try {
      await fetch('/api/impersonate/end', { method: 'POST' });
      window.location.href = '/login';
    } catch {
      setEnding(false);
    }
  };

  const bannerClass =
    mode === 'edit'
      ? 'bg-amber-600 text-white'
      : 'bg-red-600 text-white';
  const message =
    mode === 'edit'
      ? `Editing as ${email} — changes are saved as this user`
      : `You are viewing as ${email} — read-only mode`;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2.5 flex items-center justify-between gap-3 shadow-md ${bannerClass}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
        <p className="text-sm truncate">{message}</p>
      </div>
      <button
        onClick={handleEnd}
        disabled={ending}
        data-allow-during-impersonation
        className="inline-flex items-center gap-1.5 text-sm font-medium bg-white/15 hover:bg-white/25 disabled:opacity-60 disabled:cursor-not-allowed rounded-md px-3 py-1.5 transition-colors shrink-0"
      >
        {ending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
        End impersonation
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Lint + typecheck**

```bash
cd apps/web && npm run lint && npm run typecheck
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/shared/impersonation-banner.tsx
git commit -m "feat(impersonation): mode-aware banner with amber edit-mode styling"
```

---

## Task 12: Scope dimming CSS to read-only mode

**Files:**
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Update the impersonation dimming selectors**

In `apps/web/app/globals.css`, find the two `body[data-impersonation='true']` selectors (around lines 268 and 280-281). Change them to target the new `data-impersonation-mode` attribute scoped to `read_only`:

Replace:

```css
body[data-impersonation='true'] :where(
  button,
  [role='button'],
  [type='submit'],
  [data-write-action]
) {
  opacity: 0.55 !important;
  cursor: not-allowed !important;
}
```

with:

```css
body[data-impersonation-mode='read_only'] :where(
  button,
  [role='button'],
  [type='submit'],
  [data-write-action]
) {
  opacity: 0.55 !important;
  cursor: not-allowed !important;
}
```

And replace:

```css
body[data-impersonation='true'] [data-allow-during-impersonation],
body[data-impersonation='true'] [data-allow-during-impersonation] * {
  opacity: 1 !important;
  cursor: pointer !important;
}
```

with:

```css
body[data-impersonation-mode='read_only'] [data-allow-during-impersonation],
body[data-impersonation-mode='read_only'] [data-allow-during-impersonation] * {
  opacity: 1 !important;
  cursor: pointer !important;
}
```

- [ ] **Step 2: Lint + typecheck**

```bash
cd apps/web && npm run lint && npm run typecheck
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/globals.css
git commit -m "feat(impersonation): scope dimming CSS to read-only mode only"
```

---

## Task 13: Manual end-to-end verification

No code changes — this is the verification step before considering the feature done. Run the dev server and walk through both modes in a browser.

- [ ] **Step 1: Start the dev server**

From repo root:

```bash
npm run dev:web
```

Expected: `http://localhost:3000` serves the app.

- [ ] **Step 2: Verify read-only mode still works**

1. Log in as an admin, go to `/admin/users`.
2. Click **Login as** on any business owner row.
3. In the dialog, **Read-only** is pre-selected. No reason textarea is visible.
4. Click **Open impersonation tab**.
5. In the new tab: banner is **red**, text says "You are viewing as X — read-only mode".
6. Try clicking a write button (e.g., edit a reward, toggle a setting). It should be visually dimmed and the click should be blocked.
7. Try a direct Supabase write via devtools: `supabase.from('rewards').update({...}).eq('id','...')` — expect `error.code === 'impersonation_blocked'`.
8. Click **End impersonation** — redirected to `/login`. All three impersonation cookies are gone.

- [ ] **Step 3: Verify edit mode works**

1. Back in admin tab, click **Login as** on the same business owner.
2. Select **Edit mode**. Reason textarea appears. Type "Owner requested we update store hours" (>10 chars).
3. Click **Open impersonation tab**.
4. In the new tab: banner is **amber**, text says "Editing as X — changes are saved as this user".
5. Edit something non-billing (e.g., update store name, add a reward). It should succeed.
6. Try to change the plan via the billing page — attempted POST returns 403 with `edit_mode_blocked` message.
7. Try a direct Supabase write to `manual_invoices` — expect `error.code === 'impersonation_blocked'`.
8. Try a direct Supabase `from('businesses').update({ plan: 'enterprise' })` — expect `error.code === 'impersonation_blocked'`.
9. Try `from('businesses').update({ name: 'New name' })` — expect success.
10. Click **End impersonation** — redirected to `/login`.

- [ ] **Step 4: Verify reason validation**

1. Click **Login as** again. Select **Edit mode**. Leave reason empty or under 10 chars.
2. **Open impersonation tab** button is disabled.
3. Type exactly 9 chars — still disabled.
4. Type 10+ chars — button enables.

- [ ] **Step 5: Verify audit trail**

Via `mcp__supabase__execute_sql`:

```sql
SELECT id, admin_email, target_email, mode, reason, created_at
FROM public.impersonation_sessions
ORDER BY created_at DESC
LIMIT 5;
```

Expected: the two sessions you just created show up with the right `mode` and (for edit) `reason`.

- [ ] **Step 6: Final commit (no code, just confirmation)**

If the manual test surfaces a bug, fix it and commit the fix before marking the plan done. Otherwise, no further commit.

---

## Self-Review Notes

- Every spec section is covered: data model (Task 1+2+3), API (Task 5), activation (Task 6), end (Task 7), enforcement layers 1-4 (Tasks 8, 9, 11, 12), UI dialog (Task 10), banner (Task 11), audit trail (verified in Task 13 Step 5).
- No `any` introduced in new code; two pre-existing `eslint-disable`s for `any` in `supabase.ts` are carried over because the Supabase proxy genuinely needs them — no new `any`s.
- Backward compatibility: Task 3 adds a fallback so pre-deploy sessions still decode (treated as read-only).
- Non-goals remain non-goals: no per-write audit log fan-out, no mid-session toggle, no new admin roles, no auto-downgrade timer.
