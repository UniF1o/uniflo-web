import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { serverApiGet } from "@/lib/api/server";
import { careerProgrammesPath } from "@/lib/api/careers";
import { PageHeader } from "@/components/layout/page-header";
import { CareerProgrammesView } from "@/components/careers/career-programmes-view";
import { Alert } from "@/components/ui/alert";
import type { components } from "@/lib/api/schema";

export const metadata: Metadata = {
  title: "Career Programmes",
};

type CareerProgrammesResponse =
  components["schemas"]["CareerProgrammesResponse"];

interface CareerProgrammesPageProps {
  params: Promise<{ id: string }>;
}

export default async function CareerProgrammesPage({
  params,
}: CareerProgrammesPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  let data: CareerProgrammesResponse | null = null;
  let error: string | null = null;

  if (token) {
    const result = await serverApiGet<CareerProgrammesResponse>(
      careerProgrammesPath(id),
      token,
    );
    if (result.ok) {
      data = result.data;
    } else if (result.status === 404) {
      error = "This career was not found.";
    } else if (result.status === 409) {
      error =
        "Add your academic record first so we can match your marks to programmes.";
    } else {
      error = "Couldn't load programmes. Please try again.";
    }
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div className="space-y-1">
        <Link
          href="/careers"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={12} aria-hidden />
          Back to Careers
        </Link>

        {data && (
          <PageHeader
            kicker="Discover"
            title={data.career_title}
            description="University programmes that lead to this career, matched to your marks."
          />
        )}
      </div>

      {error && <Alert tone="destructive">{error}</Alert>}
      {data && <CareerProgrammesView data={data} />}
    </div>
  );
}
