import { RichTextContent } from "@/components/rich-text-content";
import { AccordionBlock } from "@/components/accordion-block";
import { Slideshow } from "@/components/slideshow";
import { ProfilesBlockView } from "@/components/profiles-block-view";
import { NavGroupBlockView } from "@/components/nav-group-block-view";
import { KursgruppBlockView } from "@/components/kursgrupp-block-view";
import { YoutubeBlockView } from "@/components/youtube-block-view";
import { VideoBlockView } from "@/components/video-block-view";
import type { HubBlock } from "@/lib/blocks";

function renderBlock(block: HubBlock) {
  if (block.type === "nav-group") return (
    <div key={block.id} className="mt-10">
      <NavGroupBlockView block={block} />
    </div>
  );
  if (block.type === "course-group") return (
    <section key={block.id} className="mt-10">
      <KursgruppBlockView block={block} />
    </section>
  );
  if (block.type === "section") return (
    <section key={block.id}>
      {block.headingVisible && block.heading && (
        <h2 style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h2>
      )}
      {block.body && (
        <div className="mt-4 max-w-2xl text-gray-600 leading-relaxed">
          <RichTextContent html={block.body} />
        </div>
      )}
    </section>
  );
  if (block.type === "accordion-section") return (
    <div key={block.id} className="max-w-2xl">
      <AccordionBlock summary={block.summary} summaryColor={block.headingColor}>
        {block.body && <RichTextContent html={block.body} className="text-gray-600" />}
      </AccordionBlock>
    </div>
  );
  if (block.type === "slideshow") return (
    <div key={block.id} className="mt-10">
      <Slideshow block={block} />
    </div>
  );
  if (block.type === "profiles") return (
    <div key={block.id} className="mt-10">
      <ProfilesBlockView block={block} />
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
}

export function HubBlocksView({ blocks }: { blocks: HubBlock[] }) {
  return <>{blocks.map(renderBlock)}</>;
}
