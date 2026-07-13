import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { course, courseDepartment } from "@/lib/db/schema";
import { revalidateCoursePaths } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'program' | 'summer' | 'evening'
    const db = getDb();

    const query = db
      .select({
        id: course.id,
        courseType: course.courseType,
        deliveryMode: course.deliveryMode,
        parentKursId: course.parentKursId,
        slug: course.slug,
        title: course.title,
        excerpt: course.excerpt,
        imageKey: course.imageKey,
        isPublished: course.isPublished,
        isArchived: course.isArchived,
        duration: course.duration,
        studyPace: course.studyPace,
        studyAidLevel: course.studyAidLevel,
        hasAccommodation: course.hasAccommodation,
      })
      .from(course)
      .where(type ? eq(course.courseType, type) : undefined)
      .orderBy(asc(course.title));

    const items = await query;
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as {
      courseType: string;
      deliveryMode?: string | null;
      parentKursId?: string | null;
      slug: string;
      title: string;
      excerpt?: string;
      description?: string;
      imageKey?: string | null;
      isPublished?: boolean;
      duration?: string | null;
      studyPace?: number | null;
      studyAidLevel?: string | null;
      hasAccommodation?: boolean;
      tracks?: string;
      infoSections?: string;
      staff?: string;
      links?: string;
      gallery?: string;
      blocks?: string;
      avdelningIds?: string[];
    };

    const db = getDb();
    const now = new Date();
    const [item] = await db
      .insert(course)
      .values({
        id: crypto.randomUUID(),
        courseType: body.courseType,
        deliveryMode: body.deliveryMode ?? null,
        parentKursId: body.parentKursId ?? null,
        slug: body.slug,
        title: body.title,
        excerpt: body.excerpt ?? "",
        description: body.description ?? "",
        imageKey: body.imageKey ?? null,
        isPublished: body.isPublished ?? false,
        duration: body.duration ?? null,
        studyPace: body.studyPace ?? null,
        studyAidLevel: body.studyAidLevel ?? null,
        hasAccommodation: body.hasAccommodation ?? false,
        tracks: body.tracks ?? "[]",
        infoSections: body.infoSections ?? "[]",
        staff: body.staff ?? "[]",
        links: body.links ?? "[]",
        gallery: body.gallery ?? "[]",
        blocks: body.blocks ?? "[]",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (body.avdelningIds?.length) {
      await db.insert(courseDepartment).values(
        body.avdelningIds.map((avdelningId) => ({ courseId: item!.id, departmentId: avdelningId }))
      );
    }

    revalidateCoursePaths(item!.slug);
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
