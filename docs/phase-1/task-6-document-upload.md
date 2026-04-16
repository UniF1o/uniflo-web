# Task 6 — Document upload

**Branch:** `feature/document-upload`
**Phase:** 1
**Status:** Complete

This document captures what was built, the design decisions, and any deviations from the Phase 1 plan in `docs/partner-a-phase-1-plan.md`.

---

## What was built

A document upload page at `/documents` with three independent upload zones — one per required document type. Each zone handles its own state: idle, uploading (with live progress), uploaded (with timestamp), and error (with retry). On page load, existing uploads are fetched from the API so the page reflects the student's real state on revisit.

### Files added

| File | Role |
|---|---|
| `components/documents/upload-form.tsx` | Client component. Owns all zone state, file validation, XHR upload, and existing-document loading on mount. |
| `app/(app)/documents/page.tsx` | Server component. Sets page title, renders the client upload form. |

---

## Document types

| Type string | Label |
|---|---|
| `id_document` | South African ID document |
| `matric_results` | Matric results / NSC certificate |
| `transcripts` | Academic transcripts |

These strings are sent as the `type` field in the multipart payload. Do not rename without coordinating with Partner B — they map to backend enum values.

---

## Upload flow per zone

1. Student clicks "Select file" → hidden `<input type="file">` opens
2. File is validated client-side (type + size) before any network request
3. If invalid → error message shown, zone stays idle, student can retry
4. If valid → zone moves to `uploading`, XHR starts, progress bar updates
5. On XHR success → zone moves to `uploaded`, shows file name and timestamp
6. On XHR error → zone moves to `error`, shows message, "Try again" re-opens the file picker

---

## Design decisions

### 1. XHR instead of fetch for upload progress

The Fetch API does not expose upload progress events in most environments (readable stream uploads are not yet widely supported for `multipart/form-data`). `XMLHttpRequest.upload` fires `progress` events during the request body upload, which is what drives the per-zone progress bar. This matters on SA mobile connections where uploads can be slow.

### 2. Three independent zones, not a single form submit

Each zone uploads immediately when a file is selected rather than batching all three into a single submit. Reasons:
- A slow or failing upload on one document shouldn't block the others.
- Students on unreliable connections may lose progress mid-session — independent uploads mean partial progress is preserved.
- The replace flow (uploading a second time to the same slot) is simpler: same path, same type, no coordination needed.

### 3. No drag-and-drop for MVP

The plan mentions "upload zones" which could imply drop targets. Drag-and-drop is not implemented for MVP:
- Mobile users (SA primary audience) cannot drag files.
- The click-to-select pattern via a hidden `<input>` works identically on all devices.
- Post-MVP upgrade path: add `onDragOver` / `onDrop` handlers to the zone card.

### 4. Content-Type header is NOT manually set on XHR

When sending `FormData`, the browser must set `Content-Type` automatically because it needs to embed the multipart boundary string (e.g. `Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...`). Manually setting `Content-Type: multipart/form-data` without the boundary causes the backend multipart parser to fail. The `setRequestHeader` call for `Content-Type` is intentionally absent.

### 5. Raw storage URLs are never shown to the user

The `storage_url` field returned by GET /documents is intentionally ignored. Only the `uploaded_at` timestamp and the `type` string are used from the API response. This follows the security constraint in `docs/architecture-designs.md` section 13.

### 6. File name on revisit shows null gracefully

The `documents` table has no `file_name` column — the original file name is not stored. When loading existing uploads from GET /documents, `fileName` is set to `null` in zone state. The uploaded card renders the file name conditionally (`{state.fileName && ...}`) so it simply doesn't appear if absent, while the upload timestamp still shows.

### 7. Non-fatal failure on existing-document load

If GET /documents fails on mount (network error, non-OK status), the zones stay idle rather than showing an error. The student can still upload — they just won't see a pre-filled uploaded state. Surfacing this error would be confusing: the page would look broken even though the upload path works fine.

### 8. JWT in Authorization header, not query params

Consistent with every other endpoint in this project. The token is obtained from `supabase.auth.getSession()` at the time of each upload, not cached at mount, so a long-open page doesn't send an expired token.

---

## Deviations from the Phase 1 plan

1. **No drag-and-drop** — the plan mentions "upload zones" but drag-and-drop is not implemented for MVP. Click-to-select works on all devices including mobile. See decision 3 above.

---

## How to verify

### Locally

1. Ensure `.env.local` has valid `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_API_URL`.
2. Sign in and visit `http://localhost:3000/documents` (or complete academic records and be redirected there).
3. Click "Select file" on any zone — the file picker opens.
4. Select a `.txt` file — error message appears: "Only PDF, JPG, and PNG files are accepted." Zone stays idle.
5. Select a valid PDF under 10 MB — progress bar appears, then zone transitions to uploaded with a timestamp.
6. Refresh the page — the uploaded zone loads from the API and shows the timestamp again.
7. Click "Replace" on an uploaded zone — file picker opens again.
8. Select a new valid file — the zone re-uploads and the timestamp updates.
9. Disconnect your network and try an upload — error state appears with a connection message. "Try again" re-opens the file picker.

### CI

- `npm run lint` — passes.
- `npm run build` — passes. `/documents` compiles as a dynamic route.

---

## What this unblocks

- **Task 7 (dashboard)** — the profile completeness check can now verify whether `documents` has all three required uploads for the signed-in student.
