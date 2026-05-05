import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ApplicationList } from "@/components/applications/application-list";
import type { components } from "@/lib/api/schema";

export const metadata: Metadata = { title: "Applications" };

type ApplicationWithJob = components["schemas"]["ApplicationWithJob"];
type University = components["schemas"]["University"];

async function fetchApplications(
  token: string,
): Promise<ApplicationWithJob[] | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/applications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data: { items: ApplicationWithJob[] } = await res.json();
    return data.items;
  } catch {
    return null;
  }
}

async function fetchUniversities(token: string): Promise<University[] | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/universities`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data: { items: University[] } = await res.json();
    return data.items;
  } catch {
    return null;
  }
}

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const [applications, universities] = await Promise.all([
    token ? fetchApplications(token) : Promise.resolve(null),
    token ? fetchUniversities(token) : Promise.resolve(null),
  ]);

  // Build id → name lookup so ApplicationList can display names without
  // a second round-trip per row. University list is small for MVP (3–5 rows).
  const universityNames: Record<string, string> = {};
  for (const u of universities ?? []) {
    universityNames[u.id] = u.name;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Applications
        </h1>
        <p className="text-sm text-muted-foreground">
          Track every application Uniflo has submitted on your behalf.
        </p>
      </div>

      {applications === null ? (
        <p className="text-sm text-destructive">
          Could not load your applications. Refresh the page and try again.
        </p>
      ) : applications.length === 0 ? (
        <div className="rounded-lg border border-border px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            No applications yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse universities to start your first application.
          </p>
          <Link
            href="/universities"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Browse universities →
          </Link>
        </div>
      ) : (
        <ApplicationList
          initialItems={applications}
          universityNames={universityNames}
        />
      )}
    </div>
  );
}
