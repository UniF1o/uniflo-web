// Profile setup page — entry point for the multi-step profile form.
//
// Lives under (app) so the auth gate in the route-group layout has already
// run by the time this renders. The page itself is a thin server component:
// it sets the browser tab title and renders the client-side form.
import type { Metadata } from "next";
import { ProfileSetupForm } from "@/components/profile/setup-form";

export const metadata: Metadata = {
  title: "Profile setup",
};

export default function ProfileSetupPage() {
  return (
    // max-w-2xl caps form width so long fields stay readable on wide screens.
    <div className="max-w-2xl">
      <ProfileSetupForm />
    </div>
  );
}
