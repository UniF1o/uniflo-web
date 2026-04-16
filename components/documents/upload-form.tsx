// DocumentsUploadForm — manages the upload state for all three required documents.
//
// Three document zones are rendered in order: ID document, matric results,
// transcripts. Each zone tracks its own status independently.
//
// Upload progress uses XHR (not fetch). The Fetch API does not expose upload
// progress events in most environments, so XMLHttpRequest is used here so
// students on slow mobile connections see accurate progress feedback.
//
// On mount, existing uploads are fetched from GET /documents so the page
// correctly reflects the student's current state on revisit.
//
// Security constraints from docs/architecture-designs.md section 13:
//   — File contents are never logged (not even the file name in console).
//   — Raw Supabase Storage URLs are never shown to the user. The `storage_url`
//     field in the API response is intentionally ignored on the frontend.
//   — The JWT is sent in the Authorization header, never in query params.
//
// Types are hand-written until Partner B delivers the FastAPI OpenAPI spec.
// When available, replace ExistingDocument with the generated type.
"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, UploadCloud, AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

// The three document types the backend /documents endpoint accepts.
// These strings map directly to the `type` field in the multipart payload.
// Do not change without coordinating with Partner B.
type DocumentType = "id_document" | "matric_results" | "transcripts";

// Tracks the state of a single upload zone throughout its lifecycle.
//   idle      — no file chosen yet, or validation error shown before upload
//   uploading — XHR in progress, progress % is live
//   uploaded  — backend confirmed success, file name and timestamp are set
//   error     — network failure or API rejection, retrying is allowed
type UploadStatus = "idle" | "uploading" | "uploaded" | "error";

type ZoneState = {
  status: UploadStatus;
  fileName: string | null;   // Original file name from the user's device
  uploadedAt: string | null; // ISO timestamp returned by the backend on success
  progress: number;          // 0–100, driven by XHR upload progress events
  error: string | null;      // Validation or API error message, null when none
};

// Shape of each document record returned by GET /documents.
// Replace with the openapi-typescript generated type when the spec is available.
// The storage_url field is present in the API response but deliberately unused
// on the frontend — see the security note at the top of this file.
interface ExistingDocument {
  id: string;
  type: DocumentType;
  uploaded_at: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

// MIME types accepted for upload. Validated client-side before any network
// request is made so the user gets immediate feedback on unsupported files.
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

// 10 MB in bytes — warn and reject before uploading if the file exceeds this.
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Static config for each zone. The `type` value is sent directly to the backend.
const ZONE_CONFIGS: Array<{
  type: DocumentType;
  label: string;
  description: string;
}> = [
  {
    type: "id_document",
    label: "South African ID document",
    description: "Clear copy of your SA ID book or smart ID card.",
  },
  {
    type: "matric_results",
    label: "Matric results / NSC certificate",
    description: "Your official NSC results or matric certificate.",
  },
  {
    type: "transcripts",
    label: "Academic transcripts",
    description: "Official transcripts for any post-matric qualifications.",
  },
];

// Default state applied to each zone before any uploads or API load.
const INITIAL_ZONE: ZoneState = {
  status: "idle",
  fileName: null,
  uploadedAt: null,
  progress: 0,
  error: null,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Returns an error string if the file is invalid, or null if it passes.
// Called before the upload starts so the student gets instant feedback.
function validateFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return "Only PDF, JPG, and PNG files are accepted.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File is too large. Maximum size is 10 MB.";
  }
  return null;
}

// Converts an ISO timestamp (e.g. "2024-11-15T08:30:00Z") into a human-readable
// date and time string formatted for the South African locale.
function formatUploadDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoString));
}

