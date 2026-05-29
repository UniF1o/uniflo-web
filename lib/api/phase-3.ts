// Phase 3 type overlay + typed API helpers.
//
// Partner B has not yet published the updated OpenAPI spec covering the new
// /applications/{id}/field-mappings endpoint, the structured last_error shape,
// the portal_reference/verified_at fields on the latest job, or the 202/409
// retry semantics. Once the spec lands, `npm run types:api` regenerates
// `lib/api/schema.d.ts` with these shapes natively — at which point most of
// this file becomes a re-export and `JobError` etc. should be sourced from
// the generated schema. The helpers themselves stay.
//
// Why a separate file instead of editing schema.d.ts: schema.d.ts has a
// "do not edit" header and is overwritten on every regen. Keeping the overlay
// here means the regen is a no-op merge — we just delete the duplicated types
// and update the imports.

import type { components } from "@/lib/api/schema";
import { apiClient } from "@/lib/api/client";

// ─── Field mapping shapes ─────────────────────────────────────────────────────

// Per-field mapping entry, aligned with Partner B's `FieldMappingEntry` Pydantic
// model. The shape matches the snippet in `docs/phase-3/partner-a-phase-3-plan.md`
// (section "Lock the field-mapping shape with Partner B").
export interface FieldMappingEntry {
  field_id: string;
  label: string;
  value: string | null;
  confidence: number;
  reasoning: string;
  source_profile_field: string | null;
  // Optional category — when supplied, the UI groups rows under this header
  // (e.g. "Personal", "Academic", "Documents"). Flat list when absent.
  category?: string | null;
}

// The endpoint envelope. Returns mappings for one application — the review
// screen iterates by the (preview) application identifier and merges the
// results into per-university sections.
export interface FieldMappingsResponse {
  application_id: string;
  university_id: string;
  entries: FieldMappingEntry[];
  overall_confidence: number;
}

// ─── Failure taxonomy ─────────────────────────────────────────────────────────

// Canonical error codes the backend may emit on `application_jobs.last_error`.
// `unknown` is the safety net for anything new — the UI still renders, just
// with the generic "Something went wrong" copy.
export type JobErrorCode =
  | "portal_changed"
  | "auth_failed"
  | "validation_failed"
  | "timeout"
  | "portal_unavailable"
  | "unknown";

export interface JobError {
  code: JobErrorCode;
  message: string;
  retryable: boolean;
}

// Backwards-compatibility parser. Until Partner B ships the structured shape,
// `last_error` may arrive as a plain string. Normalise both forms so consumers
// only ever deal with `JobError | null`.
export function parseJobError(raw: unknown): JobError | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    // Treat free-text errors as unknown + retryable. The taxonomy table in
    // the plan defaults `unknown` to retryable.
    return { code: "unknown", message: raw, retryable: true };
  }
  if (typeof raw === "object" && "code" in raw && "message" in raw) {
    const obj = raw as {
      code: unknown;
      message: unknown;
      retryable?: unknown;
    };
    return {
      code: normaliseCode(obj.code),
      message:
        typeof obj.message === "string" ? obj.message : String(obj.message),
      // Default to retryable when unset — better to offer the button and let
      // the backend 409 than to never offer it at all.
      retryable: typeof obj.retryable === "boolean" ? obj.retryable : true,
    };
  }
  return null;
}

const KNOWN_CODES: ReadonlySet<JobErrorCode> = new Set<JobErrorCode>([
  "portal_changed",
  "auth_failed",
  "validation_failed",
  "timeout",
  "portal_unavailable",
  "unknown",
]);

function normaliseCode(value: unknown): JobErrorCode {
  return typeof value === "string" && (KNOWN_CODES as Set<string>).has(value)
    ? (value as JobErrorCode)
    : "unknown";
}

// ─── Augmented job shape ──────────────────────────────────────────────────────

// `portal_reference` and `verified_at` ship incrementally per-adapter — some
// adapters land them, some don't. The detail page guards every read with a
// presence check (`?? null` or `if (job.portal_reference)`).
export interface JobConfirmationFields {
  portal_reference?: string | null;
  verified_at?: string | null;
}

export type AugmentedApplicationJobRead =
  components["schemas"]["ApplicationJobRead"] & JobConfirmationFields;

// ─── Portal-unavailable rejection on POST /applications ───────────────────────

// 503 body when the adapter is flagged unhealthy. The review screen renders
// this per-row inline so the student knows which university is unavailable
// without losing successfully-submitted earlier rows.
export interface PortalUnavailableBody {
  code: "portal_unavailable";
  university?: string;
}

export function isPortalUnavailable(
  body: unknown,
): body is PortalUnavailableBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    (body as { code: unknown }).code === "portal_unavailable"
  );
}

// ─── Typed client helpers ─────────────────────────────────────────────────────

// Pull the mapping payload for a single application id. Throws ApiError on
// non-2xx — callers branch on status to render the "mapping in progress"
// fallback (404 / 202) vs a hard error banner (5xx).
export function getFieldMappings(
  applicationId: string,
): Promise<FieldMappingsResponse> {
  return apiClient.get<FieldMappingsResponse>(
    `/applications/${applicationId}/field-mappings`,
  );
}

// Mapping preview during the review-before-submit flow. The application
// doesn't exist yet — the backend computes a transient mapping keyed by
// (student, university, programme, year). Returns the same envelope shape.
//
// Partner B's spec for this endpoint isn't locked. Until it lands the helper
// hits the canonical URL Partner A's plan expects; when the URL changes, the
// component code stays untouched.
export function previewFieldMappings(params: {
  university_id: string;
  programme: string;
  application_year: number;
}): Promise<FieldMappingsResponse> {
  const search = new URLSearchParams({
    university_id: params.university_id,
    programme: params.programme,
    application_year: String(params.application_year),
  });
  return apiClient.get<FieldMappingsResponse>(
    `/applications/preview/field-mappings?${search.toString()}`,
  );
}

// Retry a failed application. Partner B's spec promises 202 on success +
// 409 if the application is already processing or submitted; this helper
// surfaces the refreshed row to the caller. Errors propagate as ApiError so
// the detail page can branch on `status` (409 → conflict copy, 5xx → toast).
export function retryApplication(
  applicationId: string,
): Promise<components["schemas"]["ApplicationRead"]> {
  return apiClient.post<components["schemas"]["ApplicationRead"]>(
    `/applications/${applicationId}/retry`,
  );
}
