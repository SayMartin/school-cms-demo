import type { Metadata } from "next";
import Link from "next/link";
import { eq, and, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { course } from "@/lib/db/schema";
import { KursCard } from "@/components/kurs-card";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const [parentKurs] = await db
    .select({ title: course.title })
    .from(course)
    .where(and(eq(course.slug, slug), eq(course.courseType, "program")))
    .limit(1);
  return { title: parentKurs ? `Summer Courses — ${parentKurs.title}` : "Summer Courses" };
}

export default async function SommarkurserByKursPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();

  const [parentKurs] = await db
    .select({ id: course.id, title: course.title, slug: course.slug })
    .from(course)
    .where(and(eq(course.slug, slug), eq(course.courseType, "program")))
    .limit(1);
  if (!parentKurs) notFound();

  const kurser = await db
    .select({
      id: course.id,
      title: course.title,
      slug: course.slug,
      imageKey: course.imageKey,
      deliveryMode: course.deliveryMode,
    })
    .from(course)
    .where(and(eq(course.parentKursId, parentKurs.id), eq(course.courseType, "summer"), eq(course.isPublished, true)))
    .orderBy(asc(course.title));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-8">
      <div>
        <Link
          href="/summer-courses"
          className="text-sm font-medium text-gray-600 underline-offset-2 hover:underline hover:text-brand-green-dark transition-colors"
        >
          ← Summer Courses
        </Link>
        <h1 className="mt-4">Summer Courses — {parentKurs.title}</h1>
      </div>

      {kurser.length === 0 ? (
        <p className="text-gray-600">No summer courses published for this department yet.</p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {kurser.map((item) => (
            <KursCard
              key={item.id}
              title={item.title}
              href={`/summer-courses/${item.slug}`}
              imageKey={item.imageKey}
              courseType="summer"
              deliveryMode={item.deliveryMode}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
