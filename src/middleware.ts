import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { canAccessRoute } from "@/lib/permissions";
import { normalizeRole } from "@/lib/tenant";
import type { UserRole } from "@/types/roles";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: request.nextUrl.protocol === "https:",
  });

  if (!token) {
    const url = new URL("/login", request.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = token.role as UserRole;
  const normalized = normalizeRole(role);

  if (pathname.startsWith("/super-admin")) {
    if (normalized !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
    }
    return NextResponse.next();
  }

  if (normalized === "SUPER_ADMIN" && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/super-admin", request.nextUrl.origin));
  }

  if (role && !canAccessRoute(role, pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/super-admin/:path*"],
};
