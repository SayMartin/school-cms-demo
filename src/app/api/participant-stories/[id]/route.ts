import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { participantStory } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const [row] = await db.select().from(participantStory).where(eq(participantStory.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const { id } = await params;
    const body = await req.json() as {
      name: string;
      graduationYear?: number | null;
      courseName?: string | null;
      story: string;
      imageKey?: string | null;
      published: boolean;
    };

    const db = getDb();
    const [updated] = await db
      .update(participantStory)
      .set({
        name: body.name,
        graduationYear: body.graduationYear ?? null,
        courseName: body.courseName ?? null,
        story: body.story,
        imageKey: body.imageKey ?? null,
        published: body.published,
        updatedAt: new Date(),
      })
      .where(eq(participantStory.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidatePath("/participant-stories");
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const { id } = await params;
    const db = getDb();
    await db.delete(participantStory).where(eq(participantStory.id, id));
    revalidatePath("/participant-stories");
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
