import { NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { courseInstance, course } from "@/lib/db/schema";
import { buildInstanceSlug, type PeriodType, type RegistrationPeriod } from "@/lib/course-instance";

export const dynamic = "force-dynamic";

const PERIOD_TYPES: PeriodType[] = ["spring", "fall", "full_year", "summer"];

function isPeriodType(value: unknown): value is PeriodType {
  return typeof value === "string" && PERIOD_TYPES.includes(value as PeriodType);
}

// GET — list instances (with course title/slug). ?kursId= filters, ?open=true gives
// only open instances. Public (the form needs to read open instances).
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const kursId = searchParams.get("kursId");
    const db = getDb();

    const filters = [
      kursId ? eq(courseInstance.courseId, kursId) : undefined,
    ].filter(Boolean);

    const items = await db
      .select({
        id: courseInstance.id,
        kursId: courseInstance.courseId,
        slug: courseInstance.slug,
        year: courseInstance.year,
        periodType: courseInstance.periodType,
        week: courseInstance.week,
        schoolsoftId: courseInstance.schoolsoftId,
        extraFields: courseInstance.extraFields,
        sortOrder: courseInstance.sortOrder,
        startDate: courseInstance.startDate,
        endDate: courseInstance.endDate,
        spots: courseInstance.spots,
        applicationMethods: courseInstance.applicationMethods,
        applicationText: courseInstance.applicationText,
        applicationBlocks: courseInstance.applicationBlocks,
        kursTitle: course.title,
        kursSlug: course.slug,
      })
      .from(courseInstance)
      .innerJoin(course, eq(courseInstance.courseId, course.id))
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(courseInstance.sortOrder), desc(courseInstance.year));

    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

// POST — create instance. Studio-protected.
export async function POST(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as {
      kursId: string;
      year: number;
      periodType: string;
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

    if (!body.kursId || !body.year || !isPeriodType(body.periodType)) {
      return NextResponse.json({ error: "Course, year, and period type are required" }, { status: 400 });
    }

    const db = getDb();
    const [parent] = await db.select({ slug: course.slug, isArchived: course.isArchived }).from(course).where(eq(course.id, body.kursId));
    if (!parent) {
      return NextResponse.json({ error: "The course doesn't exist" }, { status: 400 });
    }
    if (parent.isArchived && body.applicationMethods) {
      try {
        const cfg = JSON.parse(body.applicationMethods) as { open?: boolean };
        if (cfg.open) return NextResponse.json({ error: "The course is archived — the instance can't be set to open" }, { status: 400 });
      } catch { /* ignore invalid JSON */ }
    }

    const period: RegistrationPeriod = {
      year: body.year,
      periodType: body.periodType,
      week: body.week ?? null,
    };

    const now = new Date();
    const [item] = await db
      .insert(courseInstance)
      .values({
        id: crypto.randomUUID(),
        courseId: body.kursId,
        slug: buildInstanceSlug(parent.slug, period),
        year: body.year,
        periodType: body.periodType,
        week: body.week ?? null,
        schoolsoftId: body.schoolsoftId ?? null,
        extraFields: body.extraFields ?? "[]",
        sortOrder: body.sortOrder ?? 0,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        spots: body.spots ?? null,
        applicationMethods: body.applicationMethods ?? '{"mode":"any","methods":[]}',
        applicationText: body.applicationText ?? null,
        applicationBlocks: body.applicationBlocks ?? "[]",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
