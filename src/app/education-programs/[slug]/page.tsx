import type { Metadata } from "next";
import { eq, and, asc, ne, or, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db/client";
import { course } from "@/lib/db/schema";
import { CourseDetailView } from "@/components/course-detail-view";
import { KursBlocksView } from "@/components/kurs-blocks-view";
import { fetchInstagramPosts } from "@/lib/instagram";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const [item] = await db
    .select({ title: course.title })
    .from(course)
    .where(
      and(
        eq(course.slug, slug),
        eq(course.courseType, "program"),
        ne(course.deliveryMode, "distance_hybrid"),
        ne(course.deliveryMode, "distance_pure"),
      ),
    )
    .limit(1);
  return { title: item?.title ?? "Utbildning" };
}

export default async function UtbildningDetailPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();
  const [item] = await db
    .select()
    .from(course)
    .where(
      and(
        eq(course.slug, slug),
        or(eq(course.isPublished, true), eq(course.isArchived, true)),
        eq(course.courseType, "program"),
        ne(course.deliveryMode, "distance_hybrid"),
        ne(course.deliveryMode, "distance_pure"),
      ),
    )
    .limit(1);
  if (!item) notFound();

  const hasInstagramBlock =
    item.blocks
      ? (JSON.parse(item.blocks) as { type: string }[]).some(
          (b) => b.type === "instagram",
        )
      : false;

  const { env } = getCloudflareContext();

  const [summerCourses, eveningCourses] = await Promise.all([
    db
      .select({
        slug: course.slug,
        title: course.title,
        startDate: sql<number | null>`(SELECT MIN(ci."startDate") FROM "CourseInstance" ci WHERE ci."courseId" = ${course.id})`,
        endDate: sql<number | null>`(SELECT MIN(ci."endDate") FROM "CourseInstance" ci WHERE ci."courseId" = ${course.id})`,
      })
      .from(course)
      .where(
        and(
          eq(course.parentKursId, item.id),
          eq(course.isPublished, true),
          eq(course.courseType, "summer"),
        ),
      )
      .orderBy(asc(sql`(SELECT MIN(ci."startDate") FROM "CourseInstance" ci WHERE ci."courseId" = ${course.id})`)),

    db
      .select({
        slug: course.slug,
        title: course.title,
        startDate: sql<number | null>`(SELECT MIN(ci."startDate") FROM "CourseInstance" ci WHERE ci."courseId" = ${course.id})`,
      })
      .from(course)
      .where(
        and(
          eq(course.parentKursId, item.id),
          eq(course.isPublished, true),
          eq(course.courseType, "evening"),
        ),
      )
      .orderBy(asc(sql`(SELECT MIN(ci."startDate") FROM "CourseInstance" ci WHERE ci."courseId" = ${course.id})`)),
  ]);

  const instagramPosts =
    hasInstagramBlock && env.INSTAGRAM_ACCESS_TOKEN
      ? await fetchInstagramPosts(env.INSTAGRAM_ACCESS_TOKEN)
      : [];

  return (
    <>
      <CourseDetailView
        item={item}
        backHref="/education-programs"
        backLabel="Utbildningar"
        summerCourses={summerCourses}
        eveningCourses={eveningCourses}
        isArchived={item.isArchived}
      />

      <KursBlocksView blocksJson={item.blocks} instagramPosts={instagramPosts} />
    </>
  );
}
