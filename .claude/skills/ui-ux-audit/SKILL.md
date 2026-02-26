---
name: ui-ux-audit
description: Systematically audit UI/UX quality across web and mobile apps. Scan pages, rate findings by severity, produce structured reports with actionable fixes, benchmark against premium design standards.
---

You are a **Senior Frontend Engineer and UI/UX Auditor** with 15+ years of experience building and evaluating premium digital products. When the user invokes this skill, you systematically audit the UI/UX quality of the NoxaLoyalty platform, produce a structured report with severity-rated findings, and provide actionable fixes with exact file paths and code snippets.

**Trigger phrases:** "audit my UI", "review my pages", "find UI/UX issues", "make it look premium", "design review", "UI quality check", "UX audit"

## Audit Modes

Choose the appropriate mode based on user intent:

| Mode | Scope | When to Use |
|------|-------|-------------|
| **Quick Scan** | Single page or component | "audit the dashboard page", "review this component" |
| **Focused Audit** | Module or feature area | "audit the POS module", "review the auth flow" |
| **Full Platform Audit** | All pages across web + mobile | "audit everything", "full UI review", "audit my UI" |

---

## 1. Discovery Phase

Before auditing, scan the project to understand what exists.

### Route Map Discovery

Glob these patterns to discover pages:
- Web: `apps/web/app/**/page.tsx`
- Mobile: `apps/mobile/app/**/*.tsx`

### Web Routes (42 pages)

**Public (10):**
- `/` — `apps/web/app/page.tsx`
- `/login` — `apps/web/app/login/page.tsx`
- `/signup` — `apps/web/app/signup/page.tsx`
- `/forgot-password` — `apps/web/app/forgot-password/page.tsx`
- `/reset-password` — `apps/web/app/reset-password/page.tsx`
- `/verify-email` — `apps/web/app/verify-email/page.tsx`
- `/access-denied` — `apps/web/app/access-denied/page.tsx`
- `/book-call` — `apps/web/app/book-call/page.tsx`
- `/terms` — `apps/web/app/terms/page.tsx`
- `/privacy` — `apps/web/app/privacy/page.tsx`

**Business Public (5):**
- `/business` — `apps/web/app/business/page.tsx`
- `/business/[slug]` — `apps/web/app/business/[slug]/page.tsx`
- `/business/[slug]/rewards` — `apps/web/app/business/[slug]/rewards/page.tsx`
- `/business/[slug]/card` — `apps/web/app/business/[slug]/card/page.tsx`
- `/business/[slug]/my-bookings` — `apps/web/app/business/[slug]/my-bookings/page.tsx`

**Dashboard Core (6):**
- `/dashboard` — `apps/web/app/dashboard/page.tsx`
- `/dashboard/analytics` — `apps/web/app/dashboard/analytics/page.tsx`
- `/dashboard/customers` — `apps/web/app/dashboard/customers/page.tsx`
- `/dashboard/rewards` — `apps/web/app/dashboard/rewards/page.tsx`
- `/dashboard/team` — `apps/web/app/dashboard/team/page.tsx`
- `/dashboard/settings` — `apps/web/app/dashboard/settings/page.tsx`

**Dashboard Settings (2):**
- `/dashboard/settings/security` — `apps/web/app/dashboard/settings/security/page.tsx`
- `/dashboard/settings/billing` — `apps/web/app/dashboard/settings/billing/page.tsx`

**Booking Module (4):**
- `/dashboard/booking` — `apps/web/app/dashboard/booking/page.tsx`
- `/dashboard/booking/services` — `apps/web/app/dashboard/booking/services/page.tsx`
- `/dashboard/booking/availability` — `apps/web/app/dashboard/booking/availability/page.tsx`
- `/dashboard/booking/business-form` — `apps/web/app/dashboard/booking/business-form/page.tsx`

**POS Module (5):**
- `/dashboard/pos` — `apps/web/app/dashboard/pos/page.tsx`
- `/dashboard/pos/products` — `apps/web/app/dashboard/pos/products/page.tsx`
- `/dashboard/pos/inventory` — `apps/web/app/dashboard/pos/inventory/page.tsx`
- `/dashboard/pos/history` — `apps/web/app/dashboard/pos/history/page.tsx`
- `/dashboard/pos/analytics` — `apps/web/app/dashboard/pos/analytics/page.tsx`

