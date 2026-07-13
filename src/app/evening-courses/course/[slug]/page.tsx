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
  return { title: parentKurs ? `Evening Courses — ${parentKurs.title}` : "Evening Courses" };
}

export default async function KvallskurserByKursPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();

  const [parentKurs] = await db
    .select({ id: course.id, title: course.title, slug: course.slug })
    .from(course)
    .where(and(eq(course.slug, slug), eq(course.courseType, "program")))
    .limit(1);
  if (!parentKurs) notFound();

  const kvallskurser = await db
    .select({
      id: course.id,
      title: course.title,
      slug: course.slug,
      imageKey: course.imageKey,
    })
    .from(course)
    .where(and(eq(course.parentKursId, parentKurs.id), eq(course.courseType, "evening"), eq(course.isPublished, true)))
    .orderBy(asc(course.title));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-8">
      <div>
        <Link
          href="/evening-courses"
          className="text-sm font-medium text-gray-600 underline-offset-2 hover:underline hover:text-brand-green-dark transition-colors"
        >
          ← Evening Courses
        </Link>
        <h1 className="mt-4">Evening Courses — {parentKurs.title}</h1>
      </div>

      {kvallskurser.length === 0 ? (
        <p className="text-gray-600">No evening courses published for this department yet.</p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {kvallskurser.map((item) => (
            <KursCard
              key={item.id}
              title={item.title}
              href={`/evening-courses/${item.slug}`}
              imageKey={item.imageKey}
              courseType="evening"
              deliveryMode="campus"
            />
          ))}
        </ul>
      )}
    </div>
  );
}
