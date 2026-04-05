# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Usage & Model Strategy

- When Claude Code usage is above 60%: use Opus for thinking/planning, then Sonnet for executing code.

## Coding Rules

- Never use `any` type for type declarations. Create type interfaces instead.
- Never use `as any` type assertions. Use proper types or create appropriate interfaces.
- Build only the minimum viable version of every feature.
- Follow the anti-overengineering rules.

## Scalability Rules (apply to every feature)

These rules prevent performance crashes at scale. Apply them automatically when writing any code — do not wait for the user to ask.

### Realtime / WebSocket Channels
- NEVER create global/unscoped realtime channels that listen to an entire table (e.g., `table: 'rewards', event: '*'`). Every connected user receives every event, causing N-query cascades. Always scope channels with a filter (`business_id=eq.X` or `customer_id=eq.X`).
- If data doesn't need live updates, don't use realtime. Fetch on mount + pull-to-refresh is sufficient for lists that change infrequently (rewards catalog, brand list, settings).
- Minimize channels per user. Combine multiple `.on()` listeners onto a single channel instead of creating separate channels. One channel can listen to multiple tables and multiple filters.
- Never create channels inside loops. If you need to watch N items, use one channel with N `.on()` listeners — not N channels.
- Always clean up channels in useEffect return / component unmount.

### Database Queries
- NEVER load all rows and filter in memory. Push every filter, search, and match condition into the database query (`.eq()`, `.ilike()`, `.in()`). The database has indexes; JavaScript doesn't.
- Always add `.limit()` to queries that could return unbounded results. Ask: "what if this table has 100,000 rows?"
- Do aggregation in the database, not JavaScript. Use SQL `COUNT()`, `SUM()`, `GROUP BY` via RPCs or database views — don't fetch thousands of rows just to `.reduce()` them in the browser.
- Always add indexes on: (1) foreign key columns, (2) columns used in WHERE/filter clauses, (3) columns used in RLS policy subqueries, (4) columns used in ORDER BY. Create indexes in migrations alongside the tables that need them.
- Never query inside a loop (N+1 pattern). If you need data for N items, use `.in('id', ids)` in one query or a JOIN — not N separate queries.

### Async / Parallel Execution
- Use `Promise.all()` for independent async calls, not sequential `for` loops with `await`. If fetching data for 5 items, fire all 5 requests simultaneously.
- Supabase `.rpc()` and `.from()` return `{ data, error }` — they don't throw. So `Promise.all()` is safe; it won't reject on a single failure. Handle errors per-result.

### Connection Limits
- Be aware of connection budgets. Supabase Free = 200 realtime + 60 direct connections. Pro = 500 realtime + 200 direct. Every channel, every query, every RPC uses a connection.
- Use connection pooling (Supavisor) for server-side clients. Use the pooled connection string (port 6543), not the direct one (port 5432).

### API Routes
- Add rate limiting to public-facing endpoints (customer lookup, signup, QR scan, stamp/redeem).
- Never do CPU-intensive work in API routes (image generation, PDF rendering) without caching the result. These block the Node.js event loop.
- Cache deterministic outputs. If the same input always produces the same output (e.g., QR code for a URL), cache it.

### Database Triggers & RLS
- Be careful with triggers that INSERT rows per-user. A trigger that inserts a notification for every customer turns 1 INSERT into 1,000 INSERTs. Consider async queues or batch processing for fan-out operations.
- RLS policies with subqueries are expensive. If a policy does `SELECT ... FROM staff WHERE user_id = auth.uid()`, ensure `staff(user_id)` is indexed. Every row evaluation runs the subquery.

### Pre-Flight Checklist (before shipping any feature)
1. Count the realtime channels: how many per user? Can any be merged or removed?
2. Count the DB queries per page load: can any be parallelized or combined?
3. Check for unbounded queries: does every `.select()` have a `.limit()`?
4. Check for in-memory filtering: is any `.filter()` or loop doing work the database should do?
5. Check for sequential awaits: can any be converted to `Promise.all()`?
6. Check indexes: are all filtered/joined columns indexed?

## Build & Development Commands

