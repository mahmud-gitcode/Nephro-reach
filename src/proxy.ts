import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { RETIRED_COOKIES } from "@/lib/data/legacyPurge";

/* ==========================================================================
   The proxy makes no auth decision (Phase 2, INT-1)
   --------------------------------------------------------------------------
   Who is signed in is the API's answer to GET /me/context, read in the
   browser by AuthProvider and DashboardGuard. The proxy cannot know it:
   - the API's `access_token` cookie lives at most 15 minutes and may have
     expired while the refresh cookie (Path=/api/v1/auth) is still good;
   - in production the API cookie belongs to the API host and is not sent
     here at all.
   So the proxy never redirects on a cookie. Its one job is to expire the
   prototype's retired session cookie if a request still carries one: the
   server-side twin of the client purge (lib/data/legacyPurge.ts).
   ========================================================================== */

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  for (const name of RETIRED_COOKIES) {
    if (request.cookies.has(name)) {
      response.cookies.set({ name, value: "", path: "/", maxAge: 0 });
    }
  }
  return response;
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/login", "/registration"],
};
