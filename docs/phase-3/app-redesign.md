# Phase 3 — App-section redesign

Branch: `feature/app-redesign` (stacked on `feature/portal-gap-fill` / PR #30)

The marketing landing page got the full brand treatment in the phase-3
redesign; the authenticated app never did. Every app page sat as flat cream
with hairline borders — "a lot of white on the screen" — and the dashboard
remained a setup checklist forever, even after setup was done. This task
brings the brand inside and reorganises the app around a guided journey.

Direction was set with the user up front: **command-centre dashboard**,
**full brand immersion** on all app pages, **everything in scope** (dashboard,
applications, forms, shell), and a **guided next-step UX** as the headline
UX upgrade.

## The journey system

`lib/journey/journey.tsx` — one client provider (mounted in the `(app)`
layout) fetches profile / academic records / documents / applications once
and computes the five-stage journey: **Profile → Marks → Documents → Apply →
Track**. Everything that talks about progress consumes this single source:

- `JourneyRail` — the dashboard's five-node progress rail (check / pulsing
  current / quiet upcoming), every node a link.
- `NextStepCard` — the one highlighted action of the moment, with copy per
  stage. An `action_required` application outranks everything and flips the
  card to the warning tone ("A university portal needs something from you").
- `JourneyMini` — the sidebar footer: five dot segments, `n/5`, and a
  "Next: …" link, visible from every page.

`Track` only completes when every application reaches `submitted`; during
the season it stays the live stage. Unset/failed fetches fail towards
"incomplete" — a flaky endpoint can never fake progress.

## Dashboard = command centre

`components/dashboard/home.tsx` replaces `ProfileCompleteness` (deleted).
One layout spine — greeting → journey rail → next-step card — and two lives:

- **Setting up:** section checklist (profile / marks / documents cards) +
  "How UniFlo works", plus a handwritten "you've got this" margin note.
- **Set up:** the checklist disappears. Application status cards (with a
  status-colour rail per card and "Open to continue" on action-required
  rows), then university **deadline countdowns** — closes-date, days left,
  an open-window progress bar, warning tone inside 21 days, and an
  "Applied ✓" tag per university.

The greeting is time-of-day + first name (from the journey's profile). The
profile-404 → `/profile/setup` bounce from the old dashboard is preserved
via `profileMissing` on the journey.

## Foundations

- `--color-card: #fffdf6` — lifted paper, one step brighter than the cream
  page. `Card` paper/elevated variants now use it; this single change is
  most of why the app stopped reading as flat white.
- `PageHeader` — every app page opens the same way now: cobalt kicker dot +
  tracked-uppercase label, display-serif title with one cobalt-accented
  word, description, optional action slot. The first iteration also put a
  blurred sky-wash bloom behind every heading; user feedback ("the glow is
  cool for the landing page but not suitable for every page — minimal like
  Notion, but not flat") removed it app-wide. Depth now comes only from the
  lifted card surfaces.
- `Section` — standard in-page kicker heading (cobalt dash + tracked
  uppercase) with an action slot. Replaced the ad-hoc uppercase `<h2>`s on
  the detail page, settings, and the dashboard sections.
- `FormSection` — serif title on a quiet sand-tinted header band
  (`bg-muted/25`, calmed from a sky gradient in the same feedback round)
  over a lifted card body. Used by contacts cards and the academic-records
  sections.
- **Sidebar**: nav grouped to mirror the journey ("Your story": Profile,
  Academic records, Documents, Contacts; "Applying": Universities,
  Applications), active links get a cobalt rail + soft gradient, and —
  the real find — **Academic records finally has a nav entry** (it was
  previously reachable only through the dashboard card). Footer hosts
  `JourneyMini`.

## Page passes

- **Applications list**: `PageHeader`, status-colour rails on row cards,
  sprout empty state. **Detail**: header wash, `Section` kickers.
- **Forms**: profile edit sections became lifted cards with serif
  headings; the setup wizard steps got card bodies, a kicker and the
  header wash; document zones lifted onto `bg-card` with the Optional
  divider dash; remaining flat containers (overview, review lists,
  consent card, apply fieldset, mapping rows) all lifted.
- **Universities**: serif university names, "N days left to apply"
  countdown (warning inside three weeks), `PageHeader`. Apply form got
  the kicker + wash and a serif title.
- **Settings / profile overview**: `PageHeader` + `Section`.

## The optional-fields gap

The user asked the right question: the setup wizard only collects the
required core, so the optional portal fields (title, mailing address,
current activity, funding/residence, NBT, redress) are only ever seen by
students who open `/profile/edit` — which nothing prompts them to do. Most
of those blanks are tolerable, but `current_activity` gates whether
automated submission is allowed at all. Fix in this branch: an
`ActivityNudge` card on the post-setup dashboard ("Quick one — what are you
doing this year?") that renders until the field is answered. A broader
option — an optional, skippable "anything else?" wizard step — is left as a
product decision.

## Design decisions

- **The locked brand identity is untouched** — no new colours, no new
  type. The redesign only *applies* the landing language (washes, serif,
  kickers, motifs, lifted paper) inside the app. The design-skill
  palette/typography suggestions were deliberately discarded as
  conflicting with the locked identity.
- **One source of truth for progress.** Before, the dashboard, sidebar and
  pages each re-fetched and re-derived completeness; now the journey
  provider is the only place that computes it.
- **Script accent stays sparing** — one Caveat note on the setup-mode
  greeting, nothing else, per the ≤3-words brand rule.
- **Deadline maths is client-side** off `open_date`/`close_date` — no new
  backend surface needed for the command centre.

## Verification

`tsc --noEmit`, ESLint, Prettier, Vitest (34) and `next build` green at
every iteration commit. Authenticated Playwright pass as the test student:
dashboard (setup-complete state, desktop + 390px), profile edit (desktop +
390px), academic records, universities, applications — zero console errors
throughout.
