// Next.js 16 Proxy (formerly known as Middleware in Next.js <= 15).
//
// This file runs on every request that matches the `config.matcher` below,
// before any page or route handler renders. We use it for one job only:
// refreshing the Supabase auth session so server-rendered pages always see a
// valid JWT and users do not get silently logged out.
//
// The actual refresh logic lives in `lib/supabase/middleware.ts` so the
// session-handling code can be unit tested in isolation from Next.js'
// request lifecycle.
//
// Note (Next.js 16 breaking change): in earlier versions this file was
// `middleware.ts` and exported a `middleware` function. Next.js 16 renamed
// the convention to `proxy.ts` exporting a `proxy` function. Functionality
// is otherwise identical. Source:
// node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
import type { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Run on every path EXCEPT the ones in the negative-lookahead below, so we
  // don't waste work refreshing sessions on static assets and favicons.
  //
  // - _next/static, _next/image: built-in Next.js static asset routes
  // - favicon.ico, *.svg/png/jpg/jpeg/gif/webp: image files
  //
  // If you later add public API routes that should NOT see auth cookies,
  // exclude them here too.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
