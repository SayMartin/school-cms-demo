import type { YoutubeBlock } from "@/lib/blocks";

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#]+)/,
    /\/embed\/([^?&#]+)/,
    /\/shorts\/([^?&#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function YoutubeBlockView({ block }: { block: YoutubeBlock }) {
  const videoId = extractYoutubeId(block.url);
  if (!videoId) return null;

  return (
    <div>
      {block.headingVisible && block.heading && (
        <h2 className="mb-4" style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h2>
      )}
      <div className="aspect-video w-full overflow-hidden shadow-sm">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={block.heading || "YouTube-video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
      {block.caption && <p className="mt-2">{block.caption}</p>}
    </div>
  );
}