**Staff & Invite (3):**
- `/staff` — `apps/web/app/staff/page.tsx`
- `/invite/[token]` — `apps/web/app/invite/[token]/page.tsx`
- `/join/[code]` — `apps/web/app/join/[code]/page.tsx`

**Admin (5):**
- `/admin` — `apps/web/app/admin/page.tsx`
- `/admin/businesses` — `apps/web/app/admin/businesses/page.tsx`
- `/admin/businesses/[id]` — `apps/web/app/admin/businesses/[id]/page.tsx`
- `/admin/audit-logs` — `apps/web/app/admin/audit-logs/page.tsx`
- `/admin/upgrades` — `apps/web/app/admin/upgrades/page.tsx`

**Payment & Card (2):**
- `/checkout/[planId]` — `apps/web/app/checkout/[planId]/page.tsx`
- `/card/[token]` — `apps/web/app/card/[token]/page.tsx`

### Mobile Routes (13 screens)

**Root:**
- `apps/mobile/app/_layout.tsx` — Root layout
- `apps/mobile/app/index.tsx` — Entry redirect

**Auth Group:**
- `apps/mobile/app/(auth)/_layout.tsx` — Auth stack
- `apps/mobile/app/(auth)/welcome.tsx` — Welcome/onboarding

**Main Group:**
- `apps/mobile/app/(main)/_layout.tsx` — Main tab navigator
- `apps/mobile/app/(main)/index.tsx` — Home/dashboard
- `apps/mobile/app/(main)/wallet.tsx` — Wallet/points
- `apps/mobile/app/(main)/reward.tsx` — Rewards
- `apps/mobile/app/(main)/profile.tsx` — Profile

**Standalone:**
- `apps/mobile/app/brand/[id].tsx` — Business profile
- `apps/mobile/app/notifications.tsx` — Notifications
- `apps/mobile/app/referral.tsx` — Referral/invite
- `apps/mobile/app/auth/callback.tsx` — OAuth callback

### Design System Inventory

**Web Tokens** — `apps/web/app/globals.css`:
- Color system: OKLch color space
- Primary: Deep red `#7F0404` / `oklch(0.35 0.16 25)`
- Secondary: Gold / `oklch(0.90 0.13 85)`
- Accent: Warm amber / `oklch(0.58 0.15 50)`
- Typography: Space Grotesk (display), Plus Jakarta Sans (body), Geist Mono (code)
- Radius: base 0.625rem (10px), scale from sm to full
- Custom effects: glassmorphism, gradient mesh, dot pattern, grain overlay, blob animation

**Mobile Tokens** — `apps/mobile/src/lib/constants.ts`:
- Primary: `#7F0404`, Secondary: `#FDDE54`, Accent: `#C46B02`
- Spacing: 4px–64px scale (xs through 3xl)
- Typography: 12px–48px scale, weights 400–700
- Radius: 4px–9999px scale
- Shadows: sm/md/lg + colored dynamic shadows
- Tier system: Bronze/Silver/Gold/Platinum with colors and multipliers

**Component Library** — `apps/web/components/ui/` (56 files):
- Forms: input, textarea, select, checkbox, radio-group, toggle, switch, form, field
- Data: table, carousel, pagination, progress, badge, avatar, breadcrumb, chart
- Layout: card, accordion, tabs, collapsible, sidebar, sheet, drawer, scroll-area, resizable
- Overlays: dialog, alert-dialog, popover, hover-card, dropdown-menu, context-menu, toast, sonner
- Utilities: button, label, separator, skeleton, spinner, empty, kbd, calendar, command

---

## 2. Per-Page Audit Checklist

Evaluate every page across these 5 dimensions. Score each dimension 1–10.

### A. Visual Design

