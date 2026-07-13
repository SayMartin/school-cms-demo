import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RichTextContent } from "@/components/rich-text-content";
import { AccordionBlock } from "@/components/accordion-block";
import { Slideshow } from "@/components/slideshow";
import { eq, lt, gt, and, desc, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { news } from "@/lib/db/schema";
import { mediaUrl } from "@/lib/r2/client";
import { YoutubeBlockView } from "@/components/youtube-block-view";
import { VideoBlockView } from "@/components/video-block-view";
import { parseContentBlocks } from "@/lib/parse-blocks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Aktuellt" };

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AktuellDetailPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();

  const [item] = await db
    .select()
    .from(news)
    .where(eq(news.slug, slug))
    .limit(1);
  if (!item || !item.isPublished) notFound();

  const publishedAt = item.publishedAt ?? item.createdAt;

  const [[prev], [next]] = await Promise.all([
    db
      .select({ title: news.title, slug: news.slug })
      .from(news)
      .where(and(eq(news.isPublished, true), lt(news.publishedAt, publishedAt)))
      .orderBy(desc(news.publishedAt))
      .limit(1),
    db
      .select({ title: news.title, slug: news.slug })
      .from(news)
      .where(and(eq(news.isPublished, true), gt(news.publishedAt, publishedAt)))
      .orderBy(asc(news.publishedAt))
      .limit(1),
  ]);

  const date = publishedAt.toLocaleDateString("en-US", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const blocks = parseContentBlocks(item.content);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Link
        href="/news"
        className="text-sm font-medium text-gray-600 underline-offset-2 hover:underline hover:text-brand-green-dark transition-colors"
      >
        ← Aktuellt
      </Link>

      {item.imageKey && (
        <div className="relative mt-8 w-full aspect-video overflow-hidden">
          <Image src={mediaUrl(item.imageKey)} alt="" fill className="object-cover" unoptimized />
        </div>
      )}

      <article className="mt-8">
        <header className="border-t-4 border-t-brand-green-dark pt-6">
          <p className="text-sm text-gray-600">
            {date}
            {item.author ? ` · ${item.author}` : ""}
          </p>
          <h1 className="mt-2" style={{ color: item.headingColor ?? "#111827" }}>{item.title}</h1>
        </header>

        {blocks.map((block) => {
          if (block.type === "section") return (
            <section key={block.id} className="mt-8">
              {block.headingVisible && block.heading && (
                <h1 style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h1>
              )}
              {block.body && (
                <div className={block.headingVisible && block.heading ? "mt-4" : "mt-0"}>
                  <RichTextContent html={block.body} className="text-gray-600 leading-relaxed" />
                </div>
              )}
            </section>
          );
          if (block.type === "accordion-section") return (
            <div key={block.id} className="mt-8">
              <AccordionBlock summary={block.summary}>
                {block.body && <RichTextContent html={block.body} className="text-gray-600" />}
              </AccordionBlock>
            </div>
          );
          if (block.type === "slideshow") return (
            <div key={block.id} className="mt-8">
              <Slideshow block={block} />
            </div>
          );
          if (block.type === "youtube") return (
            <div key={block.id} className="mt-8">
              <YoutubeBlockView block={block} />
            </div>
          );
          if (block.type === "video") return (
            <div key={block.id} className="mt-8">
              <VideoBlockView block={block} />
            </div>
          );
          return null;
        })}
      </article>

      {(prev || next) && (
        <nav className="mt-12 flex items-start justify-between gap-4 border-t border-gray-200 pt-8 text-sm">
          <div className="flex-1">
            {prev && (
              <Link href={`/news/${prev.slug}`} className="group flex flex-col gap-1">
                <span className="text-sm font-medium uppercase tracking-widest text-gray-600 group-hover:text-brand-green-dark transition-colors">
                  ← Tidigare
                </span>
                <span className="font-medium text-gray-700 group-hover:text-brand-green-dark transition-colors line-clamp-2">
                  {prev.title}
                </span>
              </Link>
            )}
          </div>
          <div className="flex-1 text-right">
            {next && (
              <Link href={`/news/${next.slug}`} className="group flex flex-col gap-1 items-end">
                <span className="text-sm font-medium uppercase tracking-widest text-gray-600 group-hover:text-brand-green-dark transition-colors">
                  Senare →
                </span>
                <span className="font-medium text-gray-700 group-hover:text-brand-green-dark transition-colors line-clamp-2">
                  {next.title}
                </span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
