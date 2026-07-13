import { NextResponse } from "next/server";
import { createAuth } from "@/lib/auth/auth";
import {
  hasStudioAccess,
  hasRestaurantAccess,
  hasAdminAccess,
  hasFacilitiesAccess,
} from "@/lib/auth/roles";
import { getDb } from "@/lib/db/client";

type Auth = ReturnType<typeof createAuth>;
type AuthSession = Awaited<ReturnType<Auth["api"]["getSession"]>>;

type StudioAccessResult =
  | { session: NonNullable<AuthSession>; response?: never }
  | { session?: never; response: NextResponse };

export async function requireStudioAccess(
  request: Request
): Promise<StudioAccessResult> {
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
