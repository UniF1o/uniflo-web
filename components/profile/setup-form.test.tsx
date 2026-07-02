import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// The form depends on the router and Supabase only on submit; stub both so the
// component renders in isolation (we exercise conditional rendering, not saves).
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getSession: async () => ({ data: { session: null } }) },
  }),
}));

import { ProfileSetupForm } from "@/components/profile/setup-form";

function selectActivity(value: string) {
  fireEvent.change(
    screen.getByLabelText("What best describes you right now?"),
    { target: { value } },
  );
}

describe("ProfileSetupForm — Step 1 conditional rendering", () => {
  it("leads with the applicant-type question", () => {
    render(<ProfileSetupForm />);
    expect(
      screen.getByLabelText("What best describes you right now?"),
    ).toBeInTheDocument();
  });

  it("swaps the SA ID for passport + permit on a non-SA citizenship", () => {
    render(<ProfileSetupForm />);
    selectActivity("Currently in Grade 12"); // apply-eligible → ID is asked for

    fireEvent.change(screen.getByLabelText("Citizenship status"), {
      target: { value: "SA Citizen" },
    });
    expect(
      screen.getByLabelText("South African ID number"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Passport number")).toBeNull();

    fireEvent.change(screen.getByLabelText("Citizenship status"), {
      target: { value: "International" },
    });
    expect(screen.getByLabelText("Passport number")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Study permit / visa type (optional)"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("South African ID number")).toBeNull();
  });

  it("shows a profile-only note for a Grade 8-11 explorer", () => {
    render(<ProfileSetupForm />);
    selectActivity("In Grade 9");
    expect(screen.getByText(/explore careers now/i)).toBeInTheDocument();
  });
});
