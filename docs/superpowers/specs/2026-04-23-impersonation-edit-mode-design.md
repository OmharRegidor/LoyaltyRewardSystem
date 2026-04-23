# Impersonation Edit Mode — Design

**Date:** 2026-04-23
**Status:** Draft, pending implementation

## Problem

Admins can impersonate business owners and staff today, but only in read-only mode. When a non-technical or time-constrained business owner asks the support team to update their account (store hours, stamp configs, reward catalog, etc.), the team has no in-product path to do it on their behalf. The team needs a way to make real changes during an impersonation session while preserving a clear audit trail.

## Goals

- Allow admins to enter impersonation in an **edit mode** that permits writes.
- Require a typed reason before entering edit mode; log it.
- Prevent accidental billing / plan changes during edit-mode impersonation.
- Keep the existing read-only mode as the default and recommended option.
- Make the mode visually obvious so an admin never forgets which mode they're in.

## Non-goals

- Mid-session mode switching (must end and restart to change modes).
- Per-write audit log fan-out (session-window reconciliation is sufficient).
- New admin roles or role plumbing (any admin can use edit mode today).
- Auto-expiry of edit mode beyond the existing cookie lifetime.
- Changing how read-only impersonation currently works.

## User flow

1. Admin opens `/admin/users`, clicks **Login as** on a business owner or staff row.
2. Confirmation dialog shows. Admin picks **Read-only** (default) or **Edit mode**.
3. If **Edit mode** is picked, a **Reason** textarea appears and is required (min 10 chars).
4. Admin clicks **Open impersonation tab**. New tab opens with the target user's session.
5. Banner at the top of the app reflects the mode:
   - `read_only` — red banner, "You are viewing as X — read-only mode".
   - `edit` — amber banner, "Editing as X — changes are saved as this user".
6. In edit mode, writes flow normally **except** for billing / plan / module-flag writes, which are blocked at all layers.
7. Admin clicks **End impersonation** — cookies clear, session is marked ended.

## Data model

### `ImpersonationCookiePayload` (signed cookie)

File: `apps/web/lib/impersonation-signer.ts`

```ts
interface ImpersonationCookiePayload {
  sessionId: string;
  adminUserId: string;
  targetUserId: string;
  targetRole: 'business_owner' | 'staff';
  mode: 'read_only' | 'edit';  // NEW
}
```

HMAC signature already covers the payload, so `mode` cannot be forged client-side.

### `impersonation_sessions` table

Add two columns:

```sql
alter table impersonation_sessions
  add column mode text not null default 'read_only'
    check (mode in ('read_only', 'edit')),
  add column reason text;
```

- `mode` — defaults to `read_only` for migration safety; all existing rows keep current behavior.
- `reason` — nullable. Enforced as required (non-empty, min 10 chars trimmed) at the API layer only when `mode = 'edit'`. Not enforced via CHECK because read-only sessions legitimately have no reason.

### `impersonation_logs` table

Unchanged. The `initiated` event row already carries `session_id`, so mode and reason are reachable via the FK to `impersonation_sessions`.

### Display-only cookie: `noxa_impersonation_mode`

A new non-signed, client-readable cookie carrying the literal string `read_only` or `edit`. Used **only** as a UX hint by the banner and the Supabase client wrapper. The signed cookie remains the source of truth for middleware enforcement.

## API changes

### `POST /api/admin/impersonate`

File: `apps/web/app/api/admin/impersonate/route.ts`

Request body:

```ts
interface Body {
  targetUserId: string;
  mode: 'read_only' | 'edit';
  reason?: string;
}
```

Validation (before touching Supabase):

- `mode` is required and must be `'read_only'` or `'edit'`. Otherwise → `400 invalid_mode`.
- When `mode === 'edit'`, `reason` must be present and `reason.trim().length >= 10`. Otherwise → `400 reason_required`.

Persistence:

- `impersonation_sessions` insert includes `mode` and `reason` (reason is `null` for read-only sessions).
- Signed cookie is encoded with `mode`.
- Display cookie set (unchanged — email).
- New display-only `noxa_impersonation_mode` cookie set with the mode string.

Response shape: unchanged (`{ activationUrl, targetEmail, targetRole, expiresAt }`). Mode is not echoed; it's in the signed cookie.

Rate limit: unchanged (10 per 10 min per admin).

### `POST /api/impersonate/end`

Unchanged behavior. Clears all impersonation cookies including the new mode cookie.

### `GET /auth/impersonate`

Unchanged. The activation route already consumes the opaque token and calls `setImpersonationCookies`. It needs to additionally set the `noxa_impersonation_mode` display cookie, reading the mode from the session row it's activating.

## Enforcement layers

Four layers enforce read-only today. In edit mode, each either stands down or applies a narrower blocklist.

### Layer 1 — Next.js middleware

File: `apps/web/middleware.ts`

Current behavior: if `isImpersonating`, block all POST/PUT/PATCH/DELETE except `/api/impersonate/end`.

New behavior:

