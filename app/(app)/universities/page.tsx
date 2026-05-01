import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { components } from "@/lib/api/schema";
import { SEED_UNIVERSITIES } from "@/lib/constants/seed-universities";
import { UniversityList } from "@/components/universities/university-list";

export const metadata: Metadata = {
  title: "Universities",
};

type University = components["schemas"]["University"];

async function fetchInitialUniversities(token: string): Promise<University[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return [];
  try {
    const res = await fetch(`${apiUrl}/universities`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items: University[] };
    return data.items;
  } catch {
    return [];
  }
}

export default async function UniversitiesPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const fromApi = session?.access_token
    ? await fetchInitialUniversities(session.access_token)
    : [];
  const universities = fromApi.length > 0 ? fromApi : SEED_UNIVERSITIES;

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