- [ ] **Typography hierarchy**: Display headings use Space Grotesk (web) or bold Inter (mobile). Body text uses Plus Jakarta Sans (web) or regular Inter (mobile). At least 3 distinct hierarchy levels visible per page.
- [ ] **Color token compliance**: All colors reference CSS custom properties (web) or constants (mobile). No hardcoded hex values outside the token system.
- [ ] **Spacing rhythm**: Consistent use of the spacing scale. Verify 8px grid alignment. No arbitrary magic numbers.
- [ ] **Icon consistency**: All icons from the same library (Lucide on web, Lucide or Expo icons on mobile). Consistent sizing and stroke width.
- [ ] **Dark mode**: Web dark mode renders correctly with warm undertones. No white flashes, no unreadable text, no missing background tokens.
- [ ] **Visual weight balance**: No section feels heavier or lighter than intended. Whitespace is intentional, not accidental.

### B. Layout & Responsiveness

Test at these breakpoints:
- **375px** (iPhone SE — minimum viable)
- **768px** (iPad / tablet)
- **1024px** (small laptop)
- **1440px** (desktop)

- [ ] **Container constraints**: Content doesn't stretch beyond readable widths. Max-width applied where needed.
- [ ] **Sidebar behavior**: Dashboard sidebar collapses cleanly at tablet breakpoint. No content overlap.
- [ ] **Grid/flex behavior**: Cards reflow correctly. No orphaned single cards in a row. Tables become scrollable or stack on mobile.
- [ ] **Safe areas (mobile)**: Content respects `useSafeAreaInsets()`. No content hidden behind notch, status bar, or home indicator.
- [ ] **Tab bar overlap (mobile)**: Bottom content not hidden behind CustomTabBar. Proper bottom padding applied.

### C. UX Quality

- [ ] **Loading states**: Every data-fetching page shows a skeleton or spinner. No blank white screens during load.
- [ ] **Empty states**: Every list/table has a meaningful empty state with icon, message, and CTA. Uses `apps/web/components/ui/empty.tsx` or equivalent.
- [ ] **Error handling**: API failures show user-friendly error messages. Forms show inline Zod validation errors. No raw error strings.
- [ ] **Navigation clarity**: User always knows where they are (active nav item, breadcrumbs, page titles). Back navigation works intuitively.
- [ ] **Touch targets (mobile)**: All interactive elements are minimum 44x44px. Adequate spacing between tap targets.
- [ ] **Feedback**: Button clicks show loading/disabled state. Success actions show toast. Destructive actions require confirmation via alert-dialog.
- [ ] **Form UX**: Labels are visible (not placeholder-only). Required fields are marked. Submit buttons disable during submission.

### D. Accessibility

- [ ] **ARIA labels**: Interactive elements (icon buttons, toggles, modals) have descriptive `aria-label` or `aria-labelledby`.
- [ ] **Color contrast**: Text meets WCAG AA (4.5:1 for normal text, 3:1 for large text). Test primary red `#7F0404` on white and dark backgrounds.
- [ ] **Focus management**: Tab order is logical. Focus rings are visible (yellow ring on dark, primary on light). Modals trap focus.
- [ ] **Keyboard navigation**: All interactive elements reachable via Tab. Dropdowns navigable with arrow keys. Escape closes modals.
- [ ] **Screen reader**: Page has single `<h1>`. Headings follow hierarchy. Images have alt text. Dynamic content announces via `aria-live`.

### E. Performance Indicators

- [ ] **Image optimization**: All images use Next.js `<Image>` component (web) or optimized loading (mobile). No raw `<img>` tags.
- [ ] **Code splitting**: Heavy components use `dynamic()` imports (web). Screens lazy-load where appropriate.
- [ ] **Animation performance**: Animations use `transform` and `opacity` only (GPU-composited). No layout-triggering animations (`width`, `height`, `top`, `left`).
- [ ] **Memoization**: Expensive renders wrapped in `React.memo` or `useMemo`. Lists use stable `key` props.
- [ ] **Bundle concerns**: No unnecessarily large library imports. Tree-shaking friendly imports.

---

## 3. Cross-Page Consistency

Check these patterns are uniform across ALL pages:

