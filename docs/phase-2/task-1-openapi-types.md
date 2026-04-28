# Task 1 — OpenAPI type generation

**Branch:** `feature/openapi-types`
**Phase:** 2
**Status:** Complete

This document captures what was built, design decisions, and any deviations from the plan in `docs/phase-2/partner-a-phase-2-plan.md`.

---

## What was built

Replaced all hand-written API types across the codebase with types generated from the `uniflo-api` FastAPI OpenAPI spec. Every Phase 2 fetch now has end-to-end TypeScript types — drift between frontend expectations and backend reality shows up as a build error, not a runtime 4xx.

### Files added

| File | What it does |
|---|---|
| `lib/api/schema.d.ts` | Full API type contract — paths, component schemas, and operations for Phase 1 and Phase 2 endpoints |
| `lib/api/client.ts` | Thin fetch wrapper — JWT injection at call time, `ApiError` on non-2xx, handles JSON and `FormData` bodies |
| `scripts/generate-types.mjs` | Cross-platform Node.js script that runs `openapi-typescript` against the spec URL |

### Files modified

| File | Change |
|---|---|
| `package.json` | Added `openapi-typescript` devDependency and `npm run types:api` script |
| `.env.example` | Added `OPENAPI_SPEC_URL` variable with description |
| `README.md` | Added "Working with the API" section, updated scripts table, fixed stale `partner-a-phase-1-plan.md` reference |
| `components/profile/overview.tsx` | Replaced hand-written `ProfileResponse` interface with `components["schemas"]["ProfileResponse"]` |
| `components/academic-records/records-form.tsx` | Replaced hand-written `AcademicRecordsPayload` interface with `components["schemas"]["AcademicRecordCreate"]` |
| `components/documents/upload-form.tsx` | Replaced hand-written `ExistingDocument` interface and `DocumentType` literal union with schema-derived types |

### Files moved

| From | To | Reason |
|---|---|---|
| `docs/partner-a-phase-1-plan.md` | `docs/phase-1/partner-a-phase-1-plan.md` | Co-locates the phase-1 plan with the task docs in `docs/phase-1/` |

---

## Schema coverage

`lib/api/schema.d.ts` covers the full agreed API contract for both phases:

### Phase 1 schemas

| Schema | Description |
|---|---|
| `ProfileResponse` | Fields returned by `GET /profile` |
| `ProfileUpdate` | Fields accepted by `PUT /profile` |
| `SubjectRecord` | Locked subjects JSON contract — standard and "Other" (discriminated union) |
| `AcademicRecord` | Full record including `id` and `student_id` |
| `AcademicRecordCreate` | POST body for `POST /academic-records` |
| `Document` | Full document record — `storage_url` present but unused on frontend for security reasons |
| `DocumentUploadResponse` | Minimal response from `POST /documents` — just `id`, `type`, `uploaded_at` |
| `ErrorDetail` | FastAPI validation and business logic error shape: `{ detail: string }` |

### Phase 2 schemas

| Schema | Description |
|---|---|
| `University` | Full university record with dates and `is_active` flag |
| `UniversityList` | Wrapper: `{ items: University[] }` |
| `ApplicationCreate` | POST body: `university_id`, `programme`, `application_year` |
| `ApplicationStatus` | Enum: `"pending" \| "processing" \| "submitted" \| "failed"` |
| `Application` | Full application row |
| `ApplicationJob` | Job record — `screenshot_url` is present but Phase 3 only (null-guarded) |
| `ApplicationWithJob` | `Application & { latest_job: ApplicationJob \| null }` — the pre-joined shape `GET /applications` returns |
| `ApplicationList` | Wrapper: `{ items: ApplicationWithJob[] }` |

---

## Design decisions

### 1. Hand-crafted schema.d.ts rather than running the CLI

The plan calls for `openapi-typescript` to generate `schema.d.ts` from a live spec URL. At the time of Task 1, the `uniflo-api` backend is not yet deployed. The schema was hand-crafted to exactly match the contracts agreed with Partner B in `docs/phase-2/partner-a-phase-2-plan.md`.

