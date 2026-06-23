# Careers Feature

**Branch:** `feature/careers`
**Paired backend PR:** #72 (`uniflo-api` — adds `/careers` and `/careers/{id}/programmes` endpoints + 87-career seed)

---

## What was built

A new **"Discover"** section letting students find careers that match their NSC subject choices, then drill into the specific university programmes that lead to those careers.

### Routes

| Route | Type | Description |
|---|---|---|
| `/careers` | Server + Client | Career list gated by subjects, with industry filter |
| `/careers/[id]` | Server | Per-university programme matching for one career |

### Components

- `components/careers/career-card.tsx` — Card showing title, industry demand badge (Very High → emerald, High → sky), description, monthly ZAR compensation, employability outlook, recommended subjects, and a "Programmes" CTA.
- `components/careers/careers-view.tsx` — Client component: scrollable industry chip filter (same left/right arrow + mask-gradient pattern as `courses-view.tsx`), match-count summary, error/retry, no-record empty state with link to Academic Records, loading skeletons, career grid.
- `components/careers/career-programmes-view.tsx` — Client component: per-university groups with Qualifies/Borderline/Not-yet section headers (reusing `MATCH_STATUS_BADGE`), programme cards with Apply handoff via `useSelection` + `router.push("/applications/new")`. TVET/college-only careers show an honest "mainly a college/apprenticeship path" note.

### API layer

- `lib/api/careers.ts` — typed wrappers (`getCareers`, `getCareerProgrammes`, path helpers) built on top of `lib/api/schema.d.ts`.
- `lib/api/schema.d.ts` — regenerated from `http://localhost:8000/openapi.json` after backend deploy.

### Nav

`components/layout/sidebar.tsx` — new `{ label: "Discover" }` group between "Your story" and "Applying", containing `{ href: "/careers", label: "Careers", icon: Compass }`.

---

## Design decisions

**Subject-based, not mark-based (at `/careers` level).** The career list gates on subjects only — a Grade 10 student who hasn't sat exams yet can still use this. Marks only come in at the `/careers/[id]` programmes view where APS/FPS matching runs.

**Industry chips are derived, not hardcoded.** The 11 industry strings live in the backend seed; the frontend derives the chip list from the API result via `[...new Set(careers.map(c => c.industry))].sort()`. Adding an industry to the seed automatically appears in the filter.

**Did not reuse `CourseCard` for programme cards.** `CourseCard` expects a `ProgrammeMatch` type with typed `unmet_rules` and `status` fields; `CareerProgrammeMatch` returns `status: string` and `unmet_rules: unknown[]`. Creating a `CareerProgCard` that reads `CareerProgrammeMatch` directly avoids unsafe casts and keeps the types clean.

**`tvet_only` flag.** When the backend resolves a career's `programme_keywords` against the seeded universities and finds zero matches (skilled trades, some nursing/teaching roles), it sets `tvet_only: true`. The view renders a college/apprenticeship note rather than an empty grid.

**Apply handoff year.** `new Date().getFullYear() + 1` — same heuristic as `CoursesView`. The intent year can be changed on the application form.

---

## Deviations from plan

None. All 8 frontend tasks in the plan shipped:

1. ✅ `lib/api/schema.d.ts` regen
2. ✅ `lib/api/careers.ts`
3. ✅ `app/(app)/careers/page.tsx`
4. ✅ `components/careers/careers-view.tsx`
5. ✅ `components/careers/career-card.tsx`
6. ✅ `app/(app)/careers/[id]/page.tsx`
7. ✅ `components/careers/career-programmes-view.tsx`
8. ✅ Sidebar "Discover" nav group

---

## CI status

`lint`, `format:check`, `tsc --noEmit`, `npm test` (34/34), `npm run build` — all green.
