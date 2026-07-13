import Link from "next/link";
import { getColorHex } from "@/lib/brand-colors";

type Props = {
  name: string;
  nameColor?: string;
  href: string;
  ingress?: string;
  color?: string;
};

export function NavHubCard({
  name,
  nameColor,
  href,
  ingress,
  color = "brand-parchment",
}: Props) {
  return (
    <li className="aspect-square">
      <Link
        href={href}
        className="group flex h-full w-full items-center justify-center overflow-hidden rounded-full hover:shadow-xl transition-shadow"
        style={{ backgroundColor: getColorHex(color) }}
      >
        <div className="flex flex-col items-center px-[14%]">
          <h3 className="leading-snug text-center line-clamp-2 hyphens-auto" style={{ color: nameColor ?? "#111827" }}>
            {name}
          </h3>
          {ingress && (
            <p className="mt-1 leading-snug text-gray-700 text-center line-clamp-6 hyphens-auto">
              {ingress}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}
