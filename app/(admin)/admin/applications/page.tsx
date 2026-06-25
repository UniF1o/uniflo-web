import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { serverApiGet } from "@/lib/api/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";
import type { components } from "@/lib/api/schema";

type AdminApplicationsResponse =
  components["schemas"]["AdminApplicationsResponse"];

export const metadata: Metadata = { title: "Applications — Admin" };

type BadgeTone = "info" | "success" | "warning" | "destructive" | "neutral";

const STATUS_TONE: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: "Queued", tone: "neutral" },
  processing: { label: "Submitting", tone: "info" },
  action_required: { label: "Action needed", tone: "warning" },
  submitted: { label: "Submitted", tone: "success" },
  failed: { label: "Failed", tone: "destructive" },
};

export default async function AdminApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const result = await serverApiGet<AdminApplicationsResponse>(
    "/admin/applications?per_page=200",
    token,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Admin"
        title="Applications"
        description={result.ok ? `${result.data.total} total` : undefined}
      />

      {!result.ok ? (
        <Alert tone="destructive">
          Could not load applications. Refresh the page and try again.
        </Alert>
      ) : result.data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No applications yet.</p>
      ) : (
        <Card variant="paper" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <Th>Student</Th>
                  <Th>University</Th>
                  <Th>Programme</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.data.items.map((app) => {
                  const badge = app.status
                    ? (STATUS_TONE[app.status] ?? {
                        label: app.status,
                        tone: "neutral" as BadgeTone,
                      })
                    : null;
                  return (
                    <tr key={app.id} className="hover:bg-muted/20">
                      <Td>
                        <div className="font-medium">
                          {app.student_name ?? (
                            <span className="text-muted-foreground">
                              No name
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {app.student_email}
                        </div>
                      </Td>
                      <Td>{app.university_name}</Td>
                      <Td className="max-w-[200px] truncate text-muted-foreground">
                        {app.programme}
                      </Td>
                      <Td>
                        {badge ? (
                          <Badge tone={badge.tone}>{badge.label}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </Td>
                      <Td className="text-muted-foreground">
                        {formatDate(app.created_at) ?? "-"}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${className ?? ""}`}>{children}</td>;
}
