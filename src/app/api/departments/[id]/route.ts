import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { department } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as { name?: string; sortOrder?: number; isCourseDepartment?: boolean; href?: string | null; imageKey?: string | null };

    const patch: Partial<typeof department.$inferInsert> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.sortOrder !== undefined) patch.sortOrder = body.sortOrder;
    if (body.isCourseDepartment !== undefined) patch.isCourseDepartment = body.isCourseDepartment;
    if (body.href !== undefined) patch.href = body.href;
    if (body.imageKey !== undefined) patch.imageKey = body.imageKey;

    const db = getDb();
    const [item] = await db.update(department).set(patch).where(eq(department.id, id)).returning();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const db = getDb();
    await db.delete(department).where(eq(department.id, id));
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
