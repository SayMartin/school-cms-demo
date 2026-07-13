import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { courseApplication } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "reviewing", "accepted", "declined"];

// PATCH — update status. Studio-protected.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const { id } = await params;
    const body = (await req.json()) as { status?: string };
    if (!body.status || !STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = getDb();
    const [item] = await db
      .update(courseApplication)
      .set({ status: body.status })
      .where(eq(courseApplication.id, id))
      .returning();

    if (!item) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(item);
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
