import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { course, courseDepartment, courseInstance } from "@/lib/db/schema";
import { revalidateCoursePaths } from "@/lib/revalidate";
import { parseApplicationConfig } from "@/lib/application-methods";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const db = getDb();
    const [item] = await db.select().from(course).where(eq(course.slug, slug)).limit(1);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const avdelningar = await db
      .select({ departmentId: courseDepartment.departmentId })
      .from(courseDepartment)
      .where(eq(courseDepartment.courseId, item.id));

    return NextResponse.json({ ...item, avdelningIds: avdelningar.map((a) => a.departmentId) });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as {
      courseType?: string;
      deliveryMode?: string | null;
      parentKursId?: string | null;
      slug?: string;
      title?: string;
      excerpt?: string;
      description?: string;
      imageKey?: string | null;
      isPublished?: boolean;
      isArchived?: boolean;
      duration?: string | null;
      studyPace?: number | null;
      studyAidLevel?: string | null;
      hasAccommodation?: boolean;
      locationText?: string | null;
      tracks?: string;
      infoSections?: string;
      staff?: string;
      links?: string;
      gallery?: string;
      blocks?: string;
      headingColor?: string | null;
      applicationSectionHeading?: string;
      avdelningIds?: string[];
    };

    const patch: Partial<typeof course.$inferInsert> = { updatedAt: new Date() };
    if (body.courseType !== undefined)        patch.courseType = body.courseType;
    if (body.deliveryMode !== undefined)      patch.deliveryMode = body.deliveryMode;
    if (body.parentKursId !== undefined)      patch.parentKursId = body.parentKursId;
    if (body.slug !== undefined)              patch.slug = body.slug;
    if (body.title !== undefined)             patch.title = body.title;
    if (body.excerpt !== undefined)           patch.excerpt = body.excerpt;
    if (body.description !== undefined)       patch.description = body.description;
    if (body.imageKey !== undefined)          patch.imageKey = body.imageKey;
    if (body.isPublished !== undefined)       patch.isPublished = body.isPublished;
    if (body.isArchived !== undefined)        patch.isArchived = body.isArchived;
    if (body.duration !== undefined)          patch.duration = body.duration;
    if (body.studyPace !== undefined)         patch.studyPace = body.studyPace;
    if (body.studyAidLevel !== undefined)     patch.studyAidLevel = body.studyAidLevel;
    if (body.hasAccommodation !== undefined)  patch.hasAccommodation = body.hasAccommodation;
    if (body.locationText !== undefined)      patch.locationText = body.locationText;
    if (body.tracks !== undefined)            patch.tracks = body.tracks;
    if (body.infoSections !== undefined)      patch.infoSections = body.infoSections;
    if (body.staff !== undefined)             patch.staff = body.staff;
    if (body.links !== undefined)             patch.links = body.links;
    if (body.gallery !== undefined)           patch.gallery = body.gallery;
    if (body.blocks !== undefined)            patch.blocks = body.blocks;
    if (body.headingColor !== undefined)           patch.headingColor = body.headingColor ?? null;
    if (body.applicationSectionHeading !== undefined) patch.applicationSectionHeading = body.applicationSectionHeading;

    const db = getDb();
    const [item] = await db.update(course).set(patch).where(eq(course.slug, slug)).returning();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Cascade: close all open course instances when the course is archived
    if (body.isArchived === true) {
      const instances = await db.select({ id: courseInstance.id, applicationMethods: courseInstance.applicationMethods })
        .from(courseInstance).where(eq(courseInstance.courseId, item.id));
      for (const inst of instances) {
        const config = parseApplicationConfig(inst.applicationMethods);
        if (config.open) {
          await db.update(courseInstance)
            .set({ applicationMethods: JSON.stringify({ ...config, open: false }) })
            .where(eq(courseInstance.id, inst.id));
        }
      }
    }

    if (body.avdelningIds !== undefined) {
      await db.delete(courseDepartment).where(eq(courseDepartment.courseId, item.id));
      if (body.avdelningIds.length > 0) {
        await db.insert(courseDepartment).values(
          body.avdelningIds.map((avdelningId) => ({ courseId: item.id, departmentId: avdelningId }))
        );
      }
    }

    revalidateCoursePaths(body.slug ?? slug);
    return NextResponse.json({ ...item, avdelningIds: body.avdelningIds ?? [] });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const db = getDb();
    await db.delete(course).where(eq(course.slug, slug));
    revalidateCoursePaths(slug);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
