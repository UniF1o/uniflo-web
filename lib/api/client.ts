// Thin fetch wrapper for the uniflo-api backend.
//
// All request methods read the Supabase JWT at call time (not at module load)
// so long-open pages don't send an expired token on the next interaction.
//
// Usage:
//   import { apiClient, ApiError } from "@/lib/api/client";
//   import type { components } from "@/lib/api/schema";
//
//   type Profile = components["schemas"]["ProfileResponse"];
//   const profile = await apiClient.get<Profile>("/profile");
import { createClient } from "@/lib/supabase/client";

// ─── Error type ──────────────────────────────────────────────────────────────

// Thrown for any non-2xx response. Callers can narrow on `status` to render
// specific UI (e.g. 404 → redirect, 400 → deadline-closed banner).
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API error ${status}`);
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function getToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");

  const token = await getToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Don't set Content-Type for FormData — the browser must attach the
  // multipart boundary string automatically or the server can't parse the body.
  if (!(init.body instanceof FormData)) {
    headers["Content-Type"] ??= "application/json";
  }

  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // Non-JSON error body — leave body as null.
    }
    throw new ApiError(res.status, body);
  }

  // 204 No Content — nothing to parse.
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── Public client ────────────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>(path),

  post: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(path: string): Promise<T> =>
    request<T>(path, { method: "DELETE" }),
};
