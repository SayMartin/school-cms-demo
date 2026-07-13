import { RichTextContent } from "@/components/rich-text-content";
import { AccordionBlock } from "@/components/accordion-block";
import { Slideshow } from "@/components/slideshow";
import { ProfilesBlockView } from "@/components/profiles-block-view";
import { YoutubeBlockView } from "@/components/youtube-block-view";
import { VideoBlockView } from "@/components/video-block-view";
import { InstagramFeed } from "@/components/instagram-feed";
import { parseContentBlocks } from "@/lib/parse-blocks";
import type { ContentBlock } from "@/lib/blocks";
import type { InstagramPost } from "@/lib/instagram";

export function KursBlocksView({
  blocksJson,
  instagramPosts = [],
}: {
  blocksJson: string;
  instagramPosts?: InstagramPost[];
}) {
  const blocks = parseContentBlocks(blocksJson);
  if (blocks.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 space-y-8">
      {blocks.map((block: ContentBlock) => {
        if (block.type === "section")
          return (
            <div key={block.id}>
              {block.headingVisible && block.heading && (
                <h2>{block.heading}</h2>
              )}
              {block.body && (
                <div
                  className={`${block.headingVisible && block.heading ? "mt-3" : ""} leading-relaxed`}
                >
                  <RichTextContent html={block.body} />
                </div>
              )}
            </div>
          );
        if (block.type === "accordion-section")
          return (
            <div key={block.id}>
              <AccordionBlock summary={block.summary} summaryColor={block.headingColor}>
                {block.body && <RichTextContent html={block.body} />}
              </AccordionBlock>
            </div>
          );
        if (block.type === "slideshow")
          return (
            <div key={block.id}>
              <Slideshow block={block} />
            </div>
          );
        if (block.type === "profiles")
          return <ProfilesBlockView key={block.id} block={block} />;
        if (block.type === "youtube")
          return (
            <div key={block.id}>
              <YoutubeBlockView block={block} />
            </div>
          );
        if (block.type === "video")
          return (
            <div key={block.id}>
              <VideoBlockView block={block} />
            </div>
          );
        if (block.type === "instagram")
          return <InstagramFeed key={block.id} posts={instagramPosts} />;
        return null;
      })}
    </div>
  );
}