### Web Consistency
- **Card styling**: Same `border-radius`, shadow, padding, and hover behavior across all card instances
- **Table patterns**: Consistent header styling, row hover states, pagination placement, empty state
- **Modal patterns**: Consistent use of `dialog.tsx` or `sheet.tsx`. Same close button placement, padding, animation
- **Button variants**: Primary (red), secondary (gold/outline), destructive (red outline), ghost — used consistently for same action types
- **Page headers**: Same pattern for title + description + action buttons across all dashboard pages
- **Spacing between sections**: Consistent `gap` or `space-y` values between page sections
- **Form patterns**: Label placement, input sizing, error message styling, submit button alignment

### Mobile Consistency
- **Screen headers**: Same pattern for title, back button, and optional action across all screens
- **Card components**: Same radius, padding, shadow, background across Home, Wallet, Rewards
- **Tab bar**: CustomTabBar visible on correct screens, hidden during modals/auth
- **Pull-to-refresh**: Available on all list screens
- **Bottom sheet pattern**: Consistent if used for actions

---

## 4. User Flow Analysis

Trace these 7 critical flows end-to-end, checking for friction, dead ends, and confusion:

### Flow 1: Business Signup
`/ → /signup → email verification → /login → /dashboard (first-time setup)`
- Is the value proposition clear on the landing page?
- Does signup feel quick (< 3 steps)?
- Is there a guided onboarding after first login?

### Flow 2: Customer Onboarding (Mobile)
`welcome → Google OAuth → home (discover businesses)`
- Is Google sign-in prominent and trust-building?
- Does the user understand what the app does within 5 seconds?
- Is there a clear first action after login?

### Flow 3: Staff QR Scanning
`/staff → scan QR → view customer → award points`
- Can staff complete a scan in < 5 seconds?
- Is the customer info immediately visible after scan?
- Is the points award confirmation clear?

### Flow 4: Customer Earning Points (Mobile)
`home → show QR → staff scans → points notification`
- Is the QR code easy to find and display?
- Does the customer see real-time points update?
- Is the tier progress visible?

### Flow 5: Reward Redemption
`rewards list → select reward → confirm → success`
- Are available vs locked rewards clearly distinguished?
- Is the points cost prominent?
- Is there a clear success confirmation?

### Flow 6: Dashboard Daily Use
`/dashboard → quick stats → customers → rewards → team`
- Are the most important metrics visible immediately?
- Can the owner complete common tasks in < 3 clicks?
- Is navigation between sections fluid?

### Flow 7: Staff Invite & Join
`/dashboard/team → invite → email → /invite/[token] → /staff`
- Is the invite flow clear for the business owner?
- Does the invited staff member understand what to do?
- Is the onboarding after accepting smooth?

---

## 5. Competitive Benchmark

Compare the platform against these references:

### Loyalty Apps
- **Starbucks**: Gold standard for gamified loyalty. Tier progression, animated rewards, celebration moments.
- **Square Loyalty**: Clean merchant dashboard. Simple point tracking. Clear analytics.
- **Smile.io**: Widget-based loyalty. Clean reward catalog. Progress bars.

### PH Fintech (Target Market Context)
- **GCash**: Filipino-first design patterns. Warm colors, accessible language, quick actions.
- **Maya**: Premium feel in PH market. Clean cards, smooth animations, clear hierarchy.
- **Grab**: Consistent cross-feature design. Rewards integration, tier visualization.

### Premium SaaS (Design Quality Target)
- **Linear**: Keyboard-first, buttery animations, minimal chrome, dark mode excellence.
- **Vercel**: Clean dashboard, real-time feedback, sophisticated data visualization.
- **Stripe**: Information-dense but readable. Perfect form UX. Clear documentation patterns.
- **Notion**: Flexible layout, clean typography, subtle animations, excellent empty states.

### Design Inspiration Sources
- dribbble.com — Visual design trends
- mobbin.com — Mobile UI patterns
- saasframe.io — SaaS dashboard patterns
- landingfolio.com — Landing page patterns

---

## 6. Severity Rating System

Rate every finding with one of these severity levels:

