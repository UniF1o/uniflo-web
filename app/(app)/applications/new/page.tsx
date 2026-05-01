import type { Metadata } from "next";
import { SelectionGuard } from "@/components/applications/selection-guard";

export const metadata: Metadata = { title: "New Application" };

// Task 4 fills in the application form here. The SelectionGuard redirects
// to /universities if the student arrives with nothing selected.
export default function NewApplicationPage() {
  return (
    <SelectionGuard>
      <div className="max-w-2xl space-y-8">
        <div className="space-y-1">
          <h1 className="font-display text-3xl tracking-tight text-foreground">
            Apply
          </h1>
          <p className="text-sm text-muted-foreground">
            Add programme details for each selected university.
          </p>
        </div>
      </div>
    </SelectionGuard>
  );
}
