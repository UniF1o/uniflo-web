// Recommendations + course-catalogue contract.
//
// Phase 4 adds the course-qualification engine to the backend. Its shapes are
// generated into `lib/api/schema.d.ts` like every other endpoint, so this file
// just re-exports them under the names the app uses and adds thin typed wrappers
// over the existing fetchers — no new fetch abstraction (see CLAUDE.md).
//
// Endpoints:
//   GET /recommendations?university_id=<uuid>&record_type=<...>  → match results
//   GET /universities/{id}/programmes                            → plain catalogue
//
// The backend pre-sorts programmes (qualifies → borderline → not_yet, then by
// APS gap) and writes the `unmet_rules` strings for the student — render in the
// returned order, verbatim. With no academic record the endpoint returns 409
// `{ "code": "no_academic_record" }`; that empty state is handled where the
// results render (Task 2), not here.
import { apiClient } from "@/lib/api/client";
import type { RecordType } from "@/lib/api/academic-records";
import type { components } from "@/lib/api/schema";

// ─── Contract types ────────────────────────────────────────────────────────

// Match outcome per programme. Kept as the generated enum so the badge map
// below is exhaustive — a backend enum change fails `tsc` after a types regen
// (the deliberate `Record<Status, …>` pattern from the workspace CLAUDE.md).
export type MatchStatus = components["schemas"]["MatchStatus"];
export type ProgrammeMatch = components["schemas"]["ProgrammeMatch"];
export type UnmetRule = components["schemas"]["UnmetRule"];
export type RecommendationsResponse =
  components["schemas"]["RecommendationsResponse"];

// Plain faculty → programme catalogue (no matching). Wired now as the Phase 4
// foundation; the structured-selection picker that consumes it is Phase 5, so
// there is no fetch helper for it yet — only the contract types.
export type ProgrammeCatalogueItem =
  components["schemas"]["ProgrammeCatalogueItem"];
export type FacultyGroup = components["schemas"]["FacultyGroup"];
export type ProgrammesCatalogueResponse =
  components["schemas"]["ProgrammesCatalogueResponse"];

// ─── Status → badge presentation ───────────────────────────────────────────

// Redeclared rather than imported because `badge.tsx` keeps `BadgeTone` local;
// this mirrors `components/applications/status-badge.tsx`.
type BadgeTone = "info" | "success" | "warning" | "destructive" | "neutral";

// The one place match status maps onto a `Badge` tone + label. Keyed on the
// full enum so a new status forces an entry here before it can compile.
export const MATCH_STATUS_BADGE: Record<
  MatchStatus,
  { tone: BadgeTone; label: string }
> = {
  qualifies: { tone: "success", label: "Qualifies" },
  borderline: { tone: "warning", label: "Borderline" },
  not_yet: { tone: "neutral", label: "Not yet" },
};

// ─── Fetchers ──────────────────────────────────────────────────────────────

// Builds the `/recommendations` request path. Shared so the client helper and
// the server page (which calls `serverApiGet` with its own token) construct the
// query the same way. `recordType` is optional — the backend defaults to the
// student's best available record and echoes it back as `record_type_used`.
export function recommendationsPath(
  universityId: string,
  recordType?: RecordType,
): string {
  const params = new URLSearchParams({ university_id: universityId });
  if (recordType) params.set("record_type", recordType);
  return `/recommendations?${params.toString()}`;
}

// Builds the `/universities/{id}/programmes` path. The catalogue endpoint is
// public — no JWT needed, fetched like the universities list.
export function programmeCataloguePath(universityId: string): string {
  return `/universities/${universityId}/programmes`;
}

// Client-side fetch for the programme catalogue (no auth required).
export function getProgrammeCatalogue(
  universityId: string,
): Promise<ProgrammesCatalogueResponse> {
  return apiClient.get<ProgrammesCatalogueResponse>(
    programmeCataloguePath(universityId),
  );
}

// Client-side fetch (attaches the Supabase JWT via `apiClient`). Used for
// picker / record-toggle re-fetches; the first paint is server-fetched.
export function getRecommendations(
  universityId: string,
  recordType?: RecordType,
): Promise<RecommendationsResponse> {
  return apiClient.get<RecommendationsResponse>(
    recommendationsPath(universityId, recordType),
  );
}
