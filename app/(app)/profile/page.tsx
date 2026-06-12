// Profile overview — shows the student's saved personal details.
//
// The sidebar and user-menu both link here, so it exists as the landing
// point for /profile. Fetches the current profile from the backend and
// renders a read-only summary plus an "Edit" link back to /profile/setup.
//
// If the student has no profile yet (404), they are routed into the setup
// flow automatically — matching the behaviour of the dashboard.
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileOverview } from "@/components/profile/overview";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader
        kicker="Your story"
        title="Profile"
        description="Your personal details on file. Keep these up to date so we can apply on your behalf."
        action={
          <Link
            href="/profile/edit"
            className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            Edit
          </Link>
        }
      />

      <ProfileOverview />
    </div>
  );
}
