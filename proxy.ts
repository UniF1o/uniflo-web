// Next.js 16 Proxy — runs before every matched request.
//
// Responsibilities: (1) enforce basic-auth gate when BASIC_AUTH_CREDENTIALS is
// set; (2) refresh the Supabase auth session so Server Components always see a
// valid JWT and users are not silently logged out.
//
// Breaking change from Next.js <=15: this file was middleware.ts exporting
// middleware(). Next.js 16 renamed it to proxy.ts exporting proxy().
// Source: node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

function isAuthorized(request: NextRequest): boolean {
  const credentials = process.env.BASIC_AUTH_CREDENTIALS;
  if (!credentials) return true; // env var absent — skip gate (local dev)

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;

  const decoded = atob(header.slice(6));
  return credentials
    .split(",")
    .map((pair) => pair.trim())
    .includes(decoded);
}

export async function proxy(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="UniFlo"' },
    });
  }
  return await updateSession(request);
}

export const config = {
  // Match every path except Next.js internals and static assets — no need to
  // refresh a session for a request fetching an image or a CSS file.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
