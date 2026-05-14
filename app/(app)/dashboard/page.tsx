import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProfileCompleteness } from "@/components/dashboard/completeness";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    const data: Array<{ status: string }> = await res.json();
    return {
      total: data.length,
      submitted: data.filter((a) => a.status === "submitted").length,
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
    <div className="space-y-10">
      <div className="space-y-2">
        <Badge tone="info" dot>
          Dashboard
        </Badge>
        <h1 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">
          Welcome back.
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Complete the three sections below before you apply to universities.
          Once your profile is ready, head to{" "}
          <Link
            href="/universities"
            className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Universities
          </Link>{" "}
          to pick where to send applications.
        </p>
      </div>

      <ProfileCompleteness />

      {/* Applications summary — only shown once at least one application
       * exists so an empty state doesn't crowd the dashboard. */}
      {appCounts !== null && appCounts.total > 0 && (
        <Card variant="elevated" className="p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Applications
              </p>
              <p className="font-display text-2xl tracking-tight text-foreground">
                {appCounts.submitted}{" "}
                <span className="text-muted-foreground">/</span>{" "}
                {appCounts.total}
                <span className="ml-2 text-base text-muted-foreground">
                  submitted
                </span>
              </p>
            </div>
            <Link
              href="/applications"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              View all
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
