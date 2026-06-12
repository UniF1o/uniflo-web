import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { serverApiGet } from "@/lib/api/server";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Sprout } from "@/components/ui/motifs";
import { PageHeader } from "@/components/layout/page-header";
import { ApplicationList } from "@/components/applications/application-list";
import { CelebrationBanner } from "@/components/applications/celebration-banner";
import { Suspense } from "react";
import type { components } from "@/lib/api/schema";

export const metadata: Metadata = { title: "Applications" };

type ApplicationRead = components["schemas"]["ApplicationRead"];
type UniversitiesListResponse =
  components["schemas"]["UniversitiesListResponse"];

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const [applicationsResult, universitiesResult] = await Promise.all([
    serverApiGet<ApplicationRead[]>("/applications", token),
    serverApiGet<UniversitiesListResponse>("/universities", token),
  ]);

  const applications = applicationsResult.ok ? applicationsResult.data : null;

  // Build id → name lookup so ApplicationList can display names without
  // a second round-trip per row. University list is small for MVP (3–5 rows).
  const universityNames: Record<string, string> = {};
  if (universitiesResult.ok) {
    for (const u of universitiesResult.data.items) {
      universityNames[u.id] = u.name;
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Suspense boundary because CelebrationBanner uses useSearchParams,
       * which Next.js requires to be wrapped during SSR. */}
      <Suspense fallback={null}>
        <CelebrationBanner />
      </Suspense>

      <PageHeader
        kicker="Applying"
        title="Applications"
        description="Every application UniFlo sends on your behalf, with its live status. We flag anything that needs your attention."
      />

      {applications === null ? (
        <Alert tone="destructive">
          Could not load your applications. Refresh the page and try again.
        </Alert>
      ) : applications.length === 0 ? (
        <Card
          variant="paper"
          className="flex flex-col items-center gap-3 px-6 py-12 text-center"
        >
          <Sprout aria-hidden className="h-10 w-10 text-primary/40" />
          <p className="text-sm font-medium text-foreground">
            No applications yet
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Browse universities to start your first application.
          </p>
          <Link
            href="/universities"
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Browse universities
            <ArrowRight size={14} aria-hidden />
          </Link>
        </Card>
      ) : (
        <ApplicationList
          initialItems={applications}
          universityNames={universityNames}
        />
      )}
    </div>
  );
}
