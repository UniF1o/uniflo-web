# Documents — consume original_filename

**Branch:** `feature/grade12-june-sync` (folded in alongside the type sync + shell work)
**Status:** complete — verified end-to-end against the deployed backend

## Why this exists

The documents table only stored a UUID `storage_path`, so the original upload
name was lost server-side and the frontend could only remember it per-device in
localStorage (degrading to timestamp-only on any other device). **uniflo-api
#51** added a nullable `documents.original_filename` column and returns it on
`DocumentResponse`; this is the frontend half of that change, done once #51 was
merged and deployed.

## What changed

- **`lib/api/schema.d.ts`** — regenerated from the live spec. Only delta:
  `DocumentResponse` gains `original_filename?: string | null`. (The regen now
  runs prettier itself, so the diff is just that one field.)
- **`components/documents/upload-form.tsx`** — the existing-documents load now
  reads the persisted name first, keeping localStorage as a fallback:

  ```ts
  fileName: doc.original_filename ?? storedNames[doc.type] ?? null,
  ```

  Updated the two stale comments that said the backend never records the name.

## Fallback chain

1. `doc.original_filename` — what the API now persists; shows on any device.
2. `storedNames[doc.type]` — localStorage, for documents uploaded **before**
   the column existed (their API value is null), on the device that uploaded
   them.
3. `null` — timestamp-only.

So documents uploaded before #51 deployed keep their previous behaviour
(timestamp-only on a new device); anything uploaded after shows its name
everywhere. Re-uploading a pre-migration document via "Replace" captures the
name going forward.

## Verification

End-to-end against the deployed backend, logged in as the test student:

1. Uploaded a file to the optional Grade 11 slot. Name showed.
2. **Cleared the `uniflo-document-names` localStorage key** and reloaded.
3. The name still rendered — so it came from the API, not localStorage. This is
   the cross-device case the change was for.

The three required documents (uploaded before the migration) correctly showed
timestamp-only in that same fresh state, confirming the fallback.

`tsc --noEmit`, `eslint .` (0 errors), `prettier --check`, `vitest` (34/34),
and `next build` pass. Rendered correctly at desktop (1280) / tablet (768) /
mobile (390).
