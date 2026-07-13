import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { folkEducationContent } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const [row] = await db.select().from(folkEducationContent).where(eq(folkEducationContent.id, "main")).limit(1);
    return NextResponse.json({ blocks: row?.blocks ?? "[]", heading: row?.heading ?? "", headingVisible: row?.headingVisible ?? true, headingColor: row?.headingColor ?? undefined });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as { blocks: string; heading: string; headingVisible: boolean; headingColor?: string };
    const db = getDb();
    const now = new Date();

    const [existing] = await db.select().from(folkEducationContent).where(eq(folkEducationContent.id, "main")).limit(1);

    if (existing) {
      const [updated] = await db
        .update(folkEducationContent)
        .set({ blocks: body.blocks, heading: body.heading, headingVisible: body.headingVisible, headingColor: body.headingColor ?? null, updatedAt: now })
        .where(eq(folkEducationContent.id, "main"))
        .returning();
      revalidatePath("/folk-education");
      return NextResponse.json(updated);
    } else {
      const [created] = await db
        .insert(folkEducationContent)
        .values({ id: "main", blocks: body.blocks ?? "[]", heading: body.heading ?? "", headingVisible: body.headingVisible ?? true, headingColor: body.headingColor ?? null, updatedAt: now })
        .returning();
      revalidatePath("/folk-education");
      return NextResponse.json(created);
    }
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
