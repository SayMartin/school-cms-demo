import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { requireAdminAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireAdminAccess(request);
  if (access.response) return access.response;

  try {
    const db = getDb();
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt));

    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
