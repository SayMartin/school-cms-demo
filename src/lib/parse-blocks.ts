import type {
  ContentBlock,
  HubBlock,
  NavGroupBlock,
  NavGruppItem,
  CourseGroupBlock,
  HubBlockItem,
  SlideshowImage,
} from "@/lib/blocks";

// ─── Legacy block migration helpers ──────────────────────────────────────────

function migrateBlock(block: Record<string, unknown>): Record<string, unknown> {
  if (block.type === "expandable-section") {
    return { ...block, type: "accordion-section" };
  }
  if (block.type === "gallery") {
    const b = block as { id: string; heading: string; headingVisible: boolean; images?: (string | SlideshowImage)[] };
    return {
      id: b.id,
      type: "slideshow",
      heading: b.heading ?? "",
      headingVisible: b.headingVisible ?? false,
      images: (b.images ?? []).map((img) =>
        typeof img === "string" ? { src: img, alt: "" } : { src: img.src, alt: img.alt ?? "" },
      ),
    };
  }
  if (block.type === "expandable") {
    const b = block as { id: string; heading: string; headingVisible: boolean; image?: string; alt?: string };
    return {
      id: b.id,
      type: "slideshow",
      heading: b.heading ?? "",
      headingVisible: b.headingVisible ?? false,
      images: b.image ? [{ src: b.image, alt: b.alt ?? "" }] : [],
    };
  }
  return block;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a `blocks` JSON string into typed ContentBlock[].
 * Migrates legacy gallery/expandable/expandable-section blocks automatically.
 */
export function parseContentBlocks(raw: string): ContentBlock[] {
  try {
    return (JSON.parse(raw) as Record<string, unknown>[])
      .map(migrateBlock) as ContentBlock[];
  } catch {
    return [];
  }
}

/**
 * Parse a `blocks` JSON string into typed HubBlock[].
 * Like parseContentBlocks but also normalises navgrupp and kursgrupp shapes.
 */
export function parseHubBlocks(raw: string): HubBlock[] {
  try {
    return (JSON.parse(raw) as Record<string, unknown>[]).map((block) => {
      const migrated = migrateBlock(block);
      if (migrated.type === "nav-group") {
        const b = migrated as Partial<NavGroupBlock>;
        return {
          id: b.id ?? "",
          type: "nav-group" as const,
          heading: b.heading ?? "",
          headingVisible: b.headingVisible ?? false,
          headingColor: b.headingColor,
          items: Array.isArray(b.items) ? (b.items as NavGruppItem[]) : [],
        } satisfies NavGroupBlock;
      }
      if (migrated.type === "course-group") {
        const b = migrated as Partial<CourseGroupBlock>;
        return {
          id: b.id ?? "",
          type: "course-group" as const,
          heading: b.heading ?? "",
          headingVisible: b.headingVisible,
          headingColor: b.headingColor,
          body: b.body ?? "",
          selectedItems: Array.isArray(b.selectedItems) ? (b.selectedItems as HubBlockItem[]) : [],
          displayMode: b.displayMode,
        } satisfies CourseGroupBlock;
      }
      return migrated as HubBlock;
    });
  } catch {
    return [];
  }
}
