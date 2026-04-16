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
import { ProfileOverview } from "@/components/profile/overview";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-3xl tracking-tight text-foreground">
            Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Your personal details on file. Keep these up to date so we can apply
            on your behalf.
          </p>
        </div>
        {/* Edit action — sends the student back to the setup flow. */}
        <Link
          href="/profile/setup"
          className="shrink-0 rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
        >
          Edit
        </Link>
      </div>

      <ProfileOverview />
    </div>
  );
}
