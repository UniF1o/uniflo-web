import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { serverApiGet } from "@/lib/api/server";
import { recommendationsPath } from "@/lib/api/recommendations";
import { PageHeader } from "@/components/layout/page-header";
import { CoursesView } from "@/components/courses/courses-view";
import type { components } from "@/lib/api/schema";

export const metadata: Metadata = {
  title: "Courses",
};

type UniversitiesListResponse =
  components["schemas"]["UniversitiesListResponse"];
type RecommendationsResponse = components["schemas"]["RecommendationsResponse"];

// UP is the default because it has the most seeded programmes.
// The ID is stable — it's a prod database record, not an env var.
const DEFAULT_UNIVERSITY_SLUG = "university of pretoria";

export default async function CoursesPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? null;

  // Fetch the full university list to drive the picker.
  const unisResult = await serverApiGet<UniversitiesListResponse>(
    "/universities",
    token,
  );
  const universities = unisResult.ok ? unisResult.data.items : [];

  // Pick the default university (UP by name match, fall back to first active).
  const defaultUni =
    universities.find((u) =>
      u.name.toLowerCase().includes(DEFAULT_UNIVERSITY_SLUG),
    ) ??
    universities.find((u) => u.is_active) ??
    universities[0];

  const defaultUniId = defaultUni?.id ?? "";

  // Server-fetch the first paint — avoids a loading flash on /courses.
  // A 409 (no_academic_record) is surfaced to the view as `initialNoRecord`.
  let initialData: RecommendationsResponse | null = null;
  let initialNoRecord = false;

  if (defaultUniId && token) {
    const recResult = await serverApiGet<RecommendationsResponse>(
      recommendationsPath(defaultUniId),
      token,
    );
    if (recResult.ok) {
      initialData = recResult.data;
    } else if (recResult.status === 409) {
      initialNoRecord = true;
    }
  }

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader
        kicker="Applying"
        title="Courses"
        description="See every programme you qualify for based on your current marks."
      />

      <CoursesView
        universities={universities}
        defaultUniversityId={defaultUniId}
        initialData={initialData}
        initialNoRecord={initialNoRecord}
      />
    </div>
  );
}
