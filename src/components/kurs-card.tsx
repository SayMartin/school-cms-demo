import Link from "next/link";
import Image from "next/image";
import { mediaUrl } from "@/lib/r2/client";

type Props = {
  title: string;
  titleColor?: string;
  href: string;
  imageKey?: string | null;
  courseType?: string | null;
  deliveryMode?: string | null;
  bandColor?: string;
};

export function KursCard({ title, titleColor, href, imageKey, bandColor }: Props) {
  const imgSrc = imageKey
    ? imageKey.startsWith("/")
      ? imageKey
      : mediaUrl(imageKey)
    : null;

  return (
    <li className="aspect-square">
      <Link
        href={href}
        className="group relative flex h-full w-full overflow-hidden rounded-full hover:shadow-xl transition-shadow"
      >
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gray-100" />
        )}
        <div className="absolute top-[62%] left-0 right-0 h-[22%]" style={{ backgroundColor: bandColor ?? "#CBCBFF" }} />
        <div className="absolute top-[60%] left-0 right-0 h-[26%] flex items-center justify-center px-[10%]">
          <h2 className="tracking-widest uppercase text-center leading-snug line-clamp-3 hyphens-auto" style={{ color: titleColor ?? "#111827" }}>
            {title}
          </h2>
        </div>
      </Link>
    </li>
  );
}
