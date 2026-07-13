import type { Metadata } from "next";
import { eq, and, asc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { course, summerCoursesContent } from "@/lib/db/schema";
import { KursCard } from "@/components/kurs-card";
import { KursgruppBlockView } from "@/components/kursgrupp-block-view";
import { NavGroupBlockView } from "@/components/nav-group-block-view";
import { RichTextContent } from "@/components/rich-text-content";
import { AccordionBlock } from "@/components/accordion-block";
import { Slideshow } from "@/components/slideshow";
import { YoutubeBlockView } from "@/components/youtube-block-view";
import { VideoBlockView } from "@/components/video-block-view";
import type { CourseGroupBlock } from "@/lib/blocks";
import { parseHubBlocks } from "@/lib/parse-blocks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Summer Courses" };

type Course = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  imageKey: string | null;
  courseType: string;
  deliveryMode: string | null;
};



// Fallback automatic grouping (used when no course-group blocks are defined)
const FALLBACK_GROUPS = [
  { mode: "campus",          heading: "Summer courses at the folk high school in Lindeby", anchor: "on-site" },
  { mode: "distance_pure",   heading: "Digital summer courses at a distance",                     anchor: "at-a-distance" },
  { mode: "distance_hybrid", heading: "Distance courses with in-person sessions",                 anchor: "distance-with-sessions" },
  { mode: "outdoor",         heading: "Summer courses in nature",                                 anchor: "in-nature" },
] as const;

function CourseGrid({ courses }: { courses: Course[] }) {
  return (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((item) => (
        <KursCard
          key={item.id}
          title={item.title}
          href={`/summer-courses/${item.slug}`}
          imageKey={item.imageKey}
          courseType={item.courseType}
          deliveryMode={item.deliveryMode}
        />
      ))}
    </ul>
  );
}

export default async function SamtligaSommarkurserPage() {
  const db = getDb();
  const [contentRow, courses] = await Promise.all([
    db.select().from(summerCoursesContent).where(eq(summerCoursesContent.id, "main")).limit(1).then((r) => r[0]),
    db
      .select({
        id: course.id,
        title: course.title,
        slug: course.slug,
        excerpt: course.excerpt,
        imageKey: course.imageKey,
        courseType: course.courseType,
        deliveryMode: course.deliveryMode,
      })
      .from(course)
      .where(and(eq(course.isPublished, true), eq(course.courseType, "summer")))
      .orderBy(asc(course.title)),
  ]);

  const blocks = parseHubBlocks(contentRow?.blocks ?? "[]");
  const kursgruppBlocks = blocks.filter((b): b is CourseGroupBlock => b.type === "course-group");
  const hasKursgrupp = kursgruppBlocks.length > 0;


  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-8">
      {contentRow?.headingVisible && contentRow?.heading && (
        <h1 className="text-center" style={{ color: contentRow.headingColor ?? "#111827" }}>{contentRow.heading}</h1>
      )}

      {/* ── Editorial blocks above the course list ── */}
      {blocks.filter((b) => b.type !== "course-group").map((block) => {
        if (block.type === "section") return (
          <section key={block.id}>
            {block.headingVisible && block.heading && <h1 style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h1>}
            {block.body && (
              <div className={`${block.headingVisible && block.heading ? "mt-4" : ""} max-w-7xl text-gray-600 leading-relaxed`}>
                <RichTextContent html={block.body} />
              </div>
            )}
          </section>
        );
        if (block.type === "accordion-section") return (
          <div key={block.id} className="max-w-7xl">
            <AccordionBlock summary={block.summary}>
              {block.body && <RichTextContent html={block.body} className="text-gray-600" />}
            </AccordionBlock>
          </div>
        );
        if (block.type === "slideshow") return (
          <div key={block.id} className="mt-10">
            <Slideshow block={block} />
          </div>
        );
        if (block.type === "youtube") return (
          <div key={block.id} className="mt-10">
            <YoutubeBlockView block={block} />
          </div>
        );
        if (block.type === "video") return (
          <div key={block.id} className="mt-10">
            <VideoBlockView block={block} />
          </div>
        );
        if (block.type === "nav-group") return (
          <div key={block.id} className="mt-10">
            <NavGroupBlockView block={block} />
          </div>
        );
        return null;
      })}

      {courses.length === 0 ? (
        <p className="text-gray-600">No summer courses published yet.</p>
      ) : hasKursgrupp ? (
        /* ── Studio-driven course groups ── */
        <div className="space-y-12">
          {kursgruppBlocks.map((block) => (
            <section key={block.id}>
              <KursgruppBlockView block={block} />
            </section>
          ))}
        </div>
      ) : (
        /* ── Automatic grouping as fallback ── */
        <div className="space-y-12">
          <nav className="flex flex-wrap gap-2">
            {FALLBACK_GROUPS.filter((g) => courses.some((c) => c.deliveryMode === g.mode)).map((g) => (
              <a key={g.mode} href={`#${g.anchor}`}
                className="rounded-full border border-brand-yellow bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-brand-yellow transition-colors">
                {g.heading}
              </a>
            ))}
          </nav>
          {FALLBACK_GROUPS.map((g) => {
            const group = courses.filter((c) => c.deliveryMode === g.mode);
            if (group.length === 0) return null;
            return (
              <section key={g.mode} id={g.anchor}>
                <h2 className="mb-6">{g.heading}</h2>
                <CourseGrid courses={group} />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
