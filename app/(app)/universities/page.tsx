import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { serverApiGet } from "@/lib/api/server";
import type { components } from "@/lib/api/schema";
import { SEED_UNIVERSITIES } from "@/lib/constants/seed-universities";
import { PageHeader } from "@/components/layout/page-header";
import { UniversityList } from "@/components/universities/university-list";

export const metadata: Metadata = {
  title: "Universities",
};

type UniversitiesListResponse =
  components["schemas"]["UniversitiesListResponse"];

export default async function UniversitiesPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  const result = await serverApiGet<UniversitiesListResponse>(
    "/universities",
    token,
  );
  // Fall back to seed data when the backend is unreachable so local dev and
  // staging-without-data still render something useful.
  const universities =
    result.ok && result.data.items.length > 0
      ? result.data.items
      : SEED_UNIVERSITIES;

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader
        kicker="Applying"
        title="Universities"
        description="Browse the universities UniFlo supports and select the ones you want to apply to."
      />

      <UniversityList initialUniversities={universities} />
    </div>
  );
}