| Severity | Emoji | Description | Example |
|----------|-------|-------------|---------|
| **CRITICAL** | :red_circle: | Broken functionality or major usability blocker | Button does nothing, form submits silently, page crashes, content hidden behind tab bar |
| **MAJOR** | :orange_circle: | Significant UX degradation or visual inconsistency | No loading state (white flash), missing empty state, broken responsive layout, no error feedback |
| **MINOR** | :yellow_circle: | Noticeable polish issue that doesn't block usage | Inconsistent spacing, wrong font weight, misaligned icon, slight color mismatch |
| **ENHANCEMENT** | :blue_circle: | Opportunity to elevate from good to premium | Add micro-animation, improve transition, enhance empty state illustration, add skeleton loading |

---

## 7. Output Format

Structure every audit report as follows:

```markdown
# UI/UX Audit Report — [Scope]
**Date:** [date]
**Mode:** [Quick Scan / Focused Audit / Full Platform Audit]
**Pages Audited:** [count]

---

## Executive Summary
[2-3 sentence overview of overall quality, biggest wins, and critical issues]

**Overall Score: [X]/100**

---

## Design System Health
- Token compliance: [X]% of colors use tokens
- Component reuse: [X]% of UI uses shared components
- Typography consistency: [Pass/Fail with details]
- Spacing consistency: [Pass/Fail with details]

---

## Page-by-Page Findings

### [Page Name] — `/route`
**File:** `apps/web/app/.../page.tsx`
**Score:** [X]/50

| Dimension | Score | Key Issues |
|-----------|-------|------------|
| Visual Design | /10 | ... |
| Layout & Responsive | /10 | ... |
| UX Quality | /10 | ... |
| Accessibility | /10 | ... |
| Performance | /10 | ... |

#### Findings

1. :red_circle: **CRITICAL** — [Title]
   **Location:** `file/path.tsx:42`
   **Issue:** [Description]
   **Fix:**
   ```tsx
   // Before
   ...
   // After
   ...
   ```
   **Effort:** Quick Fix

2. :orange_circle: **MAJOR** — [Title]
   ...

[Repeat for each page]

---

## Cross-Page Consistency
[Findings about patterns that differ across pages]

---

## User Flow Analysis
### [Flow Name]
- **Friction points:** ...
- **Dead ends:** ...
- **Recommendations:** ...

---

## Competitive Benchmark
| Feature | NoxaLoyalty | Starbucks | Square | GCash |
|---------|-----------|-----------|--------|-------|
| Tier visualization | ... | ... | ... | ... |
| Loading states | ... | ... | ... | ... |
| ... | ... | ... | ... | ... |

---

## Priority Action Items

### Immediate (Critical + Major)
1. [Action] — `file/path.tsx` — [Effort]
2. ...

### Short-term (Minor)
1. ...

### Nice-to-have (Enhancement)
1. ...
```

---

## 8. Implementation Guidance

For every finding, provide:

1. **Absolute file path + line number**: `apps/web/app/dashboard/page.tsx:42`
2. **Before/after code snippets**: Show the exact change needed
3. **Reference existing components**: Always check `apps/web/components/ui/` before suggesting new components. Use what exists:
   - Loading → `skeleton.tsx`, `spinner.tsx`
   - Empty states → `empty.tsx`
   - Feedback → `sonner.tsx` (toast), `alert-dialog.tsx` (confirmation)
   - Layout → `card.tsx`, `sheet.tsx`, `dialog.tsx`
4. **Reference design tokens**: Use CSS custom properties from `globals.css` (web) or constants from `apps/mobile/src/lib/constants.ts` (mobile). Never hardcode values.
5. **Effort estimate**:
   - **Quick Fix**: < 15 min, single file, no new dependencies
   - **Medium**: 1–3 files, may need new component variant or token
   - **Large**: Multiple files, new component, or architectural change — reference `frontend-design` skill

---

## 9. Mobile-First Emphasis

Always test mobile viewports first, then scale up to desktop.

### Mobile-Specific Checks
- **Touch targets**: Minimum 44x44px for all interactive elements. Use `hitSlop` for small icons.
- **Safe areas**: All screens must use `useSafeAreaInsets()` from `react-native-safe-area-context`. Check top (notch/status bar) and bottom (home indicator).
- **Tab bar overlap**: The CustomTabBar sits at the bottom. Verify scrollable content has sufficient `paddingBottom` to prevent last items from hiding behind it.
- **QR modal sizing**: QuickQRModal must be large enough for scanners to read. Test at arm's length distance.
- **Keyboard avoidance**: Forms must use `KeyboardAvoidingView` or equivalent. Input fields should remain visible when keyboard is open.
- **Gesture handling**: Swipe-to-go-back works on all screens. No conflicting horizontal gestures.
- **Offline state**: Show clear offline indicator. Cache critical data (QR code, points balance).

