// Derived eligibility for a learner, from their grade (current_activity) and
// age (date_of_birth). Drives which fields profile setup asks for, whether the
// apply flow is available, and when the guardian-protection flow activates.
//
// Nothing here is persisted — it is recomputed at render from the profile, so a
// learner who "ages up" (new grade, or turns 16/18) unlocks the next stage
// automatically once they supply the newly-needed information.

import { isAutomationBlocked } from "@/lib/constants/profile-enums";

export type EligibilityStage = "explorer" | "chooser" | "applicant" | "unknown";

const GRADE_8_9 = ["In Grade 8", "In Grade 9"];
const GRADE_10_11 = ["In Grade 10", "In Grade 11"];

// Age at which South Africans are issued an SA ID / smart card.
export const ID_AGE = 16;
// Age of majority — below it, a guardian must consent (POPIA).
export const MAJORITY_AGE = 18;

export function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const monthDiff = today.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) {
    age -= 1;
  }
  return age;
}

export function isMinor(dob: string | null | undefined): boolean {
  const age = ageFromDob(dob);
  return age !== null && age < MAJORITY_AGE;
}

// POPIA: a minor's personal data needs recorded guardian consent. Activated the
// moment a DOB indicating under-18 is entered, for the current session.
export function needsGuardianConsent(dob: string | null | undefined): boolean {
  return isMinor(dob);
}

export function deriveStage(
  activity: string | null | undefined,
): EligibilityStage {
  if (!activity) return "unknown";
  if (GRADE_8_9.includes(activity)) return "explorer";
  if (GRADE_10_11.includes(activity)) return "chooser";
  return "applicant";
}

// Can this learner submit an application? False for profile-only stages
// (Grade 8-11, at-university). Mirrors the server guard.
export function canApply(activity: string | null | undefined): boolean {
  return !!activity && !isAutomationBlocked(activity);
}

// Grade 8-9 have not chosen their FET subjects yet, so setup does not ask for
// subjects (or marks) — everyone else has subjects to record.
export function collectsSubjects(activity: string | null | undefined): boolean {
  return !!activity && !GRADE_8_9.includes(activity);
}

// SA ID is issued from age 16; younger learners have only a birth certificate.
// Apply-eligible students always provide an ID (or a passport). Younger
// profile-only learners are asked only once they reach ID age.
export function collectsIdNumber(
  activity: string | null | undefined,
  dob: string | null | undefined,
): boolean {
  if (canApply(activity)) return true;
  const age = ageFromDob(dob);
  return age !== null && age >= ID_AGE;
}
