"use client";

// Journey — the single source of truth for "where is this student on the
// road from blank profile to submitted applications".
//
// Five stages: Profile → Marks → Documents → Apply → Track. The provider
// fetches the four backing resources once per mount (the (app) layout), and
// every consumer — sidebar mini, dashboard rail, next-step card — reads the
// same computed state, so the app never disagrees with itself about what to
// do next. Pages that change journey data (e.g. saving a record) can call
// `refresh()`.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiClient, ApiError } from "@/lib/api/client";
import { REQUIRED_DOC_TYPES } from "@/lib/constants/documents";
import type { components } from "@/lib/api/schema";

type ApplicationRead = components["schemas"]["ApplicationRead"];
type AcademicRecordResponse = components["schemas"]["AcademicRecordResponse"];
type DocumentResponse = components["schemas"]["DocumentResponse"];
type StudentProfileResponse = components["schemas"]["StudentProfileResponse"];

export type JourneyStageId =
  | "profile"
  | "marks"
  | "documents"
  | "apply"
  | "track";

export type StageState = "complete" | "current" | "upcoming";

export interface JourneyStage {
  id: JourneyStageId;
  label: string;
  href: string;
  state: StageState;
}

export interface NextStep {
  stage: JourneyStageId;
  // Copy for the next-step card: a short imperative title, one supporting
  // sentence, and the CTA label.
  title: string;
  body: string;
  href: string;
  cta: string;
  // True when the step is an action-required application rather than a
  // missing setup section — consumers render it in the warning tone.
  urgent: boolean;
}

interface JourneyValue {
  loading: boolean;
  stages: JourneyStage[];
  nextStep: NextStep | null;
  applications: ApplicationRead[];
  actionRequiredCount: number;
  // The student's profile, for greetings etc. Null while loading or absent.
  profile: StudentProfileResponse | null;
  // True when GET /profile 404'd — the student hasn't done setup at all.
  // The dashboard uses this to bounce straight to /profile/setup.
  profileMissing: boolean;
  refresh: () => void;
}

const STAGE_META: Record<JourneyStageId, { label: string; href: string }> = {
  profile: { label: "Profile", href: "/profile" },
  marks: { label: "Marks", href: "/academic-records" },
  documents: { label: "Documents", href: "/documents" },
  apply: { label: "Apply", href: "/universities" },
  track: { label: "Track", href: "/applications" },
};

const STAGE_ORDER: readonly JourneyStageId[] = [
  "profile",
  "marks",
  "documents",
  "apply",
  "track",
];

// Next-step copy per first-incomplete stage. `track` is special-cased in
// computeNextStep because its copy depends on live application state.
const NEXT_STEP_COPY: Record<
  Exclude<JourneyStageId, "track">,
  Omit<NextStep, "stage" | "urgent">
> = {
  profile: {
    title: "Set up your profile",
    body: "Tell us about yourself once — we reuse it on every application you send.",
    href: "/profile/setup",
    cta: "Start your profile",
  },
  marks: {
    title: "Add your Grade 11 marks",
    body: "Universities use these results to match you with programmes you qualify for.",
    href: "/academic-records",
    cta: "Add your marks",
  },
  documents: {
    title: "Upload your documents",
    body: "Your certified ID and results — ready the moment any university asks.",
    href: "/documents",
    cta: "Upload documents",
  },
  apply: {
    title: "Choose your universities",
    body: "Your story is ready. Pick the universities you want and we handle the forms.",
    href: "/universities",
    cta: "Browse universities",
  },
};

const JourneyContext = createContext<JourneyValue | null>(null);

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState<Record<JourneyStageId, boolean>>({
    profile: false,
    marks: false,
    documents: false,
    apply: false,
    track: false,
  });
  const [applications, setApplications] = useState<ApplicationRead[]>([]);
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);

  const load = useCallback(async () => {
    // Each resource resolves independently — one failing endpoint must not
    // blank the whole journey, so every check defaults to "incomplete".
    const [profileRes, recordRes, docsRes, appsRes] = await Promise.allSettled([
      apiClient.get<StudentProfileResponse>("/profile"),
      apiClient.get<AcademicRecordResponse | null>("/academic-records"),
      apiClient.get<DocumentResponse[]>("/documents"),
      apiClient.get<ApplicationRead[]>("/applications"),
    ]);

    const profileOk = profileRes.status === "fulfilled";
    setProfile(profileOk ? profileRes.value : null);
    setProfileMissing(
      profileRes.status === "rejected" &&
        profileRes.reason instanceof ApiError &&
        profileRes.reason.status === 404,
    );
    const marksOk = recordRes.status === "fulfilled" && recordRes.value != null;

    let docsOk = false;
    if (docsRes.status === "fulfilled") {
      const types = new Set(docsRes.value.map((d) => d.type));
      docsOk = REQUIRED_DOC_TYPES.every((t) => types.has(t));
    }

    const apps = appsRes.status === "fulfilled" ? appsRes.value : [];
    const applyOk = apps.length > 0;
    // Track "completes" only when every application has landed — during the
    // season it stays the live, current stage.
    const trackOk = applyOk && apps.every((a) => a.status === "submitted");

    setComplete({
      profile: profileOk,
      marks: marksOk,
      documents: docsOk,
      apply: applyOk,
      track: trackOk,
    });
    setApplications(apps);
    setLoading(false);
  }, []);

  useEffect(() => {
    // queueMicrotask defers the first setState out of the effect body —
    // keeps the cascading-render lint happy (same pattern as review-screen).
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  // First incomplete stage is "current"; everything after it "upcoming".
  const firstIncomplete = STAGE_ORDER.find((id) => !complete[id]) ?? null;

  const stages: JourneyStage[] = STAGE_ORDER.map((id) => ({
    id,
    ...STAGE_META[id],
    state: complete[id]
      ? "complete"
      : id === firstIncomplete
        ? "current"
        : "upcoming",
  }));

  const actionRequiredCount = applications.filter(
    (a) => a.status === "action_required",
  ).length;

  let nextStep: NextStep | null = null;
  if (!loading) {
    if (actionRequiredCount > 0) {
      // A paused run outranks everything — the student is blocking it.
      nextStep = {
        stage: "track",
        title:
          actionRequiredCount === 1
            ? "A university portal needs something from you"
            : `${actionRequiredCount} university portals need something from you`,
        body: "Open the application and answer the portal's request so we can keep going.",
        href: "/applications",
        cta: "Resolve it now",
        urgent: true,
      };
    } else if (firstIncomplete && firstIncomplete !== "track") {
      nextStep = {
        stage: firstIncomplete,
        ...NEXT_STEP_COPY[firstIncomplete],
        urgent: false,
      };
    } else if (firstIncomplete === "track") {
      nextStep = {
        stage: "track",
        title: "Track your applications",
        body: "Your applications are in flight. We'll surface anything that needs you here.",
        href: "/applications",
        cta: "Open applications",
        urgent: false,
      };
    }
    // firstIncomplete === null → everything done, including track. No card.
  }

  return (
    <JourneyContext.Provider
      value={{
        loading,
        stages,
        nextStep,
        applications,
        actionRequiredCount,
        profile,
        profileMissing,
        refresh,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney(): JourneyValue {
  const value = useContext(JourneyContext);
  if (!value) {
    throw new Error("useJourney must be used inside JourneyProvider");
  }
  return value;
}
