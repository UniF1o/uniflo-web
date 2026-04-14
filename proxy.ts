// Next.js 16 Proxy — runs before every matched request.
//
// Sole responsibility: refresh the Supabase auth session so Server Components
// always see a valid JWT and users are not silently logged out.
//
// Breaking change from Next.js <=15: this file was middleware.ts exporting
// middleware(). Next.js 16 renamed it to proxy.ts exporting proxy().
// Source: node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
import type { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Match every path except Next.js internals and static assets — no need to
  // refresh a session for a request fetching an image or a CSS file.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
