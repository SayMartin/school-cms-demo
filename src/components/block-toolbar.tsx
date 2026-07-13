"use client";

const LABELS: Record<string, string> = {
  section: "Section",
  "accordion-section": "Accordion",
  slideshow: "Slideshow",
  profiles: "Profiles",
  "nav-group": "NavGroup",
  "course-group": "CourseGroup",
  youtube: "YouTube",
  video: "Video",
  instagram: "Instagram feed",
};

type Props<T extends string> = {
  types: T[];
  onAdd: (type: T) => void;
  /** Short label shown before "Add block:" */
  label?: string;
};

export function BlockToolbar<T extends string>({
  types,
  onAdd,
  label,
}: Props<T>) {
  const container =
    "flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-2";
  const btnClass =
    "rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 transition-colors";

  return (
    <div className={container}>
      {label && <span className="mr-2">{label}</span>}
      <span>Add block:</span>
      {types.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onAdd(type)}
          className={btnClass}
        >
          + {LABELS[type] ?? type}
        </button>
      ))}
    </div>
  );
}
