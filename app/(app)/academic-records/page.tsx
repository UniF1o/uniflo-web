import type { Metadata } from "next";
import { AcademicRecordsForm } from "@/components/academic-records/records-form";
import { FormSection } from "@/components/ui/form-section";
import { PageHeader } from "@/components/layout/page-header";
import type { RecordType } from "@/lib/api/academic-records";
import {
  interimResultsAvailable,
  type InterimRecordType,
} from "@/lib/eligibility";

export const metadata: Metadata = {
  title: "Academic records",
};

// One section per record type. Grade 11 final is the required baseline — it
// feeds every university's subject grid. Grade 12 results are added as they
// arrive. grade_12_final is for students who have already completed matric
// (gap-year, prior-year school-leaver).
const SECTIONS: { type: RecordType; heading: string; description: string }[] = [
  {
    type: "grade_11_final",
    heading: "Grade 11 final results",
    description: "Required for all applications.",
  },
  {
    type: "grade_12_april",
    heading: "Grade 12 April results",
    description:
      "Add these once you have them. Universities use your most recent marks.",
  },
  {
    type: "grade_12_june",
    heading: "Grade 12 June results",
    description:
      "Add your mid-year marks once you have them. UCT uses these alongside your April results.",
  },
  {
    type: "grade_12_september",
    heading: "Grade 12 September (prelims)",
    description:
      "Add your prelim marks once you have them. These are your latest interim results before finals.",
  },
  {
    type: "grade_12_final",
    heading: "Grade 12 final results",
    description:
      "Already completed matric? Enter your certified NSC results here. These are used instead of interim marks.",
  },
];

// Interim Grade 12 sets are only offered once they are plausibly available by
// the current month (a current matric learner cannot have June marks in March).
// Grade 11 final and Grade 12 final are always shown.
const INTERIM_TYPES = new Set<RecordType>([
  "grade_12_april",
  "grade_12_june",
  "grade_12_september",
]);

export default function AcademicRecordsPage() {
  const available = new Set<InterimRecordType>(interimResultsAvailable());
  const sections = SECTIONS.filter(
    (s) =>
      !INTERIM_TYPES.has(s.type) || available.has(s.type as InterimRecordType),
  );

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader
        kicker="Your story"
        title="Academic records"
        description="Enter your results once. They decide which programmes universities match you with."
      />

      {sections.map((section) => (
        <FormSection
          key={section.type}
          title={section.heading}
          description={section.description}
        >
          <AcademicRecordsForm recordType={section.type} />
        </FormSection>
      ))}
    </div>
  );
}
