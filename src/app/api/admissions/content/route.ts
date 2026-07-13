import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { admissionsContent } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const DEFAULT: Omit<typeof admissionsContent.$inferInsert, "id" | "updatedAt"> = {
  sections: "[]",
  heading: "",
  headingVisible: true,
  headingColor: null,
  blocks: "[]",
};

function migrateFromSections(sectionsJson: string): string {
  try {
    const sections = JSON.parse(sectionsJson ?? "[]") as { id: string; heading: string; body: string }[];
    if (!sections.length) return "[]";
    return JSON.stringify(
      sections.map((s) => ({
        id: s.id,
        type: "section" as const,
        heading: s.heading,
        headingVisible: !!s.heading,
        body: s.body,
      }))
    );
  } catch { return "[]"; }
}

export async function GET() {
  try {
    const db = getDb();
    const [row] = await db.select().from(admissionsContent).where(eq(admissionsContent.id, "main")).limit(1);
    const rawBlocks = row?.blocks ?? "[]";
    const hasBlocks = (() => { try { return (JSON.parse(rawBlocks) as unknown[]).length > 0; } catch { return false; } })();
    const blocks = hasBlocks ? rawBlocks : migrateFromSections(row?.sections ?? "[]");
    return NextResponse.json({ ...(row ?? { id: "main", ...DEFAULT }), blocks });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as Partial<Omit<typeof admissionsContent.$inferInsert, "id" | "updatedAt">>;
    const db = getDb();
    const now = new Date();

    const [existing] = await db.select().from(admissionsContent).where(eq(admissionsContent.id, "main")).limit(1);

    if (existing) {
      const [updated] = await db
        .update(admissionsContent)
        .set({ ...body, updatedAt: now })
        .where(eq(admissionsContent.id, "main"))
        .returning();
      revalidatePath("/about/apply");
      return NextResponse.json(updated);
    } else {
      const [created] = await db
        .insert(admissionsContent)
        .values({ id: "main", ...DEFAULT, ...body, updatedAt: now })
        .returning();
      revalidatePath("/about/apply");
      return NextResponse.json(created);
    }
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
