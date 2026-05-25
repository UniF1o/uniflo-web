// Academic-records contract.
//
// `/academic-records` is now in the backend OpenAPI spec, so its shapes are
// generated into `lib/api/schema.d.ts` like every other endpoint. This file
// just re-exports them under the names the app already imports, so the swap
// from the earlier hand-written interim types was a single-file change — no
// consumer had to touch its import path.
//
// Endpoint shape (one record per student per record_type):
//   GET   /academic-records                           → grade_11_final record or null
//   GET   /academic-records?record_type=grade_12_april → April record or null
//   POST  /academic-records → create/upsert (AcademicRecordCreate → 201)
//   PATCH /academic-records → update        (AcademicRecordPatch)
//
// The `subjects` array follows the locked JSON contract agreed with Partner B
// (see CLAUDE.md and lib/constants/nsc-subjects.ts).
//
// RecordType and the record_type field on AcademicRecordPayload/Response are
// manually extended here until the backend spec redeploys and types:api picks
// them up. Remove the manual extensions and re-export from schema at that point.
import type { components } from "@/lib/api/schema";

// "grade_11_final" | "grade_12_april" — will move to schema once spec regenerated.
export type RecordType = "grade_11_final" | "grade_12_april";

// POST /academic-records request body. `aggregate` is intentionally absent —
// the backend computes it server-side from the submitted marks. `record_type`
// defaults to "grade_11_final" on the backend when omitted.
export type AcademicRecordPayload =
  components["schemas"]["AcademicRecordCreate"] & {
    record_type?: RecordType;
  };

// GET /academic-records result: the signed-in student's record for the
// requested type, or `null` when they haven't entered one yet.
export type AcademicRecordResponse =
  components["schemas"]["AcademicRecordResponse"] & {
    record_type?: RecordType;
  };
