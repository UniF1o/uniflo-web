import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// edit-form loads the profile via fetch on mount; stub the router, Supabase
// session, and the API URL so it renders in isolation.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: { access_token: "t" } } }),
    },
  }),
}));

import { ProfileEditForm } from "@/components/profile/edit-form";

// A DOB exactly `years` ago (midyear, to avoid birthday edge cases).
function dobAged(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setMonth(5, 15);
  return d.toISOString().slice(0, 10);
}

function mockProfile(overrides: Record<string, unknown>) {
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      first_name: "Thabo",
      last_name: "Dlamini",
      is_sa_citizen: true,
      ...overrides,
    }),
  })) as unknown as typeof fetch;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("ProfileEditForm — eligibility gating", () => {
  it("does not require an SA ID for a young profile-only learner", async () => {
    mockProfile({
      current_activity: "In Grade 9",
      date_of_birth: dobAged(14),
      id_number: null,
    });
    render(<ProfileEditForm />);
    await waitFor(() =>
      expect(
        screen.getByLabelText("What best describes you right now?"),
      ).toBeInTheDocument(),
    );
    // Under 16 + profile-only: no SA-ID field, and the guardian block shows.
    expect(screen.queryByLabelText("South African ID number")).toBeNull();
    expect(screen.getByText("Parent or guardian consent")).toBeInTheDocument();
  });

  it("requires the SA ID for an apply-eligible matriculant", async () => {
    mockProfile({
      current_activity: "Currently in Grade 12",
      date_of_birth: dobAged(18),
      id_number: "0801015009087",
    });
    render(<ProfileEditForm />);
    await waitFor(() =>
      expect(
        screen.getByLabelText("What best describes you right now?"),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByLabelText("South African ID number"),
    ).toBeInTheDocument();
    // Adult, so no guardian block.
    expect(screen.queryByText("Parent or guardian consent")).toBeNull();
  });
});
