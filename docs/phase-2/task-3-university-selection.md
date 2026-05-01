# Task 3 — University selection flow

**Branch:** `feature/university-selection`
**Phase:** 2
**Status:** Complete

This document captures what was built, design decisions, and any deviations from the plan in `docs/phase-2/partner-a-phase-2-plan.md`.

---

## What was built

Students can now select one or more universities from the `/universities` browse page. Selected universities persist across navigation (dashboard, profile, etc.) and are surfaced via a sticky bottom bar that slides up the moment the first university is picked. Navigating to `/applications/new` without a selection redirects silently back to `/universities`.

### Files added

| File | What it does |
|---|---|
| `lib/state/selection.tsx` | React Context: `SelectionProvider`, `useSelection` hook, `SelectionEntry` type, `useReducer`-backed `add`/`remove`/`update`/`clear`/`isSelected` helpers |
| `components/universities/selection-bar.tsx` | Sticky bottom bar: count + "Continue" button. Always in the DOM; CSS `translate-y-full` hides it when empty, slides up on first selection |
| `components/applications/selection-guard.tsx` | Client component that redirects to `/universities` via `router.replace` if the selection is empty on mount |
| `app/(app)/applications/new/page.tsx` | Stub page that wraps `SelectionGuard`. Task 4 fills in the form |

### Files modified

| File | Change |
|---|---|
| `app/(app)/layout.tsx` | Wraps `AppShell` + `SelectionBar` with `SelectionProvider` so selection survives cross-page navigation |
| `components/universities/university-card.tsx` | Added `isSelected` prop; button toggles between ghost "Select" and primary "Remove"; card border gains a subtle primary ring when selected |
| `components/universities/university-list.tsx` | Consumes `useSelection`; `handleSelect` now toggles `add`/`remove`; passes `isSelected` to each card |

---

## Design decisions

### 1. `useReducer` over `useState` for selection state

The selection has four distinct mutations (ADD, REMOVE, UPDATE, CLEAR) with non-trivial logic (no-duplicate ADD, partial UPDATE). A reducer makes each transition explicit and is easier to extend when Task 4 adds `programme` + `applicationYear` via `UPDATE`. `useState` with inline array operations would be equivalent but harder to read and test.

### 2. `useMemo` Set for `isSelected` — O(1) per card

With a plain array, `isSelected(id)` would scan the entries array on every card render. Instead, `selectedIds` is a memoized `Set` derived from `entries` — `isSelected` is O(1) regardless of how many universities are in the list. Recalculates only when `entries` changes.

### 3. `SelectionBar` always rendered, CSS transition for slide

Conditional rendering (`{count > 0 && <SelectionBar />}`) would mount/unmount the element, losing the slide-up animation. Instead the bar is always in the DOM; `translate-y-full` keeps it off-screen when empty, and removing that class triggers the CSS transition. `pointer-events-none` prevents invisible clicks; `aria-hidden` suppresses screen-reader announcement of the hidden bar.

### 4. Provider in `app/(app)/layout.tsx`, bar as a sibling to `AppShell`

The provider must wrap both `AppShell` (for components inside it that read context, e.g. `UniversityList`) and `SelectionBar` (which also reads context). Placing the provider in the layout server component works — Next.js allows server components to render client components as JSX children. `SelectionBar` is a fixed-position overlay so DOM sibling order doesn't matter.

### 5. `SelectionGuard` uses `useEffect` + early `return null`

The selection lives in client state, so the server component can't read it. The guard mounts as a client component boundary, reads context immediately, and:
- If empty: returns `null` (no content flash), then `useEffect` fires `router.replace('/universities')`
- If non-empty: renders children immediately, no redirect

The `return null` is critical — it prevents the "Apply" heading from appearing and disappearing during the redirect.

### 6. `universityName` stored in `SelectionEntry`

The plan specifies `{ universityId, programme?, applicationYear? }`. Added `universityName` because Task 4's form needs to label each fieldset with the university name without a round-trip to re-fetch the list. It's available at selection time and cheap to store.

### 7. Card selected state: border ring + primary button

Two visual signals confirm a card is selected: the card border shifts from `border-border` to `border-primary/40` with a `ring-1 ring-primary/20`, and the button changes from ghost "Select" to primary "Remove". Dual signals avoid colour-only distinction (accessibility). The transition is animated via Tailwind's `transition-colors`.

---

## Deviations from the plan

| Plan item | What actually happened |
|---|---|
| "with a toast/inline message" on the deep-link guard redirect | Redirects silently. No toast library is wired in the project; adding one for this one case would be over-engineering. The redirect is near-instant so the absence of a message is not noticeable. Task 5 (review/submit) can wire a toast if one is added then |
| "lib/state/selection.ts" | Created as `lib/state/selection.tsx` — the file contains JSX (`SelectionContext.Provider`) which TypeScript requires the `.tsx` extension for |
| "Sticky-bottom pattern … On desktop it can sit inline below the filters" | Kept fixed-position on both mobile and desktop. An inline variant on desktop adds complexity for minimal benefit at MVP scale (3–5 universities max). Revisit if the sticky bar interferes with future page layouts |

---

## How to verify

### Build

```bash
npx tsc --noEmit   # zero errors
npm run lint       # zero warnings
npm run format:check
npm run test       # 4 tests pass
npm run build      # /applications/new appears as ƒ (dynamic)
```

### In the browser

1. Sign in and open `/universities`.
2. Select a university — card border lights up, button shows "Remove", selection bar slides up from the bottom showing "1 university selected".
3. Select a second — bar updates to "2 universities selected".
4. Click "Remove" on one — count drops to 1, bar stays visible.
5. Remove the last one — bar slides back down.
6. Navigate to `/dashboard` with 1 university selected — selection bar persists across the page change.
7. Click "Continue" — lands on `/applications/new` (stub heading visible).
8. Navigate directly to `/applications/new` with an empty selection — immediately redirected to `/universities`.
9. Mobile (375px): selection bar spans full width above the safe area, count and Continue button on one line.

---

## What this unblocks

- **Task 4** (`feature/application-form`) — `SelectionEntry.programme` and `SelectionEntry.applicationYear` are the fields the form writes via `update(universityId, patch)`. The `SelectionGuard` is already in `/applications/new/page.tsx` waiting for the form content.
- **Task 5** (`feature/application-review`) — `entries` from `useSelection()` feeds directly into the review list.
