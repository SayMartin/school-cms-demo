import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { termDatesContent } from "@/lib/db/schema";
import { RichTextContent } from "@/components/rich-text-content";
import { AccordionBlock } from "@/components/accordion-block";
import { Slideshow } from "@/components/slideshow";
import { YoutubeBlockView } from "@/components/youtube-block-view";
import { VideoBlockView } from "@/components/video-block-view";
import { parseContentBlocks } from "@/lib/parse-blocks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Termins- och lovtider" };

export default async function LovtiderPage() {
  const db = getDb();
  const [row] = await db.select().from(termDatesContent).where(eq(termDatesContent.id, "main")).limit(1);
  const rawBlocks = row?.blocks ?? "[]";
  const blocks = parseContentBlocks(rawBlocks);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {row?.headingVisible && row?.heading && (
        <h1 className="text-center" style={{ color: row.headingColor ?? "#111827" }}>{row.heading}</h1>
      )}

      {blocks.map((block) => {
        if (block.type === "section") return (
          <section key={block.id} className="mt-8">
            {block.headingVisible && block.heading && <h1 style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h1>}
            {block.body && <div className={`${block.headingVisible && block.heading ? "mt-4" : "mt-0"} max-w-7xl text-gray-700 leading-relaxed`}><RichTextContent html={block.body} /></div>}
          </section>
        );
        if (block.type === "accordion-section") return (
          <div key={block.id} className="mt-8 max-w-7xl">
            <AccordionBlock summary={block.summary}>{block.body && <RichTextContent html={block.body} className="text-gray-700" />}</AccordionBlock>
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
        return null;
      })}
    </div>
  );
}
