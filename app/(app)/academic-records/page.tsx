// Academic records page — entry point for the matric results form.
//
// Lives under (app) so the auth gate in the route-group layout has already
// verified the session before this renders. This page is a thin server
// component: it sets the browser tab title and renders the client form.
import type { Metadata } from "next";
import { AcademicRecordsForm } from "@/components/academic-records/records-form";

export const metadata: Metadata = {
  title: "Academic records",
};

export default function AcademicRecordsPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8 space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Academic records
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your matric results. These are used to match you with eligible
          university programmes.
        </p>
      </div>

      <AcademicRecordsForm />
    </div>
  );
}
