import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { bgGradientSettings } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const DEFAULT = { color1: "#FDFCF8", color2: "#F7F4ED" };

export async function GET() {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(bgGradientSettings)
      .where(eq(bgGradientSettings.id, "main"))
      .limit(1);
    return NextResponse.json(row ?? { id: "main", ...DEFAULT, favorite1: null, favorite2: null, favorite3: null });
  } catch {
    return NextResponse.json({ id: "main", ...DEFAULT, favorite1: null, favorite2: null, favorite3: null });
  }
}

export async function PUT(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = (await req.json()) as Partial<{
      color1: string;
      color2: string;
      favorite1: string | null;
      favorite2: string | null;
      favorite3: string | null;
    }>;

    const db = getDb();
    const [existing] = await db
      .select()
      .from(bgGradientSettings)
      .where(eq(bgGradientSettings.id, "main"))
      .limit(1);

    const now = new Date();
    const patch: Partial<typeof bgGradientSettings.$inferInsert> = {};
    if ("color1"    in body) patch.color1    = body.color1;
    if ("color2"    in body) patch.color2    = body.color2;
    if ("favorite1" in body) patch.favorite1 = body.favorite1;
    if ("favorite2" in body) patch.favorite2 = body.favorite2;
    if ("favorite3" in body) patch.favorite3 = body.favorite3;

    if (existing) {
      const [updated] = await db
        .update(bgGradientSettings)
        .set({ ...patch, updatedAt: now })
        .where(eq(bgGradientSettings.id, "main"))
        .returning();
      return NextResponse.json(updated);
    } else {
      const [created] = await db
        .insert(bgGradientSettings)
        .values({ id: "main", ...DEFAULT, favorite1: null, favorite2: null, favorite3: null, ...patch, updatedAt: now })
        .returning();
      return NextResponse.json(created);
    }
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