// Uploads a file to POST /documents as multipart/form-data via XHR.
//
// XHR is used instead of fetch because the XMLHttpRequest.upload object fires
// progress events during the request body upload, which fetch does not expose.
// This allows us to update the progress bar as the file is sent.
//
// The Content-Type header is intentionally NOT set — the browser attaches the
// correct multipart boundary automatically when it sees FormData. Manually
// setting Content-Type without the boundary string breaks multipart parsing
// on the backend.
function uploadViaXhr(
  file: File,
  type: DocumentType,
  token: string,
  apiUrl: string,
  onProgress: (pct: number) => void,
): Promise<{ uploaded_at: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    // `file` carries the binary data. `type` tells the backend which document
    // slot to assign the upload to.
    formData.append("file", file);
    formData.append("type", type);

    // Fires repeatedly as the request body is sent to the server.
    // lengthComputable is false if the request size is unknown, so we guard it.
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    // Fires when the server has responded (regardless of status code).
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Parse the API response to get the uploaded_at timestamp.
        try {
          resolve(JSON.parse(xhr.responseText) as { uploaded_at: string });
        } catch {
          // Non-JSON success body — fall back to the current time so the
          // uploaded state still shows something meaningful.
          resolve({ uploaded_at: new Date().toISOString() });
        }
      } else {
        // Surface FastAPI's detail string if present, otherwise use a generic message.
        let message = "Upload failed. Please try again.";
        try {
          const body = JSON.parse(xhr.responseText) as { detail?: unknown };
          if (typeof body.detail === "string") message = body.detail;
        } catch {
          // Non-JSON error body — generic message is fine.
        }
        reject(new Error(message));
      }
    });

    // Fires on network-level failure (offline, DNS failure, timeout, etc.).
    xhr.addEventListener("error", () => {
      reject(
        new Error(
          "Unable to connect. Check your connection and try again.",
        ),
      );
    });

    xhr.open("POST", `${apiUrl}/documents`);
    // JWT in the Authorization header per the API convention used across all
    // endpoints in this project.
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  });
}

// ─── DocumentZoneCard ─────────────────────────────────────────────────────────
//
// Renders one document upload zone. The actual <input type="file"> is hidden
// and triggered programmatically so the clickable area can be styled freely.
//
// Status-dependent content:
//   idle      — "Select file" button + optional validation error
//   uploading — file name, progress percentage, progress bar
//   uploaded  — checkmark, file name (if known), upload timestamp, "Replace" button
//   error     — error message, "Try again" button (triggers a new file pick)

interface DocumentZoneCardProps {
  config: (typeof ZONE_CONFIGS)[number];
  state: ZoneState;
  // Called with the selected File object after the user picks one.
  onFileSelect: (file: File) => void;
}

