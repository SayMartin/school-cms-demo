import Link from "next/link";

export type ContentType = "blocks" | "fields" | "data";

export const CONTENT_TYPE_META: Record<
  ContentType,
  { label: string; className: string }
> = {
  blocks: {
    label: "Block-editor",
    className: "border-green-600 text-green-700",
  },
  fields: {
    label: "Fields",
    className: "border-brand-pink-dark text-brand-pink-dark",
  },
  data: { label: "Data", className: "border-blue-500 text-blue-600" },
};

export type StudioSection = {
  href: string;
  label: string;
  description: string;
  typeLabel?: string;
  color: string;
  contentTypes: ContentType[];
};

export function StudioSectionCard({ s }: { s: StudioSection }) {
  return (
    <li className="h-full">
      <Link
        href={s.href}
        className={`flex flex-col h-full rounded-lg border border-gray-200 border-t-4 ${s.color} bg-white p-6 hover:shadow-md transition-shadow`}
      >
        <h3 className="text-base font-semibold text-gray-900 leading-snug">
          {s.label}
        </h3>
        <div className="mt-2 flex flex-1 flex-col justify-between">
          <div className="flex items-start justify-between gap-3 text-sm text-gray-600">
            <p className="line-clamp-2 ">{s.description}</p>
            {s.typeLabel && (
              <span className="shrink-0 whitespace-nowrap">{s.typeLabel}</span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {s.contentTypes.map((ct) => (
              <span
                key={ct}
                className={`inline-block rounded-full border px-2 py-0.5 text-sm font-medium ${CONTENT_TYPE_META[ct].className}`}
              >
                {CONTENT_TYPE_META[ct].label}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </li>
  );
}
