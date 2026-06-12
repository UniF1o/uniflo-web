import type { Metadata } from "next";
import { AcademicRecordsForm } from "@/components/academic-records/records-form";
import type { RecordType } from "@/lib/api/academic-records";

export const metadata: Metadata = {
  title: "Academic records",
};

// One section per record type. Grade 11 final is the required baseline — it
// feeds every university's subject grid. Grade 12 results are added as they
// arrive during the year.
// TODO: add grade_12_june here once uniflo-api PR #49's RecordType lands in
// the deployed spec and types are regenerated.
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
      "Add these once you have them — universities use your most recent marks.",
  },
];

export default function AcademicRecordsPage() {
  return (
    <div className="max-w-2xl space-y-12">
      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Academic records
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your results. These are used to match you with eligible
          university programmes.
        </p>
      </div>

      {SECTIONS.map((section) => (
        <section key={section.type} className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {section.heading}
            </h2>
            <p className="text-sm text-muted-foreground">
              {section.description}
            </p>
          </div>
          <AcademicRecordsForm recordType={section.type} />
        </section>
      ))}
    </div>
  );
}
