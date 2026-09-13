import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE,
  canAccessPath,
  homeForRole,
  parseSession,
} from "@/features/auth/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = parseSession(request.cookies.get(AUTH_COOKIE)?.value);

  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!canAccessPath(session.role, pathname)) {
      return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
    }

    return NextResponse.next();
  }

  if ((pathname === "/login" || pathname === "/registration") && session) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/login", "/registration"],
};
