import type { Metadata } from "next";
import { eq, desc } from "drizzle-orm";
import { NewsCard } from "@/components/news-card";
import { RichTextContent } from "@/components/rich-text-content";
import { AccordionBlock } from "@/components/accordion-block";
import { Slideshow } from "@/components/slideshow";
import { NavGroupBlockView } from "@/components/nav-group-block-view";
import { YoutubeBlockView } from "@/components/youtube-block-view";
import { VideoBlockView } from "@/components/video-block-view";
import { getDb } from "@/lib/db/client";
import { news, newsHubContent } from "@/lib/db/schema";
import { parseHubBlocks } from "@/lib/parse-blocks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "News" };

export default async function AktuellPage() {
  const db = getDb();

  const [contentRow, items] = await Promise.all([
    db
      .select()
      .from(newsHubContent)
      .where(eq(newsHubContent.id, "main"))
      .limit(1)
      .then((r) => r[0]),
    db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        excerpt: news.excerpt,
        author: news.author,
        imageKey: news.imageKey,
        publishedAt: news.publishedAt,
        createdAt: news.createdAt,
      })
      .from(news)
      .where(eq(news.isPublished, true))
      .orderBy(desc(news.publishedAt)),
  ]);

  const blocks = parseHubBlocks(contentRow?.blocks ?? "[]").filter(
    (b) => b.type !== "course-group",
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 space-y-8">
        {contentRow?.headingVisible && contentRow?.heading ? (
          <h1 className="text-center" style={{ color: contentRow.headingColor ?? "#111827" }}>
            {contentRow.heading}
          </h1>
        ) : (
          <h1>News</h1>
        )}

        {blocks.map((block) => {
          if (block.type === "section") return (
            <section key={block.id}>
              {block.headingVisible && block.heading && (
                <h2 style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h2>
              )}
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

        {items.length === 0 ? (
          <p className="text-gray-600">No news published yet.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <NewsCard
                key={item.id}
                {...item}
                publishedAt={(item.publishedAt ?? item.createdAt).toISOString()}
                index={i}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
