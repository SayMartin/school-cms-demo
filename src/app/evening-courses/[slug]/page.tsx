import type { Metadata } from "next";
import { eq, and, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { course } from "@/lib/db/schema";
import { CourseDetailView } from "@/components/course-detail-view";
import { KursBlocksView } from "@/components/kurs-blocks-view";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const [item] = await db
    .select({ title: course.title })
    .from(course)
    .where(and(eq(course.slug, slug), eq(course.courseType, "evening")))
    .limit(1);
  return { title: item?.title ?? "Evening Course" };
}

export default async function KvallskursDetailPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();

  const [item] = await db
    .select()
    .from(course)
    .where(and(eq(course.slug, slug), or(eq(course.isPublished, true), eq(course.isArchived, true)), eq(course.courseType, "evening")))
    .limit(1);

  if (!item) notFound();

  return (
    <>
      <CourseDetailView
        item={item}
        backHref="/evening-courses"
        backLabel="Evening Courses"
        accentColor="brand-pink"
        isArchived={item.isArchived}
      />
      <KursBlocksView blocksJson={item.blocks} />
    </>
  );
}
