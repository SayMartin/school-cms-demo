import type { InstagramPost } from "@/lib/instagram";

type Props = {
  posts: InstagramPost[];
};

export function InstagramFeed({ posts }: Props) {
  if (posts.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8">
      <div className="grid grid-cols-5 gap-1">
        {posts.map((post) => {
          const imgSrc =
            post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url;
          if (!imgSrc) return null;
          return (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden"
              aria-label={post.caption ?? "Instagram post"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={post.caption ?? ""}
                className="w-full aspect-square object-cover hover:opacity-90 transition-opacity"
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}
