// Academic-records contract.
//
// `/academic-records` is now in the backend OpenAPI spec, so its shapes are
// generated into `lib/api/schema.d.ts` like every other endpoint. This file
// just re-exports them under the names the app already imports, so the swap
// from the earlier hand-written interim types was a single-file change — no
// consumer had to touch its import path.
//
// Endpoint shape (one matric record per student, mirroring /profile):
//   GET   /academic-records → the record, or `null` if none yet (200, not 404)
//   POST  /academic-records → create   (AcademicRecordCreate → 201)
//   PATCH /academic-records → update   (AcademicRecordPatch)
//
// The `subjects` array follows the locked JSON contract agreed with Partner B
// (see CLAUDE.md and lib/constants/nsc-subjects.ts).
import type { components } from "@/lib/api/schema";

// POST /academic-records request body. `aggregate` is intentionally absent —
// the backend computes it server-side from the submitted marks.
export type AcademicRecordPayload =
  components["schemas"]["AcademicRecordCreate"];

// GET /academic-records result: the signed-in student's single record, or
// `null` when they haven't entered one yet.
export type AcademicRecordResponse =
  components["schemas"]["AcademicRecordResponse"];
