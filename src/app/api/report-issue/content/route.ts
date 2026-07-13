import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { maintenanceReportContent } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const DEFAULT: Omit<typeof maintenanceReportContent.$inferInsert, "id" | "updatedAt"> = {
  intro: "Report faults and issues with rooms or equipment. We'll take care of it as soon as possible.",
  heading: "",
  headingVisible: true,
  headingColor: null,
  blocks: "[]",
};

export async function GET() {
  try {
    const db = getDb();
    const [row] = await db.select().from(maintenanceReportContent).where(eq(maintenanceReportContent.id, "main")).limit(1);
    return NextResponse.json(row ?? { id: "main", ...DEFAULT });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as { blocks?: string; heading: string; headingVisible: boolean; headingColor?: string };
    const db = getDb();
    const now = new Date();

    const [existing] = await db.select().from(maintenanceReportContent).where(eq(maintenanceReportContent.id, "main")).limit(1);

    if (existing) {
      const [updated] = await db
        .update(maintenanceReportContent)
        .set({ blocks: body.blocks ?? "[]", heading: body.heading, headingVisible: body.headingVisible, headingColor: body.headingColor ?? null, updatedAt: now })
        .where(eq(maintenanceReportContent.id, "main"))
        .returning();
      revalidatePath("/about/report-issue");
      return NextResponse.json(updated);
    } else {
      const [created] = await db
        .insert(maintenanceReportContent)
        .values({ id: "main", ...DEFAULT, blocks: body.blocks ?? "[]", heading: body.heading ?? "", headingVisible: body.headingVisible ?? true, headingColor: body.headingColor ?? null, updatedAt: now })
        .returning();
      revalidatePath("/about/report-issue");
      return NextResponse.json(created);
    }
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
