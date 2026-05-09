# Phase 3 · Task 1 — Redesign Foundations + Landing Page

**Branch:** `feature/redesign` (single branch holds the whole phase-3 redesign; one PR at the end)
**Iteration:** 1 of 2 — Foundations + Landing only. Auth + post-login pages follow in iteration 2.

## What changed

### New visual identity — "Cobalt & Sunset Coral"

The previous palette (deep indigo + terracotta + cream) wasn't bad, but the
post-login pages felt bland. We kept the warm-paper feel and shifted to a
brighter, more saturated brand:

- **Primary:** cobalt blue `#1f4ed8` (was `#1b2540`)
- **Accent:** sunset coral `#ff6a47` (was `#d97757`)
- **Surface:** cream paper `#fbf6ec`
- **Foreground:** deep navy ink `#0d1a3d`
- **Soft sky tint** `#e3ebff` (new — used for badges, illustration washes,
  hero slab)

Status colours (`success`, `warning`, `destructive`) moved into the design
token system rather than escaping the palette via Tailwind's emerald/amber
defaults.

**Contrast tweaks made during validation** (the original spec was adjusted
after running a WCAG AA audit):

| Token | Spec | Shipped | Why |
| --- | --- | --- | --- |
| `accent-foreground` | `#fbf6ec` (cream) | `#0d1a3d` (navy) | Cream on coral was ~2.2:1 — fails AA. Navy on coral is ~7.3:1. |
| `success` | `#2f7a55` | `#25664a` | Marginal AA on cream; darkened. |
| `warning` | `#c98a1d` | `#8a5d10` | Failed AA on cream as text; darkened. |
| `destructive` | `#c8412f` | `#b03825` | Marginal; darkened for headroom. |

### Type stack

- Display: **Instrument Serif** (kept).
- Body: **Geist Sans** (kept).
- Script accent: **Caveat** (new) — exposed as `--font-script`. Used
  sparingly for handwritten annotations like the "you got this" margin
  note next to the hero accent word.

### Motif system

Five hand-drawn SVG primitives in `components/ui/motifs/`, all
inheriting `currentColor` so they tint to the surrounding token:

- `Squiggle` — accent underline beneath a single highlighted word.
- `DashedPath` — soft connector / section tail (horizontal + wave variants).
- `Sticker` — rotated stamp ("Submitted ✓") used in the hero mockup.
- `DotCluster` — small confetti for celebratory moments.
- `Sprout` — minimal sprout doodle. Replaces the static dot in `BrandMark`.

These are the main weapon against the previous blandness — they break the
flat-rectangle rhythm without adding a heavy illustration library.

### Component refresh

- **`Button`** — added `accent` (coral with `--shadow-pop` and a tiny
  rotate-on-hover) and `secondary` (cream-on-navy outline) variants. The
  primary variant gained a subtle vertical lift on hover.
- **`Input` / `Select`** — focus ring switched to cobalt; soft inset
  highlight so they read as pressed-into-paper rather than stamped flat.
- **`Skeleton`** — gradient pulse uses `--color-soft` for a sky-tinted
  loading state.

### New shared primitives

- **`Card`** at `components/ui/card.tsx` — `paper | elevated | feature`
  variants. The `feature` variant uses a sky → cream → sand gradient with
  the new `--radius-2xl` for closing CTAs and hero callouts.
- **`Badge`** at `components/ui/badge.tsx` — token-driven, with five tones
  (`info | success | warning | destructive | neutral`). Replaces the
  hardcoded emerald/amber colours used by `StatusBadge` (which will be
  migrated in iteration 2).
- **`Stat`** at `components/ui/stat.tsx` — display number + uppercase label,
  optional script note. Used for the social-proof bar.

### Marketing components

In `components/marketing/`:

- `SectionHeading` — eyebrow + display title with optional accent word
  underlined by a `<Squiggle />`. Single source of truth for landing
  section rhythm.
- `TestimonialCard` — quote with initials avatar and an optional success
  badge ("Accepted to UCT").
- `FAQItem` — accessible accordion built on native `<details>` so the
  disclosure works without JS.
- `DashboardMockup` — pure-Tailwind/SVG hero illustration. Three mock
  application rows, a `Sticker` stamp, dot scatter, and a sky slab behind.
- `SocialLinks` — footer row of Instagram / TikTok / X / LinkedIn icons
  (each ≥40px tap target). Lucide-react in this project doesn't ship
  social brand icons, so all four are inline SVG components.

### Landing page (`app/page.tsx`)

Full rewrite. Sections, in order:

1. Sticky header with `BrandMark`, "Sign in" link (hidden on mobile), and
   accent CTA "Start free".
2. Hero — eyebrow badge, two-column on `lg` (copy + dashboard mockup).
   Includes a Caveat margin note and trust line under the CTAs.
3. Social-proof bar — three `Stat` blocks separated by `DashedPath`
   connectors on desktop, stacked on mobile.
4. Supported universities — 4×N grid sourced from `lib/constants/universities.ts`.
5. Testimonials — 3 placeholder quote cards with "Accepted to …" success
   badges. Real quotes go in iteration 2.
6. FAQ — two-column on `lg`, five items covering fees, deadlines,
   passwords, what Uniflo does, and data safety.
7. Closing CTA — `feature` card with gradient surface, Caveat lead-in,
   and dual CTAs.
8. Footer — three-column on `md`+, with `BrandMark` + tagline + social
   icons, sitemap, and contact. Copyright row at the bottom.

### Reduced-motion

`globals.css` now carries a `prefers-reduced-motion` block that suppresses
non-essential transitions/animations while keeping colour and opacity
feedback intact.

## Decisions worth recording

