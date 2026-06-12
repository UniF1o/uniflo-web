// Documents page — entry point for the document upload flow.
//
// Lives under (app) so the auth gate in the route-group layout has already
// verified the session before this renders. This page is a thin server
// component: it sets the browser tab title and renders the client upload form.
import type { Metadata } from "next";
import { DocumentsUploadForm } from "@/components/documents/upload-form";
import { PageHeader } from "@/components/layout/page-header";
import { PrivacyNote } from "@/components/ui/privacy-note";

export const metadata: Metadata = {
  title: "Documents",
};

export default function DocumentsPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        className="mb-8"
        kicker="Your story"
        title={
          <>
            Your <span className="text-primary">documents.</span>
          </>
        }
        description="Upload your supporting documents. Accepted formats: PDF, JPG, PNG. Maximum file size: 10 MB per document."
      />

      <DocumentsUploadForm />
      <PrivacyNote className="mt-8" />
    </div>
  );
}
