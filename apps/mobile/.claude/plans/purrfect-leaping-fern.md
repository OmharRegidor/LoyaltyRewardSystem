# Plan: Animate ProgressBar on Realtime Updates

## Context

The BalanceCard's tier ProgressBar already receives realtime data — `useCustomer` subscribes to Supabase realtime changes and updates `points`/`lifetimePoints` which flow into BalanceCard as props. However, the ProgressBar renders with a static `View` width (`width: ${progress * 100}%`), so when progress changes it **jumps instantly** rather than animating smoothly. The fix is to animate the fill width using React Native's `Animated` API.

---

## Changes

### 1. Animate the ProgressBar fill width

**File:** `src/components/ui/ProgressBar.tsx`

- Import `Animated`, `useRef`, `useEffect` from React/React Native
- Create an `Animated.Value` ref initialized to the current `progress`
- Add a `useEffect` that calls `Animated.timing()` to animate to the new progress value when it changes (300ms duration, native driver **off** since we're animating `width`)
- Replace the inner fill `<View>` with `<Animated.View>` using interpolated width

No other files need changes — BalanceCard already passes the correct props, and the data flow is already realtime.

---

## Files Summary

| File | Change |
|------|--------|
| `src/components/ui/ProgressBar.tsx` | Animate fill width with `Animated.timing` |

## Verification

1. Run `npx tsc --noEmit` — no type errors
2. Open the app home screen — the progress bar should render normally
3. When points change (via staff scan or realtime event), the bar should smoothly animate to the new width over ~300ms
