import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated =
    request.cookies.get("next-auth.session-token") ??
    request.cookies.get("__Secure-next-auth.session-token");

  const protectedPaths = [
    "/dashboard",
    "/feedback",
    "/analytics",
    "/themes",
    "/ask-loop",
    "/reports",
    "/settings",
  ];

  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/feedback/:path*",
    "/analytics/:path*",
    "/themes/:path*",
    "/ask-loop/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};