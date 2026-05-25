import type { Metadata } from "next";
import { AcademicRecordsForm } from "@/components/academic-records/records-form";

export const metadata: Metadata = {
  title: "Academic records",
};

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

      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Grade 11 final results
          </h2>
          <p className="text-sm text-muted-foreground">
            Required for all applications.
          </p>
        </div>
        <AcademicRecordsForm recordType="grade_11_final" />
      </section>

      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Grade 12 April results
          </h2>
          <p className="text-sm text-muted-foreground">
            Required by UCT and some other universities. Add these once you have
            your April results.
          </p>
        </div>
        <AcademicRecordsForm recordType="grade_12_april" />
      </section>
    </div>
  );
}
