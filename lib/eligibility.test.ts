import { describe, expect, it } from "vitest";
import {
  ageFromDob,
  canApply,
  collectsIdNumber,
  collectsSubjects,
  deriveStage,
  interimResultsAvailable,
  isMinor,
  needsGuardianConsent,
} from "@/lib/eligibility";

// A DOB exactly `years` ago (safe midyear date to avoid birthday edge cases).
function dobAged(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setMonth(5, 15);
  return d.toISOString().slice(0, 10);
}

describe("ageFromDob", () => {
  it("returns null for missing or invalid input", () => {
    expect(ageFromDob(null)).toBeNull();
    expect(ageFromDob("")).toBeNull();
    expect(ageFromDob("not-a-date")).toBeNull();
  });

  it("computes whole-year age", () => {
    expect(ageFromDob(dobAged(14))).toBe(14);
    expect(ageFromDob(dobAged(17))).toBe(17);
  });
});

describe("isMinor / needsGuardianConsent", () => {
  it("treats under-18 as a minor needing consent", () => {
    expect(isMinor(dobAged(13))).toBe(true);
    expect(needsGuardianConsent(dobAged(13))).toBe(true);
    expect(isMinor(dobAged(20))).toBe(false);
    expect(needsGuardianConsent(dobAged(20))).toBe(false);
  });
});

describe("deriveStage", () => {
  it("maps grades to stages", () => {
    expect(deriveStage("In Grade 8")).toBe("explorer");
    expect(deriveStage("In Grade 9")).toBe("explorer");
    expect(deriveStage("In Grade 10")).toBe("chooser");
    expect(deriveStage("In Grade 11")).toBe("chooser");
    expect(deriveStage("Currently in Grade 12")).toBe("applicant");
    expect(deriveStage("Gap year")).toBe("applicant");
    expect(deriveStage(null)).toBe("unknown");
  });
});

describe("canApply", () => {
  it("blocks profile-only stages, allows apply-eligible ones", () => {
    expect(canApply("In Grade 9")).toBe(false);
    expect(canApply("In Grade 11")).toBe(false);
    expect(canApply("At university")).toBe(false);
    expect(canApply("Currently in Grade 12")).toBe(true);
    expect(canApply("Upgrading matric")).toBe(true);
  });
});

describe("collectsSubjects", () => {
  it("skips subjects for Grade 8-9 only", () => {
    expect(collectsSubjects("In Grade 8")).toBe(false);
    expect(collectsSubjects("In Grade 9")).toBe(false);
    expect(collectsSubjects("In Grade 10")).toBe(true);
    expect(collectsSubjects("Currently in Grade 12")).toBe(true);
  });
});

describe("collectsIdNumber", () => {
  it("always asks apply-eligible learners", () => {
    expect(collectsIdNumber("Currently in Grade 12", dobAged(17))).toBe(true);
  });

  it("asks younger learners only once they reach ID age (16)", () => {
    expect(collectsIdNumber("In Grade 9", dobAged(14))).toBe(false);
    expect(collectsIdNumber("In Grade 11", dobAged(16))).toBe(true);
  });
});

describe("interimResultsAvailable", () => {
  // Month index is 0-based: 1 = Feb, 3 = Apr, 6 = Jul, 8 = Sep.
  it("offers nothing before April", () => {
    expect(interimResultsAvailable(new Date(2026, 1, 15))).toEqual([]);
  });

  it("adds April term marks from April", () => {
    expect(interimResultsAvailable(new Date(2026, 3, 10))).toEqual([
      "grade_12_april",
    ]);
  });

  it("adds June marks mid-year", () => {
    expect(interimResultsAvailable(new Date(2026, 6, 1))).toEqual([
      "grade_12_april",
      "grade_12_june",
    ]);
  });

  it("adds September prelims in spring", () => {
    expect(interimResultsAvailable(new Date(2026, 8, 20))).toEqual([
      "grade_12_april",
      "grade_12_june",
      "grade_12_september",
    ]);
  });
});
