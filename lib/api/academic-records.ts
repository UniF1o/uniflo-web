// Interim contract for the academic-records endpoint.
//
// `/academic-records` is not in the backend OpenAPI spec yet, so — unlike
// every other endpoint — its types can't be generated into
// `lib/api/schema.d.ts`. Until the backend ships it, this file is the single
// source of truth for the request and response shapes. The records form, the
// dashboard completeness check, and the application review flow all import
// from here.
//
// ── SWAP POINT ────────────────────────────────────────────────────────────────
// Once the backend adds `/academic-records` and the spec is regenerated
// (`npm run types:api` against the live OpenAPI doc), delete the hand-written
// interfaces below and re-export the generated ones instead, e.g.
//
//   import type { components } from "@/lib/api/schema";
//   export type AcademicRecordPayload =
//     components["schemas"]["AcademicRecordCreate"];
//   export type AcademicRecordResponse =
//     components["schemas"]["AcademicRecordResponse"];
//
// Every consumer keeps compiling — only this file changes. If the backend
// returns a single object rather than a bare array, that adjustment is also
// localised here plus its two consumers (dashboard + review).
//
// The `subjects` array follows the locked JSON contract agreed with Partner B
// (see CLAUDE.md and lib/constants/nsc-subjects.ts). Do not restructure it
// here without coordinating that change end to end.

// One subject row. "Other" entries — and only those — carry a free-text
// `custom_name`; every other `name` must be a canonical NSC subject string.
export type AcademicRecordSubject =
  | { name: string; mark: number }
  | { name: "Other"; custom_name: string; mark: number };

// POST /academic-records request body. `student_id` is never sent — the
// backend resolves it from the Supabase JWT (same as profile and documents).
export interface AcademicRecordPayload {
  institution: string;
  year: number;
  aggregate: number;
  subjects: AcademicRecordSubject[];
}

// GET /academic-records item. The endpoint returns a bare array, mirroring
// GET /documents: an empty array means "no records yet" — not a 404. Both the
// dashboard and the review screen treat a non-empty array as the completeness
// signal, so an empty list reads as incomplete (never falsely "done").
export interface AcademicRecordResponse {
  id: string;
  student_id: string;
  institution: string;
  year: number;
  aggregate: number;
  subjects: AcademicRecordSubject[];
  // The documented schema omits these; the backend may add them for parity
  // with the other tables. Optional so the shape is valid either way.
  created_at?: string;
  updated_at?: string | null;
}
