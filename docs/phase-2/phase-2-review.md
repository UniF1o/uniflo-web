# Phase 2 Review — uniflo-web

**Branches merged:** Tasks 1–7 (`feature/openapi-types` through `feature/phase-2-polish`)
**Status:** Complete

---

## What shipped in Phase 2

Phase 2 adds the full university-application flow on top of the Phase 1 profile foundation. A student can now browse universities, pick one or more, fill in programme and year per selection, review all their details in one place, submit applications in a single click, and track status on a dashboard.

| Task | Branch | What it added |
|---|---|---|
| 1 | `feature/openapi-types` | `openapi-typescript` wiring, `lib/api/schema.d.ts`, `lib/api/client.ts` |
| 2 | `feature/universities-browse` | `/universities` browse + search page |
| 3 | `feature/university-selection` | `SelectionContext`, `SelectionBar`, card toggle, `SelectionGuard` |
| 4 | `feature/application-form` | `/applications/new` with per-university `ApplicationFieldset` |
| 5 | `feature/application-review` | `/applications/review` completeness checks, consent, sequential submit |
| 6 | `feature/applications-dashboard` | `/applications` list + `/applications/[id]` detail with retry |
| 7 | `feature/phase-2-polish` | Consolidate utilities, a11y fixes, dynamic metadata, this document |

---

## Polish changes (Task 7)

### Shared utilities extracted

| Before | After |
|---|---|
| `formatDate` duplicated in `review-screen.tsx`, `application-detail.tsx`, `profile/overview.tsx` | Single export from `lib/utils/format.ts` |
| `REQUIRED_DOC_TYPES` duplicated in `review-screen.tsx` and `completeness.tsx` | Single export from `lib/constants/documents.ts` |
| `DOC_LABELS` local to `review-screen.tsx` | Exported from `lib/constants/documents.ts` |

### Accessibility fixes

| File | Fix |
|---|---|
| `components/applications/application-list.tsx` | Added `aria-label="View application for {name}"` to ambiguous "View →" links |
| `components/universities/university-card.tsx` | Added `aria-label="{Select|Remove} {university.name}"` to the toggle button |

### Dynamic metadata

`app/(app)/applications/[id]/page.tsx` replaced the static `metadata` export with `generateMetadata()` — the title now reflects the application's programme (e.g. "BSc Computer Science — Application"). `React.cache` deduplicates the application fetch between `generateMetadata` and the page component so no extra network request is added.

---

## Open risks / known gaps

| Risk | Severity | Owner |
|---|---|---|
| University name not in `ApplicationWithJob` schema — the list page fetches `GET /universities` separately to build the id→name lookup | Low | Coordinate with Partner B to include university name in the pre-joined shape in Phase 3 |
| `REQUIRED_PROFILE_FIELDS` in `review-screen.tsx` must stay in sync with the Playwright automation layer | Medium | Any new required portal field needs updating here and in the automation adapter |
| Relative timestamps in `ApplicationList` are stale if the tab is left open — student must hit Refresh | Low | Acceptable for MVP; Supabase Realtime in Phase 3 resolves this |
| No end-to-end Playwright tests yet | Medium | Phase 3 scope — `@testing-library/react` is noted in CLAUDE.md as next |
| `application_year` validation: frontend bounds to `[currentYear, currentYear+1]`; backend may differ | Low | Confirm with Partner B before Phase 3 launch |

---

## What unblocks Phase 3

- **Confidence scoring UI** — the automation layer can now flag low-confidence field mappings back through the `application_jobs.last_error` field; the detail page already shows it.
- **Screenshot proof** — `ApplicationDetail` guards `job.screenshot_url` behind a null check; Phase 3 just wires it up in the automation adapter.
- **Real-time status updates** — `ApplicationList` has a Refresh button as the MVP equivalent; Supabase Realtime drops in as a replacement.
- **Portal health monitoring** — the `/applications` list surfaces `failed` status clearly; a monitoring view would extend from this data.
