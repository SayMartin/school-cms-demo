import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db/client";
import { venuesContent } from "@/lib/db/schema";
import { NavGroupBlockView } from "@/components/nav-group-block-view";
import { RichTextContent } from "@/components/rich-text-content";
import { AccordionBlock } from "@/components/accordion-block";
import { Slideshow } from "@/components/slideshow";
import { ProfilesBlockView } from "@/components/profiles-block-view";
import { YoutubeBlockView } from "@/components/youtube-block-view";
import { VideoBlockView } from "@/components/video-block-view";
import type {
  SectionBlock,
  AccordionSectionBlock,
  SlideshowBlock,
  ProfilesBlock,
  NavGroupBlock,
  NavGruppItem,
  YoutubeBlock,
  VideoBlock,
} from "@/lib/blocks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Venues" };

type VenueBlock =
  | SectionBlock
  | AccordionSectionBlock
  | SlideshowBlock
  | ProfilesBlock
  | NavGroupBlock
  | YoutubeBlock
  | VideoBlock;

function parseVenueBlocks(raw: string): VenueBlock[] {
  try {
    return (JSON.parse(raw) as Record<string, unknown>[]).map((block) => {
      if (block.type === "nav-group") {
        const b = block as Partial<NavGroupBlock>;
        return {
          id: b.id ?? "",
          type: "nav-group" as const,
          heading: b.heading ?? "",
          headingVisible: b.headingVisible ?? false,
          items: Array.isArray(b.items) ? (b.items as NavGruppItem[]) : [],
        } satisfies NavGroupBlock;
      }
      return block as unknown as VenueBlock;
    });
  } catch {
    return [];
  }
}

export default async function VenuesPage() {
  const { env } = getCloudflareContext();
  const db = getDb();

  const venueRows = await db.select().from(venuesContent).where(eq(venuesContent.id, "main")).limit(1);
  const venueBlocks = parseVenueBlocks(venueRows[0]?.blocks ?? "[]");
  void env; // env used by inquiry-form on detail pages

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-10">
      {venueRows[0]?.headingVisible && venueRows[0]?.heading && (
        <h1 className="text-center" style={{ color: venueRows[0].headingColor ?? "#111827" }}>{venueRows[0].heading}</h1>
      )}

      {/* Fria intro-block (NavGrupp, Sektion etc.) */}
      {venueBlocks.map((block) => {
        if (block.type === "nav-group") return (
          <div key={block.id}><NavGroupBlockView block={block} /></div>
        );
        if (block.type === "section") return (
          <section key={block.id}>
            {block.headingVisible && block.heading && (
              <h2 style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h2>
            )}
            {block.body && (
              <div className="mt-4 max-w-7xl text-gray-600">
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

    </div>
  );
}
