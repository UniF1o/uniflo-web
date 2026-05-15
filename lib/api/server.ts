// Server-side fetch helper for the uniflo-api backend.
//
// The browser-side `apiClient` (lib/api/client.ts) reads the JWT from the
// Supabase browser client; that doesn't work in a Server Component, where
// the token is already in the request context. This module is the equivalent
// for server pages: pass in the token from `supabase.auth.getSession()` and
// get back a discriminated result so callers can branch on 404 vs other
// failures (the application detail page distinguishes those to render the
// not-found UI vs an error banner).

export type ServerFetch<T> =
  | { ok: true; data: T }
  | { ok: false; status: number | "error" };

export async function serverApiGet<T>(
  path: string,
  token: string | null,
): Promise<ServerFetch<T>> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  // No URL or no session → indistinguishable from a transient failure for
  // most callers, who just render an error banner. Detail pages that need
  // to differentiate 404 should check `status === 404` first.
  if (!apiUrl || !token) return { ok: false, status: "error" };
  try {
    const res = await fetch(`${apiUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { ok: false, status: res.status };
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, status: "error" };
  }
}