```bash
# From root - recommended approach
npm run dev:web          # Start Next.js dev server (port 3000)
npm run dev:mobile       # Start Expo dev server
npm run db:types         # Generate TypeScript types from Supabase schema

# Web app (apps/web)
cd apps/web
npm run dev              # Next.js dev server
npm run build            # Production build
npm start                # Run production build

# Mobile app (apps/mobile)
cd apps/mobile
npm start                # Expo dev server
npm run android          # Run on Android emulator
npm run ios              # Run on iOS simulator

# Mobile builds with EAS
eas build --platform android --profile development
eas build --platform android --profile preview
eas build --platform android --profile production
```

## Architecture Overview

**NoxaLoyalty** is a loyalty rewards platform for Philippine small businesses, built as an npm workspaces monorepo.

### Project Structure

```
apps/
├── web/                 # Next.js 16 (App Router) - business dashboard
│   ├── app/             # File-based routing
│   │   ├── api/         # Route handlers (billing, webhooks, QR, staff)
│   │   ├── dashboard/   # Business owner pages
│   │   └── staff/       # Staff-facing pages
│   ├── components/      # UI components (shadcn/ui + custom)
│   ├── lib/             # Supabase clients, auth helpers, feature gates
│   └── middleware.ts    # Route protection with role-based access
│
└── mobile/              # Expo SDK 54 (React Native 0.81) - customer app
    ├── app/             # Expo Router v6 file-based routing
    │   ├── (auth)/      # Auth screen group
    │   └── (main)/      # Main app screen group
    └── src/
        ├── providers/   # AuthProvider (Google OAuth + Supabase)
        └── services/    # Business logic

packages/
├── shared/types/        # Database types (auto-generated)
└── database/migrations/ # Supabase migrations

supabase/
├── config.toml          # Local dev config (PostgreSQL 17)
└── functions/           # Deno edge functions
```

### Key Architectural Patterns

**Authentication Flow:**
- Web uses middleware-based route protection (`apps/web/middleware.ts`) - checks role from `businesses` and `staff` tables
- Mobile uses React Context (`AuthProvider`) with Google OAuth via `expo-auth-session`
- Both share Supabase Auth - single login redirects based on role (owner → dashboard, staff → staff page)

**Supabase Clients:**
- Web has separate browser and server clients (`apps/web/lib/supabase.ts`, `apps/web/lib/supabase-server.ts`)
- Service role client is lazy-initialized for admin operations
- Mobile uses standard client with AsyncStorage adapter

**Feature Gating:**
- Server-side checks in `apps/web/lib/feature-gate.ts`
- Plans: Free (unlimited loyalty features), Enterprise (contact pricing, includes POS)
- Module flags: `has_loyalty`, `has_pos`
- Gates: customer limits, branch limits, staff limits, API access, custom branding

**Billing (Admin-Managed):**
- Enterprise upgrades are done manually by admin from the Admin Portal
- Admin creates manual invoices (`manual_invoices` table) and records payments (`manual_invoice_payments` table)
- Business owners see their invoices and balance in Settings > Billing (read-only)
- Payments happen outside the system (cash, bank transfer, GCash, Maya) — admin records them in the system

**Real-time:**
- Supabase Realtime subscriptions for customer points updates
- Mobile app subscribes via AuthProvider

### Tech Stack Summary

| Layer | Web | Mobile |
|-------|-----|--------|
| Framework | Next.js 16 (App Router) | Expo SDK 54 |
| UI | shadcn/ui + Radix + Tailwind v4 | React Native + custom components |
| Routing | File-based (app/) | Expo Router v6 |
| State | React Context | React Context (AuthProvider) |
| Forms | React Hook Form + Zod | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL) | Supabase |
| Auth | Supabase Auth | Google OAuth → Supabase |
| Billing | Admin-managed invoices | - |

### Environment Variables

**Web** (`apps/web/.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Mobile** (`apps/mobile/.env` or via EAS):
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Database Types

Auto-generated types live in `packages/shared/types/database.ts`. Regenerate after schema changes:
```bash
npm run db:types
```

### Notes

- TypeScript build errors are ignored in Next.js config (`ignoreBuildErrors: true`)
- No test framework is currently configured
- Mobile deep linking scheme: `NoxaLoyalty://`
- Staff invite system uses token-based email verification

## MCP Tools

- Always use Context7 MCP when library/API documentation, code generation, setup or configuration steps are needed - without requiring explicit user request.

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
