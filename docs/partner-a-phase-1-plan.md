# Uniflo — Partner A Detailed Phase 1 Plan (`uniflo-web`)

> Scoped strictly to Phase 1 work in `uniflo-web`. All decisions and constraints referenced here derive from `docs/architecture-designs.md`, `docs/build-action-plan.md`, and `docs/git-github-workflow.md`.

---

## Phase 1 Goal

A student can sign up, complete their full profile, and upload their documents. The data flows correctly from the frontend form to the backend API and persists in PostgreSQL. Every screen has clear loading, error, and success states.

**Duration:** Weeks 3–5
**Reference tag: `[PHASE-1]`**

---

## Before You Write a Single Line of Code

**Do this with Partner B first. Do not skip it.**

Agree on the `academic_records.subjects` JSON contract. This is the data structure your frontend form produces and Partner B's Pydantic schema consumes. It is locked once agreed and cannot change without coordinating across both repos.

The agreed contract (from `docs/build-action-plan.md`):

```json
{
  "subjects": [
    { "name": "Mathematics", "mark": 78 },
    { "name": "Physical Sciences", "mark": 71 },
    { "name": "English Home Language", "mark": 85 },
    { "name": "Other", "custom_name": "Dramatic Arts", "mark": 82 }
  ]
}
```

Rules you must enforce on the frontend:
- `name` must come from the canonical NSC subject list — a hardcoded TypeScript constant (see Task 5)
- `mark` is an integer, not a string
- Only `"Other"` entries carry a `custom_name` field — no other entries have it
- Free-text subject names on the `name` field are not permitted — the backend field mapping service cannot handle inconsistent keys
- Do not ship a variation of this structure without agreeing it with Partner B first

Also confirm with Partner B:
- The base URL for the `uniflo-api` dev server (Render URL) so you can point your local `.env.local` at it
- That Partner B's `/auth`, `/profile`, and `/documents` endpoints are at a stage where you can start integrating — you can build screens against mock data first, but align on this early

---

## How to Work Through This Plan

Every task below is a separate feature branch. The Git workflow is in `docs/git-github-workflow.md`. The short version:

```bash
# Start each task
git checkout main && git pull origin main
git checkout -b feature/<task-branch-name>

# When done — open a PR to main, wait for CI green, Squash and Merge
```

Opening a PR automatically generates a **Vercel Preview URL**. Test every UI change there before merging. Never merge without checking the preview.

CI must pass (ESLint + Vitest) before any PR merges. No exceptions — see `docs/git-github-workflow.md`.

---

## Task 1 — Supabase Auth SDK setup
**Branch:** `feature/auth-sdk-setup`

Set up the Supabase client before building any auth screens. Everything else depends on this.

