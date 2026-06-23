// Careers feature API contract.
//
// Endpoints:
//   GET /careers                    → careers whose subject_rule the student satisfies
//   GET /careers/{id}/programmes    → per-university programme matches for a career
//
// 409 `{ code: "no_academic_record" }` when the student has no academic record —
// surfaced to the view as `initialNoRecord` (same pattern as /recommendations).
import { apiClient } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

// ─── Contract types ────────────────────────────────────────────────────────

export type CareerRead = components["schemas"]["CareerRead"];
export type CompensationOut = components["schemas"]["CompensationOut"];
export type EmployabilityOut = components["schemas"]["EmployabilityOut"];
export type CareersListResponse = components["schemas"]["CareersListResponse"];
export type CareerProgrammeMatch =
  components["schemas"]["CareerProgrammeMatch"];
export type CareerUniversityGroup =
  components["schemas"]["CareerUniversityGroup"];
export type CareerProgrammesResponse =
  components["schemas"]["CareerProgrammesResponse"];

// ─── Fetchers ──────────────────────────────────────────────────────────────

export function careersPath(): string {
  return "/careers";
}

export function careerProgrammesPath(careerId: string): string {
  return `/careers/${careerId}/programmes`;
}

export function getCareers(): Promise<CareersListResponse> {
  return apiClient.get<CareersListResponse>(careersPath());
}

export function getCareerProgrammes(
  careerId: string,
): Promise<CareerProgrammesResponse> {
  return apiClient.get<CareerProgrammesResponse>(
    careerProgrammesPath(careerId),
  );
}
