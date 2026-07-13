import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db/client";
import { session, user } from "@/lib/db/schema";
import {
  hasProdStudioAccess,
  hasDevStudioAccess,
  hasRestaurantAccess,
  hasFacilitiesAccess,
} from "@/lib/auth/roles";

// ---------------------------------------------------------------------------
// Route protection middleware (Edge runtime — required for Cloudflare Workers)
//
// Public routes (no auth needed):
//   /                       Homepage
//   /education-programs/*   Course pages
//   /news/*                 News pages
//   /about, /summer-courses, /venues, /boarding, /restaurant, /contact
//   /api/auth/*             Auth endpoints
//   /create-account         Account application (public)
//   /account-pending        Pending/inactive account info page (public)
//   /forgot-password        Forgot password (public)
//   /reset-password         Reset password (public)
//
// Protected routes:
//   /studio/*              prod: admin | staff | developer
//                          dev:  admin | developer
//   /restaurant-admin/*     Requires role: admin | restaurant | developer
//   /facilities/*           Requires role: admin | facilities
//   /admin/*                Requires role: admin
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    "/studio/:path*",
    "/restaurant-admin/:path*",
    "/facilities/:path*",
    "/admin/:path*",
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  if (!sessionToken) {
    return redirectToSignIn(request);
  }

  const token = sessionToken.split(".")[0];

  const db = getDb();
  const [authSession] = await db
    .select({ role: user.role, status: user.status })
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(and(eq(session.token, token), gt(session.expiresAt, new Date())))
    .limit(1);

  if (!authSession) {
    return redirectToSignIn(request);
  }

  // Non-active accounts (pending, archived, rejected) cannot access protected routes
  if (authSession.status !== "active") {
    return NextResponse.redirect(new URL("/account-pending", request.url));
  }

  const role = authSession.role;

  if (pathname.startsWith("/studio")) {
    let appEnv: string | undefined;
    try {
      appEnv = getCloudflareContext().env.APP_ENV;
    } catch {}
    const allowed = appEnv === "dev" ? hasDevStudioAccess(role) : hasProdStudioAccess(role);
    if (!allowed) return NextResponse.redirect(new URL("/403", request.url));
  }

  if (pathname.startsWith("/restaurant-admin") && !hasRestaurantAccess(role)) {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  if (pathname.startsWith("/facilities") && !hasFacilitiesAccess(role)) {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  return NextResponse.next();
}

function redirectToSignIn(request: NextRequest) {
  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(signInUrl);
}