- **Palette change rather than pure composition fix.** The user said the
  old colours weren't bad, the site was just bland. We agreed the bland
  problem was 90% composition and 10% saturation: cobalt + coral give the
  page enough volume that the new component rhythm has something to land
  on. The cream paper feel stayed.
- **3-font stack (Instrument Serif + Geist + Caveat).** On the edge of too
  many, but Caveat is reserved for ≤3-word annotations so it never fights
  the editorial body. Watching this in iteration 2.
- **Native `<details>` for FAQ** — works without JS, gets keyboard +
  screen-reader behaviour for free, no library dependency.
- **Inline SVG for social icons** — `lucide-react@1.8.0` is a stripped
  build that doesn't include `Instagram` / `Linkedin`. Inline glyphs are
  a few lines and stay self-contained.
- **`StatusBadge` migration deferred.** It still uses ad-hoc Tailwind
  emerald/amber colours; the new token-driven `Badge` will replace it
  inside the application list/detail pages in iteration 2.

## Verification

- `npm run lint` ✅
- `npm run format:check` ✅
- `npx tsc --noEmit` ✅
- `npm run test` ✅ (1 file, 4 tests)
- `npm run build` ✅ — all 17 routes build clean
- **Playwright MCP** — landing screenshotted at 1440×900, 768×1024, and
  375×812. Console clean (no errors, no warnings). Confirmed:
  - Hero stacks below CTAs on mobile; "you got this" Caveat note hides at
    `<md` so it doesn't crowd.
  - Social-proof bar collapses to vertical stack on mobile; dashed
    connectors hide.
  - Universities grid: 2 cols (mobile) → 3 (sm) → 4 (lg).
  - Testimonials grid: 1 (mobile) → 3 (md+).
  - Footer reflows correctly; social icons are 40×40 tap targets.
  - FAQ `<details>` open/close from clicks works.
  - `/login` rendered under the new tokens — cobalt sign-in button,
    coral sprout brand mark, soft-inset inputs.
- New design tokens verified in the running browser via
  `getComputedStyle(document.documentElement)`:
  - `--color-primary: #1f4ed8`, `--color-accent: #ff6a47`,
    `--color-background: #fbf6ec`, `--color-success: #25664a`,
    `--color-soft: #e3ebff`, `--font-script: "Caveat"…`.

## Iteration 1.5 — accent depth + marquee + scroll reveals

After the first commit landed, the user pushed back on two things:

1. The bright sunset coral (`#ff6a47`) felt too light against the cream
   background — they wanted something **darker for stronger contrast**.
2. The 26-uni grid was too much; they wanted **the top 6 with logos** plus
   **transitions and animations** as the user scrolls.

What changed in this commit:

- **Accent darkened** from `#ff6a47` to `#b8421f` (deep burnt sienna).
  Cream-on-burnt-sienna passes AA at ~5.2:1, so `accent-foreground` reverts
  to `#fbf6ec` — cleaner than the navy-on-coral fix the previous version
  needed. `--shadow-pop` rgba updated to match the new accent.
- **Featured universities + brand-coloured logo chip.** New
  `FEATURED_UNIVERSITIES` constant in `lib/constants/universities.ts`
  carrying brand colour + display mark for UCT, Wits, Stellenbosch, UP,
  UKZN, and UJ. New `components/marketing/university-logo.tsx` renders
  each as an elevated card with a coloured disc. (Real official SVG
  logos are trademarked; the disc treatment is a respectful placeholder
  until you supply assets.)
- **`Marquee` component** at `components/marketing/marquee.tsx` — a
  CSS-driven right-to-left infinite track. Children are duplicated so
  `transform: translateX(-50%)` lands invisibly at the seam. Edge fade
  masks, pause on hover, respects `prefers-reduced-motion`. The
  keyframe lives in `globals.css`.
- **`Reveal` component** at `components/marketing/reveal.tsx` — fades a
  section up (or in from the side) when it scrolls into view via
  `IntersectionObserver`. State lives on a `data-reveal` attribute (not
  React state) so it stays out of the render cycle and avoids the
  `react-hooks/set-state-in-effect` lint rule. Sections already in the
  initial viewport (the hero) skip the animation so there's no
  flash-of-hidden. Reduced motion → render visible immediately.
- **Landing page wired up.** Replaced the 26-card grid with a `Marquee`
  of the six featured logos. Wrapped the hero, social-proof, marquee
  intro, testimonials (cascaded with 0/120/240 ms delays), FAQ, and
  closing CTA in `Reveal`. Hero copy slides in from the left, dashboard
  mockup slides in from the right with a 100 ms delay so the pair feels
  intentional.

Verified: lint, format, tsc, vitest, build clean. Playwright at 1440×900,
1440 mid-scroll, and 375 hero/marquee — burnt sienna applied across all
the right places (CTAs, headline accent, "you got this" handwriting,
sparkle, squiggles, brand sprout, "and counting" caption). Marquee
animating mid-frame visible (UCT entering, Wits leaving). Reveal data
attributes flip from `hidden` → `shown` as sections come into view.

## What the next iteration must do

- Auth screens (`/login`, `/signup`, `/forgot-password`) — apply motifs and
  the new visual rhythm; tighten micro-copy.
- AppShell refresh — sticky navbar with new `BrandMark`, sidebar with
  cobalt active state and accent dots.
- Dashboard — completeness ring + richer status cards.
- `/universities` — card hover lift, selection animation, sticky
  `SelectionBar` repainted with cobalt + coral.
- `/applications` list & detail — status timeline, retry stamp, migrate
  `StatusBadge` to the new token-driven `Badge`.
- Profile setup — visual stepper using `<DashedPath />`.
- Shared `loading.tsx` and `error.tsx` shells with motifs.

After iteration 2, a single consolidated PR opens against `main`.