- [ ] Install `@supabase/supabase-js` and `@supabase/ssr`
- [ ] Create `lib/supabase/client.ts` — browser Supabase client using `createBrowserClient`
- [ ] Create `lib/supabase/server.ts` — server Supabase client using `createServerClient` (for Server Components and Route Handlers)
- [ ] Create `middleware.ts` at the repo root — refreshes the Supabase Auth session on every request using `updateSession`
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local` and `.env.example`

**Why two clients:** The App Router requires separate clients for browser and server contexts. The browser client runs in Client Components. The server client runs in Server Components, Route Handlers, and middleware — it reads cookies to access the session server-side.

**Why middleware:** Without `middleware.ts`, the session token is never refreshed and users get silently logged out. It must run on every request.

Auth.js is explicitly excluded from this project — see `docs/architecture-designs.md` section 6. Do not introduce it.

**Squash commit:** `chore: set up Supabase Auth client and middleware`

---

## Task 2 — App shell and layout
**Branch:** `feature/app-shell`

Build the structural skeleton all product screens will live inside. Do not build any screen content yet — just the shell.

- [ ] Create the root layout at `app/layout.tsx` — sets up font, metadata, and wraps the app
- [ ] Create two layout groups:
  - `app/(auth)/layout.tsx` — minimal centred layout for sign up / login / forgot password screens
  - `app/(app)/layout.tsx` — full product layout with navbar and sidebar for authenticated screens
- [ ] Build the navbar component — logo, nav links (placeholders for now), user avatar/menu
- [ ] Build the sidebar component — navigation items for the sections that exist in Phase 1 (Profile, Documents)
- [ ] Add route protection to `app/(app)/layout.tsx` — redirect unauthenticated users to `/login` using the server Supabase client
- [ ] Add a basic loading skeleton so layout shifts are handled cleanly

Keep components in `components/` organised by concern: `components/layout/`, `components/ui/`.

**Squash commit:** `feat: add app shell with auth and app layout groups`

---

## Task 3 — Authentication screens
**Branch:** `feature/auth-screens`

Build the three auth screens. Auth logic runs through the Supabase JS SDK — no custom auth, no Auth.js. See `docs/architecture-designs.md` section 6.

**Sign up screen** (`app/(auth)/signup/page.tsx`):
- [ ] Email + password fields with validation
- [ ] Google OAuth button — calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
- [ ] On successful signup, redirect to the profile setup flow (Task 4)
- [ ] Show clear inline error messages for: email already in use, weak password, network error

**Login screen** (`app/(auth)/login/page.tsx`):
- [ ] Email + password fields
- [ ] Google OAuth button
- [ ] "Forgot password?" link to the forgot password screen
- [ ] On successful login, redirect to `/dashboard` (or profile setup if profile is incomplete)
- [ ] Show clear inline error for: wrong credentials, account not found, network error

**Forgot password screen** (`app/(auth)/forgot-password/page.tsx`):
- [ ] Email field
- [ ] Calls `supabase.auth.resetPasswordForEmail()`
- [ ] Show a confirmation message — do not expose whether the email exists or not

**General auth rules:**
- [ ] All auth state changes go through Supabase — never manage session state manually
- [ ] After OAuth redirect, Supabase handles the callback — add a Route Handler at `app/auth/callback/route.ts` to exchange the code for a session
- [ ] No sensitive data in URL params — see `docs/architecture-designs.md` section 13

**Squash commit:** `feat: add sign up, login, and forgot password screens`

---

## Task 4 — Student profile setup flow
**Branch:** `feature/profile-setup`

The profile setup flow is a multi-step form. It collects all fields required by `student_profiles` in the database. Every field matters — `gender` and `home_language` are mandatory because the Playwright automation layer uses them to fill university portal forms. They are not optional display fields. See `docs/architecture-designs.md` section 3.

The `student_profiles` schema (from `docs/build-action-plan.md`):
```
id, user_id, first_name, last_name, id_number,
date_of_birth, phone, address, nationality,
gender, home_language, updated_at
```

**Step structure** (suggested — adjust if it feels wrong in practice):
- Step 1: Personal details — first name, last name, date of birth, South African ID number
- Step 2: Contact details — phone number, address, nationality
- Step 3: Identity fields — gender (select), home language (select)

**Build:**
- [ ] Multi-step form wrapper with a progress indicator (e.g. "Step 2 of 3")
- [ ] Step 1: personal details fields with validation
- [ ] Step 2: contact details fields with validation
- [ ] Step 3: gender select and home language select — these must be dropdowns, not free text
  - Gender options: Male, Female, Other, Prefer not to say (confirm with Partner B what the backend enum accepts)
  - Home language options: full list of SA official languages — Zulu, Xhosa, Afrikaans, English, Sepedi, Tswana, Sesotho, Tsonga, Swati, Venda, Ndebele (confirm with Partner B)
- [ ] "Save and continue" per step — save to the API after each step, not only at the end. If the student drops off mid-flow, their progress is not lost
- [ ] On submit, `POST` to `/profile` on the `uniflo-api` backend — include the JWT from Supabase in the `Authorization: Bearer <token>` header
- [ ] Show clear loading state while saving
- [ ] Show clear error state if the API call fails — do not silently swallow errors
- [ ] On completion, redirect to the academic records form (Task 5)

**Note on types:** Once Partner B has the FastAPI OpenAPI spec available, run `openapi-typescript` to generate TypeScript types from it. Until then, manually type the request/response shapes and replace them when the generated types are ready. See `docs/architecture-designs.md` section 2 (type safety bridge).

**Squash commit:** `feat: add multi-step student profile setup flow`

---

## Task 5 — Academic records form
**Branch:** `feature/academic-records`

This is the most technically specific form in Phase 1. The `subjects` JSON structure is a contract with the backend — it must match exactly. See `docs/build-action-plan.md` Phase 1 schema notes.

**The subjects JSON contract (locked):**
```json
{
  "subjects": [
    { "name": "Mathematics", "mark": 78 },
    { "name": "Other", "custom_name": "Dramatic Arts", "mark": 82 }
  ]
}
```

**Canonical NSC subject list** — hardcode this as a TypeScript constant for MVP. Do not fetch it from an API. Example partial list to expand:

```typescript
// lib/constants/nsc-subjects.ts
export const NSC_SUBJECTS = [
  "Accounting",
  "Agricultural Management Practices",
  "Agricultural Sciences",
  "Agricultural Technology",
  "Business Studies",
  "Civil Technology",
  "Computer Applications Technology",
  "Consumer Studies",
  "Dance Studies",
  "Design",
  "Dramatic Arts",
  "Economics",
  "Electrical Technology",
  "Engineering Graphics and Design",
  "English Home Language",
  "English First Additional Language",
  "Geography",
  "History",
  "Hospitality Studies",
  "Information Technology",
  "isiNdebele Home Language",
  "isiXhosa Home Language",
  "isiZulu Home Language",
  "Life Orientation",
  "Life Sciences",
  "Mathematical Literacy",
  "Mathematics",
  "Mechanical Technology",
  "Music",
  "Physical Sciences",
  "Religion Studies",
  "Sepedi Home Language",
  "Sesotho Home Language",
  "Setswana Home Language",
  "Siswati Home Language",
  "Tourism",
  "Tshivenda Home Language",
  "Visual Arts",
  "Xitsonga Home Language",
] as const;
```

**Build:**
- [ ] Create `lib/constants/nsc-subjects.ts` with the full canonical NSC subject list
- [ ] Subject entry UI — a row per subject with:
  - A searchable select/combobox for subject name (options from the constant above, plus "Other" at the bottom)
  - A number input for mark (0–100, integer only)
  - When "Other" is selected, show a free-text input for `custom_name`
  - A remove button to delete the row
- [ ] "Add subject" button to add a new row — students typically have 6–8 subjects
- [ ] Validate that at least one subject is entered before allowing submission
- [ ] Validate marks are integers between 0 and 100
- [ ] `aggregate` field — calculate and display automatically from the marks entered (simple average for MVP, confirm formula with Partner B)
- [ ] `institution` field — the school/institution name (text input)
- [ ] `year` field — the year of the academic record (e.g. 2024, 2025)
- [ ] On submit, `POST` to `/academic-records` — include JWT in `Authorization` header
- [ ] The payload must match the locked JSON contract exactly — verify this before merging
- [ ] Clear loading and error states

**Squash commit:** `feat: add academic records form with NSC subject list`

---

## Task 6 — Document upload UI
**Branch:** `feature/document-upload`

Students upload three document types: ID copy, matric results, transcripts. Uploads go to Supabase Storage via the backend — the frontend does not write to Supabase Storage directly. The backend endpoint handles the Storage upload and saves the URL to the `documents` table. See `docs/architecture-designs.md` section 7.

The `documents` schema:
```
id, student_id, type, storage_url, uploaded_at
```

**Build:**
- [ ] Upload UI with three clearly labelled upload zones — one per document type:
  - South African ID document
  - Matric results / NSC certificate
  - Academic transcripts (if applicable)
- [ ] Each zone shows: current upload status (not uploaded / uploading / uploaded ✓ / error), file name once uploaded, and a replace button
- [ ] File type validation client-side — accept PDF and common image types (jpg, png). Show an error immediately for unsupported types before any upload is attempted
- [ ] File size validation client-side — warn if file exceeds a reasonable limit (e.g. 10MB) before uploading
- [ ] Upload progress indicator per file — students on mobile connections need to see something is happening
- [ ] On select, `POST` the file to `/documents` on the backend as `multipart/form-data` — include `type` field in the payload so the backend knows which document type it is
- [ ] On success, show the document as uploaded with a timestamp
- [ ] On error, show a clear message and allow retry — do not silently fail
- [ ] Documents already uploaded (on page revisit) should load and display their current status from the API

**Security note from `docs/architecture-designs.md` section 13:** Documents contain sensitive PII. Never log file contents. Never display raw storage URLs to the user — use the backend as the intermediary.

**Squash commit:** `feat: add document upload UI with progress and error states`

---

## Task 7 — Profile completeness and dashboard entry point
**Branch:** `feature/dashboard-shell`

After Phase 1 tasks are all wired up, students need somewhere to land after login and a way to see what they still need to complete before they can apply to universities.

- [ ] Build a minimal `/dashboard` page — this will be expanded significantly in Phase 2, but for Phase 1 it just needs to exist
- [ ] Add a profile completeness indicator — show which sections are done (profile details ✓, academic records ✓, documents ✓) and which are still missing with a link to complete them
- [ ] If a newly signed-up student lands on `/dashboard` with no profile data, redirect them to the profile setup flow automatically
- [ ] The dashboard must be behind the auth route protection added in Task 2 — unauthenticated access redirects to `/login`

**Squash commit:** `feat: add dashboard shell with profile completeness indicator`

---

## Phase 1 Checkpoint

Before signing Phase 1 off, verify the full flow manually on the Vercel preview:

- [ ] Sign up with email + password → redirected to profile setup
- [ ] Sign up with Google OAuth → redirected to profile setup
- [ ] Complete all three profile steps → data saved to backend, visible on revisit
- [ ] Complete academic records form with at least 3 subjects including one "Other" → data saved correctly, `subjects` JSON matches the locked contract
- [ ] Upload all three document types → uploads succeed, documents show as uploaded on revisit
- [ ] Log out → redirected to login
- [ ] Log back in → lands on dashboard with profile completeness showing correct state
- [ ] Incomplete profile → redirected to setup flow

All of the above must work on a mobile viewport (375px width minimum). SA users are mobile-first — see `docs/architecture-designs.md` section 1.

All ESLint and Vitest checks must be passing in CI. No merges with red CI — see `docs/git-github-workflow.md`.

---

## Environment Variables for Phase 1

Add these to `.env.local` (never committed) and `.env.example` (committed, no values):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Backend API
NEXT_PUBLIC_API_URL=  # Render dev URL from Partner B
```

Update `.env.example` immediately when a new variable is added — it is the shared contract between partners on what credentials are needed. See `docs/build-action-plan.md` ongoing rules.

---

## What Is Explicitly Out of Scope for Phase 1

Do not build any of the following — they belong to later phases:

- University browsing or search (Phase 2)
- Application selection, review, or submission flow (Phase 2)
- Application status dashboard (Phase 2)
- Confidence scoring UI (Phase 3)
- Submission confirmation screen (Phase 3)
- Supabase Realtime / live status updates (post-MVP)
- Payments (post-MVP)
- SMS notifications (post-MVP)

See `docs/build-action-plan.md` MVP scope for the full out-of-scope list.
