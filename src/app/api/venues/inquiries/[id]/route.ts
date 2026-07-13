import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { venueInquiry } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as { status?: string };
    const patch: Partial<typeof venueInquiry.$inferInsert> = {};
    if (body.status !== undefined) patch.status = body.status;

    const db = getDb();
    const [item] = await db
      .update(venueInquiry)
      .set(patch)
      .where(eq(venueInquiry.id, id))
      .returning();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
