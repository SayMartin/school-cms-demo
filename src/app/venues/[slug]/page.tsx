import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { venue } from "@/lib/db/schema";
import { mediaUrl } from "@/lib/r2/client";
import Image from "next/image";
import { VenueView } from "@/components/venue-view";
import { VenueInquiryForm } from "@/app/venues/inquiry-form";
import { RichTextContent } from "@/components/rich-text-content";
import { AccordionBlock } from "@/components/accordion-block";
import { Slideshow } from "@/components/slideshow";
import { ProfilesBlockView } from "@/components/profiles-block-view";
import { YoutubeBlockView } from "@/components/youtube-block-view";
import { VideoBlockView } from "@/components/video-block-view";
import { parseContentBlocks } from "@/lib/parse-blocks";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const [v] = await db.select({ name: venue.name }).from(venue).where(eq(venue.slug, slug)).limit(1);
  return { title: v ? `${v.name} — Venues` : "Venue" };
}

export default async function VenueDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();

  const [v] = await db.select().from(venue).where(eq(venue.slug, slug)).limit(1);
  if (!v || !v.published) notFound();

  const blocks = parseContentBlocks(v.blocks);

  return (
    <div>
      {/* Hero */}
      {v.imageKey && (
        <div className="relative h-72 w-full sm:h-96 overflow-hidden">
          <Image
            src={mediaUrl(v.imageKey)}
            alt={v.name}
            fill
            className="object-cover"
            unoptimized
            priority
          />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-10 space-y-10">
        <div>
          <h1 style={{ color: v.headingColor ?? "#111827" }}>{v.name}</h1>
          {v.description && (
            <div className="mt-3 max-w-7xl text-gray-600">
              <RichTextContent html={v.description} />
            </div>
          )}
        </div>

        <VenueView venue={v} />

        {/* Free-form blocks */}
        {blocks.map((block) => {
          if (block.type === "section") return (
            <section key={block.id}>
              {block.headingVisible && block.heading && (
                <h2 style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h2>
              )}
              {block.body && (
                <div className="mt-4 max-w-7xl text-gray-600 leading-relaxed">
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
            <div key={block.id}><Slideshow block={block} /></div>
          );
          if (block.type === "profiles") return (
            <div key={block.id}><ProfilesBlockView block={block} /></div>
          );
          if (block.type === "youtube") return (
            <div key={block.id}><YoutubeBlockView block={block} /></div>
          );
          if (block.type === "video") return (
            <div key={block.id}><VideoBlockView block={block} /></div>
          );
          return null;
        })}

        {/* Inquiry form */}
        <section className="border-t border-gray-200 pt-10">
          <h2 className="mb-6">Send an Inquiry</h2>
          <div className="max-w-7xl">
            <VenueInquiryForm
              venues={[{ slug: v.slug, name: v.name }]}
              preselectedVenue={v.name}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
