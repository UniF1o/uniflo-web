import { describe, expect, it } from "vitest";
import { isPortalUnavailable, parseJobError } from "@/lib/api/phase-3";

describe("parseJobError", () => {
  it("returns null for null / undefined input", () => {
    expect(parseJobError(null)).toBeNull();
    expect(parseJobError(undefined)).toBeNull();
  });

  it("wraps free-text errors as unknown + retryable", () => {
    const parsed = parseJobError("Boom");
    expect(parsed).toEqual({
      code: "unknown",
      message: "Boom",
      retryable: true,
    });
  });

  it("preserves a fully-structured error verbatim", () => {
    const parsed = parseJobError({
      code: "validation_failed",
      message: "Programme not recognised",
      retryable: true,
    });
    expect(parsed).toEqual({
      code: "validation_failed",
      message: "Programme not recognised",
      retryable: true,
    });
  });

  it("normalises an unknown code to 'unknown'", () => {
    const parsed = parseJobError({
      code: "rocket_failed",
      message: "Wat",
    });
    expect(parsed?.code).toBe("unknown");
  });

  it("defaults retryable to true when omitted", () => {
    const parsed = parseJobError({
      code: "timeout",
      message: "Slow",
    });
    expect(parsed?.retryable).toBe(true);
  });

  it("returns null for shapes that don't match either form", () => {
    expect(parseJobError(42)).toBeNull();
    expect(parseJobError({ irrelevant: true })).toBeNull();
  });
});

describe("isPortalUnavailable", () => {
  it("recognises the 503 body shape", () => {
    expect(
      isPortalUnavailable({ code: "portal_unavailable", university: "UCT" }),
    ).toBe(true);
  });

  it("rejects other shapes", () => {
    expect(isPortalUnavailable(null)).toBe(false);
    expect(isPortalUnavailable({})).toBe(false);
    expect(isPortalUnavailable({ code: "auth_failed" })).toBe(false);
    expect(isPortalUnavailable("portal_unavailable")).toBe(false);
  });
});
