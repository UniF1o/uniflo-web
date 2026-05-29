import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  FieldMappingReview,
  summariseConfidence,
} from "@/components/applications/field-mapping-review";
import type { FieldMappingEntry } from "@/lib/api/phase-3";

function entry(
  overrides: Partial<FieldMappingEntry> & {
    field_id: string;
    confidence: number;
  },
): FieldMappingEntry {
  return {
    label: "Field",
    value: "value",
    reasoning: "",
    source_profile_field: null,
    ...overrides,
  };
}

describe("summariseConfidence", () => {
  it("counts flagged and auto-filled entries against the 0.85 threshold", () => {
    const result = summariseConfidence([
      entry({ field_id: "a", confidence: 0.95 }),
      entry({ field_id: "b", confidence: 0.85 }),
      entry({ field_id: "c", confidence: 0.7 }),
      entry({ field_id: "d", confidence: 0.6 }),
    ]);
    expect(result).toEqual({ total: 4, flagged: 2, autoFilled: 2 });
  });

  it("treats an empty list as zero everywhere", () => {
    expect(summariseConfidence([])).toEqual({
      total: 0,
      flagged: 0,
      autoFilled: 0,
    });
  });
});

describe("FieldMappingReview", () => {
  const defaultProps = {
    universityId: "u-1",
    universityName: "Test University",
    confirmed: false,
    onConfirmToggle: vi.fn(),
    onRefresh: vi.fn(),
  };

  it("renders low-confidence rows and a per-university confirm checkbox", () => {
    render(
      <FieldMappingReview
        {...defaultProps}
        state={{
          kind: "ready",
          entries: [
            entry({
              field_id: "school-leaving-results",
              label: "School-leaving results",
              confidence: 0.62,
              value: "Maths 78%",
              reasoning: "Free-text mapping required",
            }),
            entry({
              field_id: "first-name",
              label: "First name",
              confidence: 0.95,
              value: "Alex",
            }),
          ],
        }}
      />,
    );

    // Low-confidence row is rendered with its label.
    expect(screen.getByText("School-leaving results")).toBeInTheDocument();
    // High-confidence row is summarised, not listed individually.
    expect(screen.queryByText("First name")).not.toBeInTheDocument();
    expect(screen.getByText(/1 other field was/)).toBeInTheDocument();
    // The confirm checkbox exists.
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("renders the all-confident state without a confirm checkbox", () => {
    render(
      <FieldMappingReview
        {...defaultProps}
        state={{
          kind: "ready",
          entries: [
            entry({
              field_id: "ok-1",
              label: "OK 1",
              confidence: 0.95,
            }),
            entry({
              field_id: "ok-2",
              label: "OK 2",
              confidence: 0.92,
            }),
          ],
        }}
      />,
    );

    expect(
      screen.getByText(/All fields auto-filled with high confidence/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("renders the mapping-in-progress state with a refresh button", () => {
    const onRefresh = vi.fn();
    render(
      <FieldMappingReview
        {...defaultProps}
        onRefresh={onRefresh}
        state={{ kind: "unavailable" }}
      />,
    );

    expect(
      screen.getByText(/Mapping in progress — refresh shortly/),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: /Refresh field mappings for Test University/i,
      }),
    );
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("toggles the confirm checkbox via the parent callback", () => {
    const onConfirmToggle = vi.fn();
    render(
      <FieldMappingReview
        {...defaultProps}
        onConfirmToggle={onConfirmToggle}
        state={{
          kind: "ready",
          entries: [
            entry({
              field_id: "f",
              label: "Field",
              confidence: 0.5,
            }),
          ],
        }}
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(onConfirmToggle).toHaveBeenCalledWith(true);
  });
});
