import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileCompleteness } from "@/components/dashboard/completeness";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function fetchApplicationCounts(
  token: string,
): Promise<{ total: number; submitted: number } | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/applications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data: { items: Array<{ status: string }> } = await res.json();
    return {
      total: data.items.length,
      submitted: data.items.filter((a) => a.status === "submitted").length,
    };
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const appCounts = token ? await fetchApplicationCounts(token) : null;

  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Complete all three sections below before you can apply to
          universities.
        </p>
      </div>

      <ProfileCompleteness />

      {/* Applications summary — only shown once the student has submitted at
       * least one application to avoid surfacing an empty state on the dashboard. */}
      {appCounts !== null && appCounts.total > 0 && (
        <div className="rounded-lg border border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                Applications
              </p>
              <p className="text-xs text-muted-foreground">
                {appCounts.submitted} of {appCounts.total} submitted
              </p>
            </div>
            <Link
              href="/applications"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