- `mode === 'read_only'` → unchanged (block all writes except allowlist).
- `mode === 'edit'` → allow writes, with a blocklist:
  ```ts
  const EDIT_MODE_BLOCKED_WRITE_PATHS = [
    '/api/billing/',
    '/api/manual-invoices/',
    '/api/admin/',
  ];
  ```
  Any write to a path starting with these strings → `403 edit_mode_blocked`.

### Layer 2 — Supabase client wrapper

File: `apps/web/lib/supabase.ts`

Current behavior: when the display cookie is present, `.insert()`, `.update()`, `.delete()`, and storage mutations are replaced with blocked builders.

New behavior:

- Wrapper reads `noxa_impersonation_mode` (the unsigned display cookie) in addition to the existing display cookie.
- `mode === 'read_only'` → unchanged (block all writes).
- `mode === 'edit'` → writes flow normally, with two exceptions:
  - `.from('manual_invoices')` and `.from('manual_invoice_payments')` — writes blocked.
  - `.from('businesses').update(payload)` — if `payload` contains any of `plan`, `has_loyalty`, `has_pos`, the update is blocked. Other `businesses` updates pass through.

Storage mutations pass through in edit mode (uploading a logo on behalf of the owner is a legitimate use case).

### Layer 3 — DOM interceptor

File: `apps/web/components/shared/impersonation-banner.tsx`

Current behavior: capture-phase event blocker on click/mousedown/submit/input/change/keydown/keypress/keyup for buttons, inputs, selects, textareas, labels, role="button", etc.

New behavior:

- `mode === 'read_only'` → interceptor active, unchanged.
- `mode === 'edit'` → interceptor is **not installed**. Writes flow to their handlers.

### Layer 4 — CSS

File: `apps/web/app/globals.css`

Current behavior: `body[data-impersonation='true']` dims all interactive elements and shows `not-allowed` cursor.

New behavior:

- Banner sets `data-impersonation-mode` on `body` (`'read_only'` or `'edit'`).
- Selector becomes `body[data-impersonation-mode='read_only']`. Edit mode does not trigger dimming.

## UI changes

### Confirmation dialog

File: `apps/web/components/admin/admin-users-client.tsx`

- Radio group inside the existing `AlertDialog`: **Read-only (recommended)** / **Edit mode**.
- When **Edit mode** is selected:
  - Reveal a `textarea` labeled **Reason** with placeholder `e.g., Owner requested update to store hours`.
  - Required; disables the submit button until `reason.trim().length >= 10`.
  - Helper text below: "Your reason is saved to the audit log."
- Mode-aware dialog body:
  - Read-only: current copy — "you will not be able to create, update, or delete anything".
  - Edit mode: "Edit mode — writes will be saved as this user. Billing and plan changes are still blocked. This session is logged with your reason."
- Submit handler: POSTs `{ targetUserId, mode, reason }` to `/api/admin/impersonate`.

### Banner

File: `apps/web/components/shared/impersonation-banner.tsx`

- Reads `noxa_impersonation_mode` alongside the existing display cookie.
- `read_only` — red background (`bg-red-600`, unchanged), text "You are viewing as X — read-only mode".
- `edit` — amber background (`bg-amber-600`), text "Editing as X — changes are saved as this user".
- Sets `body[data-impersonation-mode]` based on the mode.
- Capture-phase interceptor only installs when `mode === 'read_only'`.
- End-impersonation button unchanged.

## Audit trail

- On start: `impersonation_sessions` row has `mode` and `reason`. Standard `impersonation_logs.initiated` event is created; no schema change to logs.
- On end: standard `impersonation_logs.ended` event (unchanged).
- To reconcile "what did admin X change as owner Y in edit mode": query `impersonation_sessions` with `mode='edit'` filter + admin/target, then join against the row `updated_at` timestamps on business tables within `[started_at, ended_at]` window.

## Migration

- DB migration adds `mode` (default `'read_only'`) and `reason` (nullable) columns to `impersonation_sessions`. Zero impact on in-flight sessions.
- Existing cookies (no `mode` field) — the decoder treats absence as `'read_only'` for backward compatibility during rollout. No active sessions should straddle the deploy because sessions only last the length of a browser visit.
- The new `noxa_impersonation_mode` display cookie is missing on old sessions — treated as `'read_only'`.

## Security considerations

- Mode is in the HMAC-signed cookie; a client cannot upgrade themselves to edit mode.
- The display-only mode cookie is for UX only. All write enforcement uses the signed cookie via middleware or server-side validation.
- Edit mode still cannot touch billing, plan, module flags, or other admin endpoints — prevents admins from effectively "authorizing themselves" into a higher plan by impersonating.
- Reason is stored verbatim; recommend truncation or length cap at the API layer (e.g., 500 chars) to avoid abuse.
- Rate limit unchanged — 10 impersonation starts per 10 min per admin, whether read-only or edit.

## Out of scope (explicitly deferred)

- Per-write audit log rows (would be Option B from brainstorming Q5).
- `last_modified_by_admin` column on business tables.
- Auto-downgrade timer from edit to read-only.
- Admin-role-based permission differences.
- Mid-session mode toggle in the banner.
