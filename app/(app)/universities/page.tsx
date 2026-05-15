import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { serverApiGet } from "@/lib/api/server";
import type { components } from "@/lib/api/schema";
import { SEED_UNIVERSITIES } from "@/lib/constants/seed-universities";
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
      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Universities
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse universities Uniflo supports and select the ones you want to
          apply to.
        </p>
      </div>

      <UniversityList initialUniversities={universities} />
    </div>
  );
}
