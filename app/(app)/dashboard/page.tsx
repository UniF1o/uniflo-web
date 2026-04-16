// Dashboard page — the first screen a signed-in student lands on.
//
// Lives under (app) so the auth gate in the route-group layout has already
// verified the session. This page is a thin server component: it sets the
// title and renders the client-side completeness indicator.
//
// If the student has no profile yet, the completeness component redirects
// them to /profile/setup automatically before any dashboard content shows.
import type { Metadata } from "next";
import { ProfileCompleteness } from "@/components/dashboard/completeness";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Complete all three sections below before you can apply to universities.
        </p>
      </div>

      <ProfileCompleteness />
    </div>
  );
}
