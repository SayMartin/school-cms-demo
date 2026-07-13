import type { Metadata } from "next";
import { eq, and, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { course } from "@/lib/db/schema";
import { CourseDetailView } from "@/components/course-detail-view";
import { KursBlocksView } from "@/components/kurs-blocks-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Study Motivation Folk High School (SMF)",
};

export default async function SmfPage() {
  const db = getDb();
  const [item] = await db
    .select()
    .from(course)
    .where(
      and(
        eq(course.slug, "studiemotiverande-folkhogskola"),
        or(eq(course.isPublished, true), eq(course.isArchived, true)),
      ),
    )
    .limit(1);
  if (!item) notFound();
  return (
    <>
      <CourseDetailView
        item={item}
        backHref="/short-courses"
        backLabel="Short Courses"
        isArchived={item.isArchived}
      />
      <KursBlocksView blocksJson={item.blocks} />
    </>
  );
}
