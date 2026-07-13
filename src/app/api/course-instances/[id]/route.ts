import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { courseInstance, course } from "@/lib/db/schema";
import {
  buildInstanceSlug,
  type PeriodType,
  type RegistrationPeriod,
} from "@/lib/course-instance";

export const dynamic = "force-dynamic";

const PERIOD_TYPES: PeriodType[] = ["spring", "fall", "full_year", "summer"];

function isPeriodType(value: unknown): value is PeriodType {
  return (
    typeof value === "string" && PERIOD_TYPES.includes(value as PeriodType)
  );
}

// PUT — update instance. Studio-protected.
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const { id } = await params;
    const body = (await req.json()) as {
      year?: number;
      periodType?: string;
      week?: number | null;
      schoolsoftId?: string | null;
      extraFields?: string;
      sortOrder?: number;
      startDate?: string | null;
      endDate?: string | null;
      spots?: number | null;
      applicationMethods?: string;
      applicationText?: string | null;
      applicationBlocks?: string;
    };

    const db = getDb();
    const [existing] = await db
      .select()
      .from(courseInstance)
      .where(eq(courseInstance.id, id));
    if (!existing) {
      return NextResponse.json(
        { error: "The instance doesn't exist" },
        { status: 404 },
      );
    }
    if (body.periodType !== undefined && !isPeriodType(body.periodType)) {
      return NextResponse.json({ error: "Invalid period type" }, { status: 400 });
    }

    const period: RegistrationPeriod = {
      year: body.year ?? existing.year,
      periodType:
        (body.periodType as PeriodType) ?? (existing.periodType as PeriodType),
      week: body.week !== undefined ? body.week : existing.week,
    };
    const [parent] = await db
      .select({ slug: course.slug, isArchived: course.isArchived })
      .from(course)
      .where(eq(course.id, existing.courseId));

    if (parent?.isArchived && body.applicationMethods) {
      try {
        const cfg = JSON.parse(body.applicationMethods) as { open?: boolean };
        if (cfg.open) return NextResponse.json({ error: "The course is archived — the instance can't be set to open" }, { status: 400 });
      } catch { /* ignore invalid JSON */ }
    }

    const [item] = await db
      .update(courseInstance)
      .set({
        year: period.year,
        periodType: period.periodType,
        week: period.week,
        schoolsoftId:
          body.schoolsoftId !== undefined
            ? body.schoolsoftId
            : existing.schoolsoftId,
        extraFields: body.extraFields ?? existing.extraFields,
        sortOrder: body.sortOrder ?? existing.sortOrder,
        startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : existing.startDate,
        endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : existing.endDate,
        spots: body.spots !== undefined ? body.spots : existing.spots,
        applicationMethods: body.applicationMethods !== undefined ? body.applicationMethods : existing.applicationMethods,
        applicationText: body.applicationText !== undefined ? body.applicationText : existing.applicationText,
        applicationBlocks: body.applicationBlocks !== undefined ? body.applicationBlocks : existing.applicationBlocks,
        slug: parent ? buildInstanceSlug(parent.slug, period) : existing.slug,
        updatedAt: new Date(),
      })
      .where(eq(courseInstance.id, id))
      .returning();

    return NextResponse.json(item);
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

// DELETE — remove instance (cascades to delete its applications). Studio-protected.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const { id } = await params;
    const db = getDb();
    await db.delete(courseInstance).where(eq(courseInstance.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