function DocumentZoneCard({ config, state, onFileSelect }: DocumentZoneCardProps) {
  // Ref lets us call .click() on the hidden input from the styled button.
  const inputRef = useRef<HTMLInputElement>(null);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileSelect(file);
    // Reset the input value so selecting the exact same file a second time
    // still triggers the onChange event (browser skips it if value is unchanged).
    e.target.value = "";
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      {/* Zone label and description */}
      <div>
        <p className="text-sm font-medium text-foreground">{config.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
      </div>

      {/* Hidden file input — accepts PDF and image types */}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleInputChange}
        // aria-hidden so screen readers don't navigate to the raw input —
        // the visible button below is the accessible trigger.
        aria-hidden
      />

      {/* ── Idle: show upload button, and any validation error above it ───── */}
      {state.status === "idle" && (
        <div className="space-y-2">
          {state.error && (
            // role="alert" ensures screen readers announce the error immediately.
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
              <p role="alert" className="text-xs">
                {state.error}
              </p>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud size={16} aria-hidden />
            Select file
          </Button>
        </div>
      )}

      {/* ── Uploading: file name, progress percentage, and progress bar ───── */}
      {state.status === "uploading" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {/* truncate keeps long file names from overflowing on narrow screens */}
            <span className="truncate max-w-[200px]">{state.fileName}</span>
            <span className="tabular-nums">{state.progress}%</span>
          </div>
          {/* Progress track — the fill width is driven by state.progress (0–100) */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-150 ease-linear"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Uploaded: checkmark, file name (if known), timestamp, replace ── */}
      {state.status === "uploaded" && (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2
              size={14}
              className="mt-0.5 shrink-0 text-green-600"
              aria-hidden
            />
            <div className="min-w-0 space-y-0.5">
              {/* File name is only known when the student uploaded in this session.
               * When loaded from the API on revisit, fileName is null and we skip it. */}
              {state.fileName && (
                <p className="truncate text-xs font-medium text-foreground">
                  {state.fileName}
                </p>
              )}
              {state.uploadedAt && (
                <p className="text-xs text-muted-foreground">
                  Uploaded {formatUploadDate(state.uploadedAt)}
                </p>
              )}
            </div>
          </div>
          {/* Replace overwrites the existing upload — same endpoint, same type. */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => inputRef.current?.click()}
          >
            Replace
          </Button>
        </div>
      )}

      {/* ── Error: message and retry button ──────────────────────────────── */}
      {state.status === "error" && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-destructive">
            <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
            <p role="alert" className="text-xs">
              {state.error}
            </p>
          </div>
          {/* Retry opens the file picker again so the student can try the same
           * file or choose a different one. */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud size={16} aria-hidden />
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── DocumentsUploadForm ──────────────────────────────────────────────────────

export function DocumentsUploadForm() {
  // Each document type gets its own ZoneState. They update independently
  // so a slow upload on one document doesn't block the others.
  const [zones, setZones] = useState<Record<DocumentType, ZoneState>>({
    id_document: { ...INITIAL_ZONE },
    matric_results: { ...INITIAL_ZONE },
    transcripts: { ...INITIAL_ZONE },
  });

  // Read once at component initialisation. NEXT_PUBLIC_ vars are safe to read
  // in a client component — they're inlined at build time.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // On mount: fetch any documents the student has already uploaded and mark
  // those zones as uploaded. This ensures the page reflects real state on revisit.
  useEffect(() => {
    async function loadExistingDocuments() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      // No session or no API URL — zones stay idle. Not an error condition.
      if (!token || !apiUrl) return;

      try {
        const res = await fetch(`${apiUrl}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // A non-OK response (e.g. 404) just means no documents yet — stay idle.
        if (!res.ok) return;

        const docs = (await res.json()) as ExistingDocument[];

        setZones((prev) => {
          const next = { ...prev };
          for (const doc of docs) {
            // Skip documents whose type doesn't match any known zone — forward
            // compatibility if the backend adds new types later.
            if (!(doc.type in next)) continue;
            next[doc.type] = {
              status: "uploaded",
              // The original file name isn't stored in the documents table.
              // null here means the "uploaded" card shows only the timestamp.
              fileName: null,
              uploadedAt: doc.uploaded_at,
              progress: 100,
              error: null,
            };
          }
          return next;
        });
      } catch {
        // Network failure on load is non-fatal — zones stay idle and the
        // student can still upload. The error is not surfaced to avoid
        // confusing the student with a problem that doesn't block them.
      }
    }

    loadExistingDocuments();
  }, [apiUrl]);

  // Merges a partial update into a single zone's state without touching others.
  function updateZone(type: DocumentType, patch: Partial<ZoneState>) {
    setZones((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...patch },
    }));
  }

  // Called when the student picks a file from a zone's hidden file input.
  // Validates the file, then starts the XHR upload if it passes.
  async function handleFileSelect(type: DocumentType, file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      // Stay in idle so the student can pick again — just surface the error.
      updateZone(type, { status: "idle", error: validationError });
      return;
    }

    // Get the JWT to attach to the request.
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      updateZone(type, {
        status: "error",
        error: "Your session has expired. Please sign in again.",
      });
      return;
    }

    if (!apiUrl) {
      updateZone(type, {
        status: "error",
        error: "API URL is not configured. Contact support.",
      });
      return;
    }

    // Move to uploading state immediately so the student sees feedback.
    updateZone(type, {
      status: "uploading",
      fileName: file.name,
      progress: 0,
      error: null,
    });

    try {
      const result = await uploadViaXhr(
        file,
        type,
        token,
        apiUrl,
        // Each progress event patches only the progress field — other zone fields
        // are unchanged so we don't accidentally clear the file name mid-upload.
        (pct) => updateZone(type, { progress: pct }),
      );

      // Upload confirmed by the backend — mark the zone as done.
      updateZone(type, {
        status: "uploaded",
        uploadedAt: result.uploaded_at,
        progress: 100,
        error: null,
      });
    } catch (err) {
      // Surface the XHR rejection message and allow retry.
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      updateZone(type, {
        status: "error",
        progress: 0,
        error: message,
      });
    }
  }

  return (
    <div className="space-y-4">
      {ZONE_CONFIGS.map((config) => (
        <DocumentZoneCard
          key={config.type}
          config={config}
          state={zones[config.type]}
          onFileSelect={(file) => handleFileSelect(config.type, file)}
        />
      ))}
    </div>
  );
}
