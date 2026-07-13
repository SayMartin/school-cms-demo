import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { studyGuidanceContent } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const DEFAULT: Omit<typeof studyGuidanceContent.$inferInsert, "id" | "updatedAt"> = {
  sections: "[]",
  heading: "",
  headingVisible: true,
  headingColor: null,
  blocks: "[]",
  sidebarProfileIds: "[]",
};

function migrateFromSections(sections: string): string {
  try {
    const secs = JSON.parse(sections ?? "[]") as { id: string; heading: string; body: string }[];
    return JSON.stringify(secs.map((s) => ({
      id: s.id, type: "section" as const, heading: s.heading, headingVisible: !!s.heading, body: s.body,
    })));
  } catch { return "[]"; }
}

export async function GET() {
  try {
    const db = getDb();
    const [row] = await db.select().from(studyGuidanceContent).where(eq(studyGuidanceContent.id, "main")).limit(1);
    const data = row ?? { ...DEFAULT };
    const rawBlocks = data.blocks ?? "[]";
    const hasBlocks = (() => { try { return (JSON.parse(rawBlocks) as unknown[]).length > 0; } catch { return false; } })();
    const blocks = hasBlocks ? rawBlocks : migrateFromSections(data.sections);
    return NextResponse.json({ ...(row ?? { id: "main", ...DEFAULT }), blocks, sidebarProfileIds: row?.sidebarProfileIds ?? "[]" });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as Partial<Omit<typeof studyGuidanceContent.$inferInsert, "id" | "updatedAt">>;
    const db = getDb();
    const now = new Date();

    const [existing] = await db.select().from(studyGuidanceContent).where(eq(studyGuidanceContent.id, "main")).limit(1);

    if (existing) {
      const [updated] = await db
        .update(studyGuidanceContent)
        .set({ ...body, updatedAt: now })
        .where(eq(studyGuidanceContent.id, "main"))
        .returning();
      revalidatePath("/about/study-guidance");
      return NextResponse.json(updated);
    } else {
      const [created] = await db
        .insert(studyGuidanceContent)
        .values({ id: "main", ...DEFAULT, ...body, updatedAt: now })
        .returning();
      revalidatePath("/about/study-guidance");
      return NextResponse.json(created);
    }
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
