import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { serverApiGet } from "@/lib/api/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import type { components } from "@/lib/api/schema";

type AdminStatsResponse = components["schemas"]["AdminStatsResponse"];

export const metadata: Metadata = { title: "Admin" };

const STATUS_LABELS: Record<string, string> = {
  pending: "Queued",
  processing: "Submitting",
  action_required: "Action needed",
  submitted: "Submitted",
  failed: "Failed",
  unknown: "Unknown",
};

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const result = await serverApiGet<AdminStatsResponse>("/admin/stats", token);

  if (!result.ok) {
    return (
      <div className="space-y-8">
        <PageHeader kicker="Admin" title="Overview" />
        <Alert tone="destructive">
          Could not load stats. Refresh the page and try again.
        </Alert>
      </div>
    );
  }

  const { total_students, active_universities, applications_by_status } =
    result.data;
  const total_applications = applications_by_status.reduce(
    (sum, s) => sum + s.count,
    0,
  );

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Admin"
        title="Overview"
        description="Platform activity at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Students" value={total_students} />
        <StatCard label="Active universities" value={active_universities} />
        <StatCard label="Total applications" value={total_applications} />
      </div>

      {applications_by_status.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Applications by status
          </h2>
          <Card variant="paper" className="divide-y divide-border">
            {applications_by_status.map((row) => (
              <div
                key={row.status}
                className="flex items-center justify-between px-5 py-3"
              >
                <span className="text-sm text-foreground">
                  {STATUS_LABELS[row.status] ?? row.status}
                </span>
                <span className="font-display text-xl text-foreground">
                  {row.count}
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card variant="paper" className="flex flex-col gap-1 px-6 py-5">
      <span className="font-display text-4xl text-foreground">{value}</span>
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
    </Card>
  );
}
