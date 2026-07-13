import { mediaUrl } from "@/lib/r2/client";
import type { VideoBlock } from "@/lib/blocks";

export function VideoBlockView({ block }: { block: VideoBlock }) {
  if (!block.videoKey) return null;

  return (
    <div>
      {block.headingVisible && block.heading && (
        <h2 className="mb-4 text-center" style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h2>
      )}
      <div className="max-w-3xl mx-auto">
        <div className="aspect-video w-full overflow-hidden shadow-sm bg-black">
          <video
            src={mediaUrl(block.videoKey)}
            controls
            className="h-full w-full"
            preload="metadata"
          />
        </div>
        {block.caption && <p className="mt-2">{block.caption}</p>}
      </div>
    </div>
  );
}
