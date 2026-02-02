# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Coding Rules

- Never use `any` type for type declarations. Create type interfaces instead.
- Build only the minimum viable version of every feature.
- Follow the anti-overengineering rules.

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
- Plans: Free (unlimited loyalty features), Enterprise (contact pricing, includes booking/POS)
- Module flags: `has_loyalty`, `has_booking`, `has_pos`
- Gates: customer limits, branch limits, staff limits, API access, custom branding

**Payment Processing:**
- Xendit SDK for Philippines/Indonesia payments
- Webhooks at `/api/webhooks/xendit` with signature validation
- Subscription lifecycle: active → cancelled → expired

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
| Payments | Xendit | - |

### Environment Variables

**Web** (`apps/web/.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `XENDIT_SECRET_KEY`, `NEXT_PUBLIC_XENDIT_PUBLIC_KEY`

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
