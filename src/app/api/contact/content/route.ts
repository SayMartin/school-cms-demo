import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { contactContent } from "@/lib/db/schema";
import type { SectionBlock } from "@/lib/blocks";

export const dynamic = "force-dynamic";

const DEFAULT_FIELDS: Omit<typeof contactContent.$inferInsert, "id" | "updatedAt" | "blocks"> = {
  addressStreet: "School Road 12",
  addressCity: "281 00 Exampleton",
  phone: "010-123 45 00",
  email: "exp@exempel-folkhogskola.se",
  invoiceEmail: "faktura@exempel-folkhogskola.se",
  invoiceNote: "Please send the invoice in PDF format.",
  bankgiro: "123-4567",
  officeHours: "",
  absenceNotice: "",
  heading: "",
  headingVisible: true,
  headingColor: null,
};

const DEFAULT_BLOCKS: SectionBlock[] = [
  {
    id: "default-office-hours",
    type: "section",
    heading: "The front desk is staffed",
    headingVisible: true,
    body: "<p><strong>Monday–Thursday</strong> 08:00–15:00</p><p><strong>Friday</strong> 08:00–13:00</p><p><strong>Lunch</strong> 12:00–12:30</p>",
  },
  {
    id: "default-absence",
    type: "section",
    heading: "Reporting an absence",
    headingVisible: true,
    body: "<p>Report an absence via SchoolSoft or directly to the front desk at <a href=\"mailto:exp@exempel-folkhogskola.se\">exp@exempel-folkhogskola.se</a>. Remember to also notify the Social Insurance Agency (Försäkringskassan).</p>",
  },
];

export async function GET() {
  try {
    const db = getDb();
    const [row] = await db.select().from(contactContent).where(eq(contactContent.id, "main")).limit(1);
    const parsed = (() => { try { return JSON.parse(row?.blocks ?? "[]"); } catch { return []; } })();
    const blocks = (parsed as unknown[]).length ? row!.blocks : JSON.stringify(DEFAULT_BLOCKS);
    return NextResponse.json({ ...(row ?? { id: "main", ...DEFAULT_FIELDS }), blocks });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as Partial<Omit<typeof contactContent.$inferInsert, "id" | "updatedAt">>;
    const db = getDb();
    const now = new Date();

    const [existing] = await db.select().from(contactContent).where(eq(contactContent.id, "main")).limit(1);

    if (existing) {
      const [updated] = await db
        .update(contactContent)
        .set({ ...body, updatedAt: now })
        .where(eq(contactContent.id, "main"))
        .returning();
      revalidatePath("/contact");
      return NextResponse.json(updated);
    } else {
      const [created] = await db
        .insert(contactContent)
        .values({ id: "main", ...DEFAULT_FIELDS, blocks: JSON.stringify(DEFAULT_BLOCKS), ...body, updatedAt: now })
        .returning();
      revalidatePath("/contact");
      return NextResponse.json(created);
    }
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
