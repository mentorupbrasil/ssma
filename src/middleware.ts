import { NextResponse } from "next/server";
import { auth } from "@/lib/auth.edge";
import { canAccessRoute } from "@/lib/permissions";
import type { UserRole } from "@/types/roles";

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const role = request.auth?.user?.role as UserRole | undefined;

  if (pathname.startsWith("/dashboard") && role) {
    if (!canAccessRoute(role, pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
