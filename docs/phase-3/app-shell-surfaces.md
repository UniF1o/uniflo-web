# App shell — recessed chrome surface + polish

**Branch:** `feature/grade12-june-sync` (folded in alongside the record-type sync)
**Status:** complete — browser-verified at desktop / tablet / mobile

## Why this exists

The sidebar, the top navbar, and the content canvas were all painted with the
same `--color-background` cream (`#fbf6ec`). Three identical surfaces meant the
shell read as one flat sheet with no sense of frame vs. content. The ask was to
give the navigation rail its own shade, the way a recessed chrome panel sits
behind a brighter working canvas.

## The surface model

Introduced a single token and built a three-step elevation out of the existing
cream family — no new hues, no washes, in keeping with the locked brand:

| Surface | Token | Value | Role |
| --- | --- | --- | --- |
| Chrome (sidebar + navbar) | `--color-chrome` | `#efe7cd` | recessed rail, deepest |
| Content canvas | `--color-background` | `#fbf6ec` | brighter inset between the rails |
| Cards | `--color-card` | `#fffdf6` | lifted, brightest |

So `chrome < page < card`. The content area now reads as a brighter panel
framed by the deeper rails, and the existing card-float is untouched. The
hairline seams (`border-r` on the sidebar, `border-b` on the navbar) were
already there and now actually separate two different tones.

## Interactive states moved off `--muted`

`--color-chrome` (`#efe7cd`) sits very close to `--color-muted` (`#ede2cd`), so
any `hover:bg-muted` on the chrome would have been invisible. Rather than
compromise the chrome depth, the chrome's interactive states were decoupled
onto tints that read on it:

- **Sidebar nav items** (inactive): `hover:bg-muted` → `hover:bg-primary/5`,
  matching the cobalt language of the active state (`bg-primary/10`).
- **Utility icon buttons** (hamburger, mobile close, avatar): `hover:bg-muted`
  → `hover:bg-foreground/5`, a quiet neutral darken that works on any cream.
- **Journey rail, upcoming dots**: `bg-muted` → `bg-foreground/15` so the
  "not yet" segments stay visible against the chrome.

## Other UX fixes found while scanning

- **University card status pill wrapped.** On the longest name (University of
  the Witwatersrand) the "Open now" badge was being squeezed and broke to
  "Open / now". Pills should never wrap their own text, so `whitespace-nowrap`
  was added to the `Badge` base, plus `shrink-0` at the card so the badge keeps
  its width and the name wraps instead. Holds at every width, including the
  narrow tablet 2-column grid.

## Verified, not changed

- The bottom selection bar correctly stays off-screen when no universities are
  selected (`translate-y-full` + `pointer-events-none`); it only looked
  "always on" in full-page screenshots, which render fixed elements inline.

## Verification

`tsc --noEmit`, `eslint .` (0 errors), `prettier --check`, `vitest` (34/34),
and `next build` all pass. Browser pass on the production build, logged in as
the test student, at desktop (1280), tablet (768), and mobile (390): the
chrome/canvas distinction is clear and consistent, the nav and journey states
read on the new surface, the mobile drawer carries the chrome tone, and the
status pills hold one line everywhere.
