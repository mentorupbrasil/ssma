import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { canAccessRoute } from "@/lib/permissions";
import type { UserRole } from "@/types/roles";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const isDashboard = pathname.startsWith("/dashboard");
  const isLogin = pathname === "/login";

  if (isDashboard && !isLoggedIn) {
    const url = new URL("/login", request.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
  }

  if (isDashboard && isLoggedIn && token?.role) {
    if (!canAccessRoute(token.role as UserRole, pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
