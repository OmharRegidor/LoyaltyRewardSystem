# Security Auditor Memory

## Architecture
- Monorepo: apps/web (Next.js 16), apps/mobile (Expo SDK 54), packages/shared
- Backend: Supabase (PostgreSQL), Upstash Redis for rate limiting/caching
- Payments: Xendit SDK (PH market)
- Auth: Supabase Auth (web cookie-based), Google OAuth via expo-auth-session (mobile)

## Key Security Patterns Found (2026-03-03 Audit)
- All 36 public tables have RLS enabled
- Service client is singleton (supabase-server.ts) - good
- Middleware rate limits API routes via Upstash (100 req/60s per IP)
- Per-endpoint Redis rate limiters exist (rate-limit.ts) but NOT used in most API routes
- In-memory rate limiter in security.ts is a fallback only
- Xendit webhook uses x-callback-token comparison (not HMAC signature)
- `/api/` prefix is PUBLIC in middleware - all API routes skip auth middleware
- Customer profile endpoint `/api/customer/[userId]/profile` has NO authentication
- QR code endpoint accepts arbitrary input for generation (SSRF-lite)
- `products`, `sales`, `sale_items`, `stock_movements` have "Service role full access" policies on `{public}` role - CRITICAL
- `staff_invites` has public SELECT on all rows
- `customer_businesses` has public INSERT with `true` check and public SELECT with `true` check

## Stamp Card Audit (2026-04-01)
- [Detailed findings](stamp_card_audit_2026_04_01.md)
- CRITICAL: Stamp API routes (`/api/staff/stamp/*`) lack cross-business auth — staffId from request body, not server-derived
- CRITICAL: TOCTOU race in stamp RPCs — no FOR UPDATE locks
- HIGH: SECURITY DEFINER RPCs granted to `authenticated` — mobile customers can self-stamp
- HIGH: No feature-gate on stamp endpoints — free plan can use stamps
- Pattern: `/api/staff/pos/sale/` is the correct auth pattern (verifyStaffAndGetBusiness); stamp routes deviate

## Tables with Overly Permissive RLS
- products: `Service role full access to products` on {public} ALL true/true
- sales: `Service role full access to sales` on {public} ALL true/true
- sale_items: `Service role full access to sale_items` on {public} ALL true/true
- stock_movements: `Service role full access to stock_movements` on {public} ALL true/true
- customer_businesses: public INSERT with_check=true, public SELECT qual=true
- staff_invites: public SELECT qual=true
- businesses: `Public can view businesses` SELECT qual=true

## SQL Injection Audit (2026-03-04)

### CONFIRMED VULNERABILITIES

#### HIGH: Mobile rewards.service.ts .or() — Raw User Input, No Sanitization
- File: `apps/mobile/src/services/rewards.service.ts` line 61
- `.or(\`title.ilike.%${query}%,description.ilike.%${query}%\`)`
- `query` is raw user input with NO sanitization
- Periods are NOT stripped — full PostgREST filter syntax injectable
- Can inject e.g. `%,is_active.eq.false` to bypass the active filter

#### MEDIUM: Admin Businesses .or() — Partial Sanitization, Wildcard Abuse
- Files: `apps/web/app/api/admin/businesses/route.ts:52` and `admin/businesses/search/route.ts:25`
- Strips `/[,().]/g` which prevents classic PostgREST injection
- `%` and other wildcards NOT stripped — allows expensive wildcard scans
- Admin-only endpoint (needs admin JWT), so impact is limited

#### MEDIUM: Audit Logs businessSearch .ilike() — Wildcard Abuse
- File: `apps/web/app/api/admin/audit-logs/route.ts:32`
- `.ilike('name', \`%${businessSearch}%\`)` — no sanitization
- Admin-only; `%` wildcard can cause full table scans (DOS)

#### LOW: Unvalidated date params in POS analytics
- `apps/web/app/api/dashboard/pos/analytics/route.ts` start_date/end_date
- Not SQLi (parameterized), but malformed date strings cause 500 errors

#### LOW: Unvalidated product_id (no UUID check) in inventory movements
- `apps/web/app/api/dashboard/pos/inventory/movements/route.ts`
- Should validate UUID format before passing to query

### NOT VULNERABLE (confirmed safe)
- All RPC calls use named parameters (parameterized by PostgREST)
- All .eq()/.in()/.gte()/.lte() calls are parameterized by Supabase JS client
- No raw SQL / template literal SQL / pg.query() / execute() anywhere
- Sort column whitelist in admin/businesses/route.ts (SORT_WHITELIST)
- Zod validation on all public POST endpoints
