import type { Metadata } from "next";
import { eq, and, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { course } from "@/lib/db/schema";
import { CourseDetailView } from "@/components/course-detail-view";
import { KursBlocksView } from "@/components/kurs-blocks-view";
import { SummerCoursesNav } from "@/components/summer-courses-nav";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const [item] = await db
    .select({ title: course.title })
    .from(course)
    .where(and(eq(course.slug, slug), eq(course.courseType, "summer")))
    .limit(1);
  return { title: item?.title ?? "Sommarkurs" };
}

export default async function SommarkursDetailPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();

  const [item] = await db
    .select()
    .from(course)
    .where(and(eq(course.slug, slug), or(eq(course.isPublished, true), eq(course.isArchived, true)), eq(course.courseType, "summer")))
    .limit(1);

  if (!item) notFound();

  return (
    <>
      <CourseDetailView
        item={item}
        backHref="/summer-courses"
        backLabel="Sommarkurser"
        accentColor="brand-yellow"
        isArchived={item.isArchived}
      />
      <KursBlocksView blocksJson={item.blocks} />
      <SummerCoursesNav />
    </>
  );
}