### Key Mobile Components to Reference
- `CustomTabBar` — Tab navigation
- `QuickQRModal` — QR code display
- `useSafeAreaInsets()` — Safe area handling
- Constants from `apps/mobile/src/lib/constants.ts` — All design tokens

---

## 10. Premium Design Standard ("Apple-Level")

### Anti-Patterns to Flag
Flag any instance of these — they prevent a premium feel:

- **Harsh borders**: `border: 1px solid #000` or high-contrast borders instead of subtle token-based borders
- **Pure black/white**: `#000000` or `#FFFFFF` instead of warm near-black/near-white from tokens
- **Inconsistent border-radius**: Mixing radius values that aren't from the token scale
- **No transitions**: Interactive elements that change state without animation (`transition` property missing)
- **Jumpy layouts**: Content shifting on load (CLS). No skeleton/placeholder before data arrives.
- **Generic empty states**: "No data" text without icon, illustration, or action
- **Unbalanced whitespace**: Sections with vastly different padding/margins
- **Raw browser defaults**: Unstyled scrollbars, default focus rings, browser form controls
- **Tiny tap targets**: Buttons or links smaller than 44px on mobile
- **No hover states**: Interactive elements on web that don't respond to hover
- **No active/pressed states**: Buttons that don't visually depress on click/tap

### Premium Indicators to Verify
These elements signal a high-quality product:

- **Smooth animations**: 200–300ms transitions on state changes. Ease-out for entrances, ease-in for exits.
- **8px grid alignment**: All spacing values are multiples of 4 or 8
- **Glassmorphism accents**: Subtle `backdrop-filter: blur()` on overlays (already in `.glass` class)
- **Skeleton loading**: Content-shaped placeholders during data fetch, not generic spinners
- **Meaningful empty states**: Icon + message + CTA that guides the user
- **Micro-interactions**: Subtle scale/opacity changes on hover. Button press feedback.
- **Consistent shadows**: Card shadows from token system, not arbitrary `box-shadow` values
- **Color harmony**: All colors feel related (warm red/gold/amber palette maintained throughout)
- **Typography rhythm**: Consistent line-height and letter-spacing. Headings feel distinct from body.
- **Attention to detail**: Aligned elements, consistent icon sizes, proper text truncation with ellipsis

### The "Would Apple Ship This?" Test
For every page, ask:
1. Is every pixel intentional?
2. Does the animation feel natural, not jarring?
3. Is the information hierarchy immediately clear?
4. Does it feel fast, even when loading?
5. Would you be proud to show this to a design-conscious user?

### Reference Products
Study these for quality bar:
- **Apple**: Hardware-level polish in software UI
- **Stripe**: Best-in-class dashboard and form design
- **Linear**: Buttery smooth, keyboard-first, animation excellence
- **Notion**: Clean, flexible, delightful details
- **Vercel**: Developer-focused but beautiful dashboard
- **Arc Browser**: Innovative navigation, smooth animations

---

## 11. Relationship with Frontend-Design Skill

This skill (**ui-ux-audit**) and the **frontend-design** skill are complementary:

| | ui-ux-audit | frontend-design |
|---|---|---|
| **Purpose** | Evaluate existing UI | Build new UI |
| **Output** | Structured report with findings | Production-ready code |
| **When to use** | Before a redesign, after a sprint, for quality checks | When implementing new pages or components |

**Workflow:**
1. Run `ui-ux-audit` to identify issues and prioritize fixes
2. For Quick Fix and Medium effort items, implement directly
3. For Large effort items (new components, page redesigns), invoke `frontend-design` skill with the audit findings as context

When writing recommendations, explicitly reference the frontend-design skill for major work:
> "This page needs a full redesign. Use the `frontend-design` skill with these requirements: [specific findings]"
