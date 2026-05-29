import { describe, expect, it } from "vitest";
import { getFailureCopy, isRetryable } from "@/lib/applications/failure-copy";
import type { JobErrorCode } from "@/lib/api/phase-3";

// All codes the UI knows about. Must match the union in phase-3.ts — the
// type system will catch a mismatch if a new code is added without copy.
const ALL_CODES: JobErrorCode[] = [
  "portal_changed",
  "auth_failed",
  "validation_failed",
  "timeout",
  "portal_unavailable",
  "unknown",
];

describe("getFailureCopy", () => {
  it("returns a non-empty headline for every code", () => {
    for (const code of ALL_CODES) {
      const copy = getFailureCopy(code);
      expect(copy.headline).toBeTruthy();
      expect(typeof copy.headline).toBe("string");
    }
  });

  it("splices the validation message into the headline", () => {
    const copy = getFailureCopy("validation_failed", {
      message: "Programme code is invalid.",
    });
    expect(copy.headline).toContain("Programme code is invalid.");
  });

  it("falls back gracefully when validation_failed lacks a message", () => {
    const copy = getFailureCopy("validation_failed");
    expect(copy.headline).toBe("The portal rejected the application.");
  });

  it("splices the university name into portal_unavailable copy", () => {
    const copy = getFailureCopy("portal_unavailable", {
      universityName: "UCT",
    });
    expect(copy.headline).toBe(
      "Applications to UCT are temporarily unavailable.",
    );
  });

  it("falls back to a generic university label when name missing", () => {
    const copy = getFailureCopy("portal_unavailable");
    expect(copy.headline).toContain("this university");
  });

  it("marks portal_changed and auth_failed as not retryable by default", () => {
    expect(getFailureCopy("portal_changed").defaultRetryable).toBe(false);
    expect(getFailureCopy("auth_failed").defaultRetryable).toBe(false);
  });

  it("marks the rest as retryable by default", () => {
    for (const code of [
      "validation_failed",
      "timeout",
      "portal_unavailable",
      "unknown",
    ] as JobErrorCode[]) {
      expect(getFailureCopy(code).defaultRetryable).toBe(true);
    }
  });
});

describe("isRetryable", () => {
  it("uses the backend value when provided", () => {
    expect(isRetryable("portal_changed", true)).toBe(true);
    expect(isRetryable("unknown", false)).toBe(false);
  });

  it("falls back to the per-code default when undefined", () => {
    expect(isRetryable("portal_changed", undefined)).toBe(false);
    expect(isRetryable("timeout", undefined)).toBe(true);
  });
});