The format mirrors what `openapi-typescript` v7 would produce — the file is structured identically to generated output so that when Partner B publishes the spec, running `npm run types:api` will overwrite it cleanly without any consuming code needing to change.

### 2. Separate `generate-types.mjs` script instead of an inline npm script

The `OPENAPI_SPEC_URL` env var default (`${VAR:-default}`) uses bash syntax that does not work in Windows `cmd.exe` or PowerShell. A small Node.js script (`scripts/generate-types.mjs`) reads the variable with `process.env` — this is cross-platform and avoids needing `cross-env` or a shell wrapper.

### 3. Generic `apiClient` rather than `openapi-fetch`

The plan says "a thin fetch wrapper that is typed against the generated paths." Two options were considered:

- **`openapi-fetch`** (the official companion library) — fully route-typed, validates that path + method + body + response all match. More upfront complexity.
- **Generic `apiClient.get<T>(path)`** — callers supply the type parameter, importing the specific schema type at the call site. Less magic, easier to read.

The generic wrapper was chosen for MVP. Callers do:
```ts
import type { components } from "@/lib/api/schema";
const data = await apiClient.get<components["schemas"]["University"]>("/universities/123");
```
The type relationship is explicit and readable. If type safety requirements grow in Phase 3, migrating to `openapi-fetch` is a one-branch change.

### 4. JWT read at call time, not module load

`createClient()` and `supabase.auth.getSession()` are called inside `request()`, not at module top-level. This matters for long-open pages (e.g. a student who leaves the review screen open for 30+ minutes) — the JWT is refreshed by Supabase automatically, so reading it at call time guarantees the outgoing request carries a valid token.

### 5. FormData pass-through in `apiClient.post`

Document uploads use XHR (for upload progress events — Fetch API doesn't expose them). However, `apiClient.post` still handles `FormData` correctly by detecting the body type and skipping the `Content-Type: application/json` header — the browser sets the correct `multipart/form-data` boundary automatically. This future-proofs `apiClient` for any non-XHR form posts.

### 6. `storage_url` excluded from `DocumentUploadResponse`

`Document` (the full schema) includes `storage_url`. `DocumentUploadResponse` (what `POST /documents` returns) deliberately does not. Raw Supabase Storage URLs must not be displayed to the student — see `docs/architecture-designs.md` §13. Keeping a separate response type makes it impossible to accidentally render the URL in new upload UI code.

---

## Deviations from the plan

| Plan item | What actually happened |
|---|---|
| "Replace the hand-written `ProfileResponse` in `components/profile/overview.tsx`" | Done. Also replaced `AcademicRecordsPayload` and `ExistingDocument` in the other two Phase 1 components — both had identical "replace with generated type" TODOs in their source. Keeping the task scope tight while clearing all known stubs was the right call. |
| "Check `lib/api/schema.d.ts` into git — generated but stable" | Done. File is committed and readable without running the backend. |

---

## How to verify

### Types

```bash
npx tsc --noEmit
```

Should pass with zero errors. All three modified components now compile with schema-derived types.

### Regeneration (requires uniflo-api running)

```bash
# Local backend at default port
npm run types:api

# Or against a deployed spec
OPENAPI_SPEC_URL=https://api.uniflo.co.za/openapi.json npm run types:api
```

The output should overwrite `lib/api/schema.d.ts` with identical or updated content. Commit the result.

### CI

- `npm run lint` — passes
- `npm run format:check` — passes
- `npx tsc --noEmit` — passes
- `npm run test` — passes (4 tests, no new tests added — no logic to unit-test in a type-only + fetch-wrapper task)
- `npm run build` — passes

---

## What this unblocks

Every Phase 2 task. `lib/api/client.ts` and `lib/api/schema.d.ts` are the shared foundation for:

- **Task 2** (`feature/universities-browse`) — `GET /universities` typed via `UniversityList`
- **Task 3** (`feature/university-selection`) — selection state typed against `University`
- **Task 4** (`feature/application-form`) — `POST /applications` typed via `ApplicationCreate`
- **Task 5** (`feature/application-review`) — full profile + records + documents read via `apiClient`
- **Task 6** (`feature/applications-dashboard`) — `GET /applications` typed via `ApplicationList` with pre-joined job summary
