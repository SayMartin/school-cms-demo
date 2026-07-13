import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { participantStory } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(participantStory)
      .orderBy(desc(participantStory.createdAt));
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as {
      name: string;
      graduationYear?: number | null;
      courseName?: string | null;
      story: string;
      imageKey?: string | null;
      published?: boolean;
    };

    const db = getDb();
    const now = new Date();
    const id = crypto.randomUUID();
    await db
      .insert(participantStory)
      .values({
        id,
        name: body.name,
        graduationYear: body.graduationYear ?? null,
        courseName: body.courseName ?? null,
        story: body.story,
        imageKey: body.imageKey ?? null,
        published: body.published ?? false,
        createdAt: now,
        updatedAt: now,
      });
    const [row] = await db
      .select()
      .from(participantStory)
      .where(eq(participantStory.id, id))
      .limit(1);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
