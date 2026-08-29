// Role guards for API routes. Every privileged endpoint funnels through one of
// these, which makes them the one place worth spending a rate-limit token: the
// Studio password is published on /sign-in, so an authenticated caller is not a
// trusted one. Reads are left alone — only mutations are counted.
import { NextResponse } from "next/server";
import { createAuth } from "@/lib/auth/auth";
import {
  hasStudioAccess,
  hasRestaurantAccess,
  hasAdminAccess,
  hasFacilitiesAccess,
} from "@/lib/auth/roles";
import { getDb } from "@/lib/db/client";
import { rateLimit, isMutation } from "@/lib/rate-limit";

type Auth = ReturnType<typeof createAuth>;
type AuthSession = Awaited<ReturnType<Auth["api"]["getSession"]>>;

type StudioAccessResult =
  | { session: NonNullable<AuthSession>; response?: never }
  | { session?: never; response: NextResponse };

export async function requireStudioAccess(
  request: Request
): Promise<StudioAccessResult> {
  const limited = isMutation(request.method)
    ? await rateLimit(request, "WRITE_LIMITER")
    : null;
  if (limited) return { response: limited };

  const db = getDb();
  const auth = createAuth(db);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!hasStudioAccess(session.user.role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session };
}

export async function requireAdminAccess(
  request: Request
): Promise<StudioAccessResult> {
  const limited = isMutation(request.method)
    ? await rateLimit(request, "WRITE_LIMITER")
    : null;
  if (limited) return { response: limited };

  const db = getDb();
  const auth = createAuth(db);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!hasAdminAccess(session.user.role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session };
}

export async function requireRestaurantAccess(
  request: Request
): Promise<StudioAccessResult> {
  const limited = isMutation(request.method)
    ? await rateLimit(request, "WRITE_LIMITER")
    : null;
  if (limited) return { response: limited };

  const db = getDb();
  const auth = createAuth(db);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!hasRestaurantAccess(session.user.role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session };
}

export async function requireFacilitiesAccess(
  request: Request
): Promise<StudioAccessResult> {
  const limited = isMutation(request.method)
    ? await rateLimit(request, "WRITE_LIMITER")
    : null;
  if (limited) return { response: limited };

  const db = getDb();
  const auth = createAuth(db);
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!hasFacilitiesAccess(session.user.role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session };
}
