import Link from "next/link";
import Image from "next/image";
import { mediaUrl } from "@/lib/r2/client";

type Props = {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  author?: string | null;
  imageKey?: string | null;
  titleColor?: string;
  bandColor?: string;
  index: number;
};

export function NewsCard({
  title,
  slug,
  publishedAt,
  author,
  imageKey,
  titleColor,
  bandColor,
}: Props) {
  const date = new Date(publishedAt).toLocaleDateString("en-US", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const imgSrc = imageKey
    ? imageKey.startsWith("/")
      ? imageKey
      : mediaUrl(imageKey)
    : "/hero.jpg";

  return (
    <li className="aspect-square">
      <Link
        href={`/news/${slug}`}
        className="group relative flex h-full w-full overflow-hidden rounded-full hover:shadow-xl transition-shadow"
      >
        <Image
          src={imgSrc}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
          unoptimized
        />

        <div className="absolute top-[62%] left-0 right-0 h-[22%]" style={{ backgroundColor: bandColor ?? "#CBCBFF" }} />
        <div className="absolute top-[60%] left-0 right-0 h-[26%] flex flex-col items-center justify-center text-center px-[10%]">
          <h3 className="tracking-widest leading-snug line-clamp-2 hyphens-auto" style={{ color: titleColor ?? "#111827" }}>
            {title}
          </h3>
          <p className="mt-0.5">
            {date}
            {author ? ` · ${author}` : ""}
          </p>
        </div>
      </Link>
    </li>
  );
}
