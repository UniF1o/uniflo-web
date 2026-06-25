import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { serverApiGet } from "@/lib/api/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils/format";
import type { components } from "@/lib/api/schema";

type AdminStudentsResponse = components["schemas"]["AdminStudentsResponse"];

export const metadata: Metadata = { title: "Students — Admin" };

export default async function AdminStudentsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const result = await serverApiGet<AdminStudentsResponse>(
    "/admin/students?per_page=200",
    token,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Admin"
        title="Students"
        description={result.ok ? `${result.data.total} registered` : undefined}
      />

      {!result.ok ? (
        <Alert tone="destructive">
          Could not load students. Refresh the page and try again.
        </Alert>
      ) : result.data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students yet.</p>
      ) : (
        <Card variant="paper" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Profile</Th>
                  <Th className="text-right">Applications</Th>
                  <Th>Joined</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.data.items.map((student) => {
                  const name =
                    [student.first_name, student.last_name]
                      .filter(Boolean)
                      .join(" ") || null;
                  return (
                    <tr key={student.user_id} className="hover:bg-muted/20">
                      <Td>{name ?? <Muted>No name</Muted>}</Td>
                      <Td className="text-muted-foreground">{student.email}</Td>
                      <Td>
                        <span
                          className={
                            student.profile_complete
                              ? "text-xs font-medium text-green-700"
                              : "text-xs font-medium text-muted-foreground"
                          }
                        >
                          {student.profile_complete ? "Complete" : "Incomplete"}
                        </span>
                      </Td>
                      <Td className="text-right tabular-nums">
                        {student.application_count}
                      </Td>
                      <Td className="text-muted-foreground">
                        {formatDate(student.created_at) ?? "-"}
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

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}
