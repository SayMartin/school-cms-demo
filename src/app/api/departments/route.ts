import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { department } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const coursesOnly = searchParams.get("courses") === "true";
    const db = getDb();
    const items = await db
      .select()
      .from(department)
      .where(coursesOnly ? eq(department.isCourseDepartment, true) : undefined)
      .orderBy(asc(department.sortOrder));
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as { name: string; sortOrder?: number };

    const db = getDb();
    const [item] = await db
      .insert(department)
      .values({
        id: crypto.randomUUID(),
        name: body.name,
        sortOrder: body.sortOrder ?? 0,
      })
      .returning();
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
