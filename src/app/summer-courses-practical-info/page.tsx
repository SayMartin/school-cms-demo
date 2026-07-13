import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { summerCoursesPracticalInfoContent } from "@/lib/db/schema";
import { RichTextContent } from "@/components/rich-text-content";
import { AccordionBlock } from "@/components/accordion-block";
import { Slideshow } from "@/components/slideshow";
import { YoutubeBlockView } from "@/components/youtube-block-view";
import { VideoBlockView } from "@/components/video-block-view";
import { parseContentBlocks } from "@/lib/parse-blocks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Practical Information — Summer Courses" };

export default async function PraktiskInfoSommarkurserPage() {
  const db = getDb();
  const [contentRow] = await db
    .select()
    .from(summerCoursesPracticalInfoContent)
    .where(eq(summerCoursesPracticalInfoContent.id, "main"))
    .limit(1);

  const blocks = parseContentBlocks(contentRow?.blocks ?? "[]");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-8">
      {contentRow?.headingVisible && contentRow?.heading && (
        <h1 style={{ color: contentRow.headingColor ?? "#111827" }}>{contentRow.heading}</h1>
      )}

      {blocks.map((block) => {
        if (block.type === "section") return (
          <section key={block.id}>
            {block.headingVisible && block.heading && <h1 style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h1>}
            {block.body && (
              <div className={`${block.headingVisible && block.heading ? "mt-4" : ""} text-gray-600 leading-relaxed`}>
                <RichTextContent html={block.body} />
              </div>
            )}
          </section>
        );
        if (block.type === "accordion-section") return (
          <div key={block.id}>
            <AccordionBlock summary={block.summary}>
              {block.body && <RichTextContent html={block.body} className="text-gray-600" />}
            </AccordionBlock>
          </div>
        );
        if (block.type === "slideshow") return (
          <div key={block.id}>
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
        return null;
      })}

      {blocks.length === 0 && (
        <p className="text-gray-600">Content coming soon.</p>
      )}
    </div>
  );
}
