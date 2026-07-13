import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { boardingContent } from "@/lib/db/schema";
import { RichTextContent } from "@/components/rich-text-content";
import { AccordionBlock } from "@/components/accordion-block";
import { Slideshow } from "@/components/slideshow";
import { YoutubeBlockView } from "@/components/youtube-block-view";
import { VideoBlockView } from "@/components/video-block-view";
import type { ContentBlock } from "@/lib/blocks";
import { parseContentBlocks } from "@/lib/parse-blocks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Boarding" };

const DEFAULT_BLOCKS: ContentBlock[] = [
  {
    id: "default-gallery", type: "slideshow", heading: "Photo gallery", headingVisible: false,
    images: [
      { src: "/internat/rum-1.jpg",      alt: "" },
      { src: "/internat/rum-2.jpg",      alt: "" },
      { src: "/internat/internat-4.jpg", alt: "" },
    ],
  },
];

export default async function InternatPage() {
  const db = getDb();
  const [row] = await db.select().from(boardingContent).where(eq(boardingContent.id, "main")).limit(1);

  const blocks = (() => {
    const parsed = parseContentBlocks(row?.blocks ?? "[]");
    return parsed.length ? parsed : DEFAULT_BLOCKS;
  })();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {row?.headingVisible && row?.heading && (
        <h1 className="text-center" style={{ color: row.headingColor ?? "#111827" }}>{row.heading}</h1>
      )}

      {blocks.map((block) => {

        if (block.type === "slideshow") return (
          <div key={block.id} className="mt-12">
            <Slideshow block={block} />
          </div>
        );

        if (block.type === "accordion-section") return (
          <div key={block.id} className="mt-12 max-w-7xl">
            <AccordionBlock summary={block.summary}>
              {block.body && <RichTextContent html={block.body} className="text-gray-600" />}
            </AccordionBlock>
          </div>
        );


        if (block.type === "section") return (
          <section key={block.id} className="mt-12">
            {block.headingVisible && block.heading && (
              <h1 style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h1>
            )}
            {block.body && (
              <div className={`${block.headingVisible && block.heading ? "mt-3" : "mt-0"} max-w-7xl text-gray-600`}>
                <RichTextContent html={block.body} />
              </div>
            )}
          </section>
        );
        if (block.type === "youtube") return (
          <div key={block.id} className="mt-12">
            <YoutubeBlockView block={block} />
          </div>
        );
        if (block.type === "video") return (
          <div key={block.id} className="mt-12">
            <VideoBlockView block={block} />
          </div>
        );
        return null;
      })}
    </div>
  );
}
