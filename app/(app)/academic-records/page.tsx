import type { Metadata } from "next";
import { AcademicRecordsForm } from "@/components/academic-records/records-form";
import { FormSection } from "@/components/ui/form-section";
import { PageHeader } from "@/components/layout/page-header";
import type { RecordType } from "@/lib/api/academic-records";

export const metadata: Metadata = {
  title: "Academic records",
};

// One section per record type. Grade 11 final is the required baseline — it
// feeds every university's subject grid. Grade 12 results are added as they
// arrive during the year: April first, then June mid-year marks.
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
];

export default function AcademicRecordsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader
        kicker="Your story"
        title="Academic records"
        description="Enter your results once. They decide which programmes universities match you with."
      />

      {SECTIONS.map((section) => (
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
