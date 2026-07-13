import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { requireFacilitiesAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { errorReportComment } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireFacilitiesAccess(req);
    if (access.response) return access.response;

    const { id } = await params;
    const db = getDb();
    const comments = await db
      .select()
      .from(errorReportComment)
      .where(eq(errorReportComment.reportId, id))
      .orderBy(asc(errorReportComment.createdAt));

    return NextResponse.json(comments);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireFacilitiesAccess(req);
    if (access.response) return access.response;

    const { id } = await params;
    const body = await req.json() as { body?: string };
    if (!body.body?.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const db = getDb();
    const now = new Date();
    const commentId = crypto.randomUUID();

    await db.insert(errorReportComment).values({
      id: commentId,
      reportId: id,
      body: body.body.trim(),
      createdAt: now,
    });

    return NextResponse.json({ id: commentId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
