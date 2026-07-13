import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { natureLifeCoursesContent } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const [row] = await db.select().from(natureLifeCoursesContent).where(eq(natureLifeCoursesContent.id, "main")).limit(1);
    return NextResponse.json(row ?? { id: "main", departmentId: null, imageKey: null, blocks: "[]", heading: "", headingVisible: true, headingColor: undefined });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as { blocks?: string; departmentId?: string | null; imageKey?: string | null; heading: string; headingVisible: boolean; headingColor?: string };
    const db = getDb();
    const now = new Date();

    const [existing] = await db.select().from(natureLifeCoursesContent).where(eq(natureLifeCoursesContent.id, "main")).limit(1);

    if (existing) {
      const [updated] = await db
        .update(natureLifeCoursesContent)
        .set({ blocks: body.blocks ?? "[]", departmentId: body.departmentId ?? null, imageKey: body.imageKey ?? null, heading: body.heading, headingVisible: body.headingVisible, headingColor: body.headingColor ?? null, updatedAt: now })
        .where(eq(natureLifeCoursesContent.id, "main"))
        .returning();
      revalidatePath("/education-programs/nature-life-courses");
      return NextResponse.json(updated);
    } else {
      const [created] = await db
        .insert(natureLifeCoursesContent)
        .values({ id: "main", blocks: body.blocks ?? "[]", departmentId: body.departmentId ?? null, imageKey: body.imageKey ?? null, heading: body.heading ?? "", headingVisible: body.headingVisible ?? true, headingColor: body.headingColor ?? null, updatedAt: now })
        .returning();
      revalidatePath("/education-programs/nature-life-courses");
      return NextResponse.json(created);
    }
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
