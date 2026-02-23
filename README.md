# NoxaLoyalty

A loyalty rewards platform for Philippine small businesses, built as an **npm workspaces monorepo** with a Next.js web dashboard and an Expo mobile app.

## Overview

NoxaLoyalty helps small businesses in the Philippines manage customer loyalty programs. Business owners use the **web dashboard** to configure rewards, manage staff, and track analytics. Customers interact through the **mobile app** to earn and redeem points.

**Key capabilities:**

- QR-based points earning and redemption
- Multi-branch and multi-staff support
- Role-based access (owner, staff)
- Real-time points updates via Supabase Realtime
- Xendit payment processing for subscriptions
- Feature gating with Free and Enterprise plans

## Tech Stack

| Layer     | Web                              | Mobile                           |
| --------- | -------------------------------- | -------------------------------- |
| Framework | Next.js 16 (App Router)          | Expo SDK 54 (React Native 0.81)  |
| UI        | shadcn/ui + Radix + Tailwind v4  | React Native + custom components |
| Routing   | File-based (`app/`)              | Expo Router v6                   |
| State     | React Context                    | React Context (AuthProvider)     |
| Forms     | React Hook Form + Zod            | React Hook Form + Zod            |
| Backend   | Supabase (PostgreSQL)            | Supabase                         |
| Auth      | Supabase Auth                    | Google OAuth + Supabase          |
| Payments  | Xendit                           | -                                |

## Project Structure

```
apps/
├── web/                 # Next.js 16 - business dashboard
│   ├── app/             # File-based routing
│   │   ├── api/         # Route handlers (billing, webhooks, QR, staff)
│   │   ├── dashboard/   # Business owner pages
│   │   └── staff/       # Staff-facing pages
│   ├── components/      # UI components (shadcn/ui + custom)
│   ├── lib/             # Supabase clients, auth helpers, feature gates
│   └── middleware.ts    # Route protection with role-based access
│
└── mobile/              # Expo SDK 54 - customer app
    ├── app/             # Expo Router v6 file-based routing
    │   ├── (auth)/      # Auth screen group
    │   └── (main)/      # Main app screen group
    └── src/
        ├── providers/   # AuthProvider (Google OAuth + Supabase)
        └── services/    # Business logic

packages/
├── shared/types/        # Database types (auto-generated from Supabase)
└── database/migrations/ # Supabase migrations

supabase/
├── config.toml          # Local dev config (PostgreSQL 17)
└── functions/           # Deno edge functions
```

## Prerequisites

- **Node.js** >= 18 (tested with v24)
- **npm** (ships with Node)
- A **Supabase** project (for database and auth)
- **Xendit** account (for payment processing, web only)
- **EAS CLI** (for mobile builds): `npm install -g eas-cli`

## Setup

### 1. Clone and install

```bash
git clone <repository-url>
cd LoyaltyRewardHub
npm install
```

npm workspaces will install dependencies for both `apps/web` and `apps/mobile`.

### 2. Environment variables

**Web** - create `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
XENDIT_SECRET_KEY=your_xendit_secret
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=your_xendit_public_key
```

**Mobile** - create `apps/mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Generate database types

```bash
npm run db:types
```

This generates TypeScript types from your Supabase schema into `packages/shared/types/database.ts`.

## Development

```bash
# Web dashboard (http://localhost:3000)
npm run dev:web

# Mobile app (Expo dev server)
npm run dev:mobile
```

Or run directly from the app directories:

```bash
# Web
cd apps/web
npm run dev

# Mobile
cd apps/mobile
npm start
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
```

### Mobile builds (EAS)

```bash
eas build --platform android --profile development   # Dev build
eas build --platform android --profile preview        # Preview build
eas build --platform android --profile production     # Production build
```

### Linting and type checking

```bash
cd apps/web
npm run lint        # ESLint
npm run typecheck   # TypeScript type check
```

Both must pass before committing.

## Git Workflow

This project uses a **two-branch** model:

```
main          Production-ready code. Deployed automatically.
 └── dev      Active development branch. All feature work merges here first.
```

### Branch naming

Use descriptive prefixes:

- `feat/feature-name` - new features
- `fix/bug-description` - bug fixes
- `chore/task-description` - maintenance, refactoring, config changes

### Creating a PR

1. **Create a feature branch from `dev`:**

   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes and commit:**

   ```bash
   git add <files>
   git commit -m "feat: short description of the change"
   ```

3. **Push and open a PR targeting `dev`:**

   ```bash
   git push -u origin feat/your-feature-name
   ```

   Then open a Pull Request on GitHub with **base: `dev`**.

4. **After review and merge into `dev`**, a separate PR is created from `dev` to `main` for production releases.

### Rules

- **Never push directly to `main` or `dev`.** Always use pull requests.
- **All feature branches target `dev`**, not `main`.
- **`main` is production.** Only `dev` merges into `main` via PR when a release is ready.
- Run `npm run lint` and `npm run typecheck` from `apps/web` before pushing.

## License

Private - All rights reserved.
