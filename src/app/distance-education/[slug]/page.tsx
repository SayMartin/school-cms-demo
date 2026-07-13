import type { Metadata } from "next";
import { eq, and, asc, or, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { course } from "@/lib/db/schema";
import { CourseDetailView } from "@/components/course-detail-view";
import { KursBlocksView } from "@/components/kurs-blocks-view";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const isDistance = or(eq(course.deliveryMode, "distance_hybrid"), eq(course.deliveryMode, "distance_pure"))!;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const [item] = await db
    .select({ title: course.title })
    .from(course)
    .where(and(eq(course.slug, slug), eq(course.courseType, "program"), isDistance))
    .limit(1);
  return { title: item?.title ?? "Distansutbildning" };
}

export default async function DistansutbildningDetailPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();

  const [item] = await db
    .select()
    .from(course)
    .where(and(eq(course.slug, slug), or(eq(course.isPublished, true), eq(course.isArchived, true)), eq(course.courseType, "program"), isDistance))
    .limit(1);
  if (!item) notFound();

  const [summerCourses, eveningCourses] = await Promise.all([
    db
      .select({
        slug: course.slug,
        title: course.title,
        startDate: sql<number | null>`(SELECT MIN(ci."startDate") FROM "CourseInstance" ci WHERE ci."courseId" = ${course.id})`,
        endDate: sql<number | null>`(SELECT MIN(ci."endDate") FROM "CourseInstance" ci WHERE ci."courseId" = ${course.id})`,
      })
      .from(course)
      .where(and(eq(course.parentKursId, item.id), eq(course.isPublished, true), eq(course.courseType, "summer")))
      .orderBy(asc(sql`(SELECT MIN(ci."startDate") FROM "CourseInstance" ci WHERE ci."courseId" = ${course.id})`)),

    db
      .select({
        slug: course.slug,
        title: course.title,
        startDate: sql<number | null>`(SELECT MIN(ci."startDate") FROM "CourseInstance" ci WHERE ci."courseId" = ${course.id})`,
      })
      .from(course)
      .where(and(eq(course.parentKursId, item.id), eq(course.isPublished, true), eq(course.courseType, "evening")))
      .orderBy(asc(sql`(SELECT MIN(ci."startDate") FROM "CourseInstance" ci WHERE ci."courseId" = ${course.id})`)),
  ]);

  return (
    <>
      <CourseDetailView
        item={item}
        backHref="/education-programs"
        backLabel="Utbildningar"
        accentColor="brand-blue"
        summerCourses={summerCourses}
        eveningCourses={eveningCourses}
        isArchived={item.isArchived}
      />

      <KursBlocksView blocksJson={item.blocks} />
    </>
  );
}
