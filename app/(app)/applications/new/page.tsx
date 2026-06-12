import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { serverApiGet } from "@/lib/api/server";
import { isAutomationBlocked } from "@/lib/constants/profile-enums";
import { Alert } from "@/components/ui/alert";
import { SelectionGuard } from "@/components/applications/selection-guard";
import { NewApplicationsForm } from "@/components/applications/new-applications-form";
import type { components } from "@/lib/api/schema";

export const metadata: Metadata = { title: "New Application" };

type StudentProfileResponse = components["schemas"]["StudentProfileResponse"];

export default async function NewApplicationPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  // The automation only supports students currently in Grade 12 — running it
  // for anyone else fails server-side ("form_submit_failed"), so blocked
  // students are stopped here rather than after a doomed submission. A failed
  // profile fetch falls open: the review screen re-checks before posting.
  const profileResult = await serverApiGet<StudentProfileResponse>(
    "/profile",
    token,
  );
  const activity = profileResult.ok
    ? profileResult.data.current_activity
    : null;

  if (isAutomationBlocked(activity)) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          New application
        </h1>
        <Alert
          tone="warning"
          role="status"
          title="Automated applications aren't available for your situation yet"
        >
          Uniflo currently only submits on behalf of students in Grade 12, and
          your profile says you&apos;re &ldquo;{activity}&rdquo;. Please apply
          directly on each university&apos;s portal — you&apos;ll find the
          portal links on the{" "}
          <Link
            href="/universities"
            className="font-medium underline underline-offset-2"
          >
            universities page
          </Link>
          . If your situation has changed,{" "}
          <Link
            href="/profile/edit"
            className="font-medium underline underline-offset-2"
          >
            update your profile
          </Link>
          .
        </Alert>
      </div>
    );
  }

  return (
    <SelectionGuard>
      <NewApplicationsForm />
    </SelectionGuard>
  );
}
