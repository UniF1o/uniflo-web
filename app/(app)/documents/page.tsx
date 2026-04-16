// Documents page — entry point for the document upload flow.
//
// Lives under (app) so the auth gate in the route-group layout has already
// verified the session before this renders. This page is a thin server
// component: it sets the browser tab title and renders the client upload form.
import type { Metadata } from "next";
import { DocumentsUploadForm } from "@/components/documents/upload-form";

export const metadata: Metadata = {
  title: "Documents",
};

export default function DocumentsPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8 space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          Documents
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload your supporting documents. Accepted formats: PDF, JPG, PNG.
          Maximum file size: 10 MB per document.
        </p>
      </div>

      <DocumentsUploadForm />
    </div>
  );
}
