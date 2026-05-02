import type { Metadata } from "next";
import { SelectionGuard } from "@/components/applications/selection-guard";
import { NewApplicationsForm } from "@/components/applications/new-applications-form";

export const metadata: Metadata = { title: "New Application" };

export default function NewApplicationPage() {
  return (
    <SelectionGuard>
      <NewApplicationsForm />
    </SelectionGuard>
  );
}
