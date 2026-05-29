import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_THRESHOLD,
  formatConfidencePercent,
  isLowConfidence,
} from "@/lib/constants/confidence";

describe("CONFIDENCE_THRESHOLD", () => {
  it("matches the value Partner B locked in shared config", () => {
    expect(CONFIDENCE_THRESHOLD).toBe(0.85);
  });
});

describe("isLowConfidence", () => {
  it("flags scores strictly below the threshold", () => {
    expect(isLowConfidence(0.0)).toBe(true);
    expect(isLowConfidence(0.5)).toBe(true);
    expect(isLowConfidence(0.849)).toBe(true);
  });

  it("does not flag the threshold itself", () => {
    expect(isLowConfidence(0.85)).toBe(false);
  });

  it("does not flag scores above the threshold", () => {
    expect(isLowConfidence(0.9)).toBe(false);
    expect(isLowConfidence(1.0)).toBe(false);
  });
});

describe("formatConfidencePercent", () => {
  it("rounds to the nearest whole percent", () => {
    expect(formatConfidencePercent(0.871)).toBe("87%");
    expect(formatConfidencePercent(0.875)).toBe("88%");
    expect(formatConfidencePercent(0.5)).toBe("50%");
  });

  it("handles edge values cleanly", () => {
    expect(formatConfidencePercent(0)).toBe("0%");
    expect(formatConfidencePercent(1)).toBe("100%");
  });
});
