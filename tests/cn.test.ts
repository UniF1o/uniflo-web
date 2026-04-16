// Unit test for the `cn` class-joining utility.
//
// `cn` is tiny but load-bearing — every component in the app uses it to
// compose Tailwind classes. These tests lock in the two behaviours we rely
// on: joining truthy strings with spaces, and silently dropping falsy values
// (null/undefined/false) so callers can write `isActive && "..."` inline.
import { describe, it, expect } from "vitest";
import { cn } from "../lib/utils/cn";

describe("cn", () => {
  it("joins truthy string arguments with single spaces", () => {
    expect(cn("px-4", "text-sm", "text-foreground")).toBe(
      "px-4 text-sm text-foreground",
    );
  });

  it("drops null, undefined, and false values", () => {
    expect(cn("px-4", null, undefined, false, "text-sm")).toBe("px-4 text-sm");
  });

  it("supports conditional classes via short-circuit evaluation", () => {
    const isActive = true;
    const isDisabled = false;
    expect(
      cn("btn", isActive && "btn-active", isDisabled && "opacity-50"),
    ).toBe("btn btn-active");
  });

  it("returns an empty string when given no truthy inputs", () => {
    expect(cn(undefined, null, false)).toBe("");
  });
});
