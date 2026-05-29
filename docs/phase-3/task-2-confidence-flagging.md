# Task 2 — Confidence-flagging UI on the review screen

**Branch:** `feature/phase-3`

## What shipped

- `components/applications/field-mapping-review.tsx` — per-university card
  rendering one of four states:
  - `loading` — "Checking field mappings…" while the client fetch is in
    flight.
  - `ready` with flagged entries — collapsible list of low-confidence rows,
    a positive "N other fields auto-filled" summary, and a per-university
    "I've reviewed the flagged fields" checkbox.
  - `ready` with no flagged entries — a single "All fields auto-filled with
    high confidence" affirmation. No checkbox because there's nothing to
    confirm.
  - `unavailable` / `error` — "Mapping in progress" copy and a refresh
    affordance.
  Rows expose a confidence pill that reads as text (`87%`) not just colour,
  per the a11y rule from Task 5. The reasoning is tucked inside a
  `<details>` block so the row stays scannable.
- `components/applications/review-screen.tsx` — extended Phase 2 review
  screen:
  - Fetches mappings client-side after hydration via `previewFieldMappings`.
    A `useRef<Set>` dedupes so re-renders don't refetch.
  - Renders one `<FieldMappingReview>` per selected university in a new
    "Field mappings" section sitting above the existing applications list.
  - Submit is now gated on the per-university "reviewed flagged fields"
    checkbox **only when that university has at least one flagged field**.
    Universities whose mappings are loading / unavailable / errored do not
    block submit (they fall through to whatever Partner B's worker decides
    at run time).
  - Submit loop continues past 503 portal_unavailable so earlier rows stay
    submitted and later rows can also be attempted. Per-row "Retry just this
    one" handles any unresolved row independently.
  - On full success the screen redirects to
    `/applications?just_submitted=true` for the post-submit celebration.

## Design decisions

- **Client-side fetch, not server-side.** The plan says "server-side" but
  the selection lives in the `SelectionProvider` client context — the page
  has no way to know which universities to mock up server-side. Doing the
  fetches client after hydration also gives us per-row loading / refresh
  UX naturally.
- **No edit-in-place.** Continuing the Phase 2 policy. The row links to
  `/profile`, `/academic-records` or `/documents` based on the source-field
  prefix, so the student edits where the data lives and returns to the
  review screen.
- **Soft-block, not hard-block on missing mappings.** If mappings can't
  load for a university we don't prevent submit — Partner B's worker is the
  source of truth, and the detail page surfaces any failure. Blocking would
  trap students whose mapping job hasn't fired yet.
- **No grouping by category for MVP.** The shape supports an optional
  `category` field but Partner B's first release returns a flat list. The
  UI ships flat; grouping is a one-pass change when the field lands.

## Testing

- `components/applications/field-mapping-review.test.tsx` — covers:
  - Low-confidence rows render; high-confidence rows are collapsed to a
    summary count; checkbox is present.
  - All-confident state shows the affirmation and no checkbox.
  - Mapping-in-progress state shows the refresh button and invokes the
    callback.
  - Checkbox click invokes the `onConfirmToggle` callback with `true`.
- `summariseConfidence` is exported as a pure function and unit-tested for
  threshold edge cases.

## Playwright MCP

Skipped at task close — Partner B's dev backend hasn't shipped the
`/applications/preview/field-mappings` endpoint yet, so a live preview only
exercises the "Mapping in progress" fallback. Snap the four states from the
phase-3 review doc once the endpoint goes live.

## Next person should know

- The `queueMicrotask` wrapper in the entries effect is intentional — it
  defers the first `setState` inside `loadMapping` past the effect body so
  the React lint rule (`react-hooks/set-state-in-effect`) is satisfied
  without restructuring the fetch.
- The "Retry just this one" path reuses `postOne` for parity with the main
  submit loop; on success it threads the result through the local
  `nextStatuses` mirror so `finishIfAllDone` sees fresh values without
  waiting on React state to flush.
