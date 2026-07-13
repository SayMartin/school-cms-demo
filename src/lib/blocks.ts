export type SlideshowImage = { src: string; alt: string };

export type SlideshowBlock = {
  id: string;
  type: "slideshow";
  heading: string;
  headingVisible: boolean;
  headingColor?: string;
  images: SlideshowImage[];
};

export type SectionBlock = {
  id: string;
  type: "section";
  heading: string;
  headingVisible: boolean;
  headingColor?: string;
  body: string;
};

export type AccordionSectionBlock = {
  id: string;
  type: "accordion-section";
  summary: string;
  headingColor?: string;
  body: string;
};

export type ProfilesBlock = {
  id: string;
  type: "profiles";
  heading: string;
  headingVisible: boolean;
  headingColor?: string;
  profileIds: string[];
};

export type YoutubeBlock = {
  id: string;
  type: "youtube";
  heading: string;
  headingVisible: boolean;
  headingColor?: string;
  url: string;
  caption: string;
};

export type VideoBlock = {
  id: string;
  type: "video";
  heading: string;
  headingVisible: boolean;
  headingColor?: string;
  videoKey: string;
  caption: string;
};

export type InstagramBlock = {
  id: string;
  type: "instagram";
  heading?: string;
  headingVisible?: boolean;
};

export type HubBlockItem = {
  id: string;
  itemType: "course" | "department";
  color?: string; // BrandColorToken — band color (with-image) or background (without-image)
  titleColor?: string; // title text color override (#ffffff or #111827)
};

export type CourseGroupBlock = {
  id: string;
  type: "course-group";
  heading: string;
  headingVisible?: boolean;
  headingColor?: string;
  body: string;
  selectedItems: HubBlockItem[];
  displayMode?: "with-image" | "without-image";
};

export type NavGruppItem = {
  id: string;
  name: string;
  nameColor?: string;
  href: string;
  ballType?: "image" | "color";
  imageKey?: string;
  ingress?: string;
  color?: string; // BrandColorToken
};

export type NavGroupBlock = {
  id: string;
  type: "nav-group";
  heading: string;
  headingVisible: boolean;
  headingColor?: string;
  items: NavGruppItem[];
};

// ─── Block factory ───────────────────────────────────────────────────────────

/** Create a new ContentBlock with default values for the given type. */
export function createBlock(type: ContentBlock["type"]): ContentBlock {
  const base = { id: crypto.randomUUID(), heading: "", headingVisible: false };
  switch (type) {
    case "accordion-section":
      return {
        id: crypto.randomUUID(),
        type: "accordion-section",
        summary: "",
        body: "",
      };
    case "slideshow":
      return { ...base, type: "slideshow", images: [] };
    case "profiles":
      return { ...base, type: "profiles", profileIds: [] };
    case "youtube":
      return { ...base, type: "youtube", url: "", caption: "" };
    case "video":
      return { ...base, type: "video", videoKey: "", caption: "" };
    case "instagram":
      return { id: crypto.randomUUID(), type: "instagram" };
    default:
      return { ...base, type: "section", body: "" };
  }
}

/** Create a new HubBlock with default values for the given type. */
export function createHubBlock(type: HubBlock["type"]): HubBlock {
  switch (type) {
    case "nav-group":
      return {
        id: crypto.randomUUID(),
        type: "nav-group",
        heading: "",
        headingVisible: false,
        items: [],
      };
    case "course-group":
      return {
        id: crypto.randomUUID(),
        type: "course-group",
        heading: "",
        body: "",
        selectedItems: [],
        displayMode: "with-image",
      };
    default:
      return createBlock(type as ContentBlock["type"]);
  }
}

// ─── Shared union types ───────────────────────────────────────────────────────

/** Blocks used on regular content pages (not hub-specific). */
export type ContentBlock =
  | SectionBlock
  | AccordionSectionBlock
  | SlideshowBlock
  | ProfilesBlock
  | YoutubeBlock
  | VideoBlock
  | InstagramBlock;

/** Blocks used on hub pages — extends ContentBlock with hub-specific types. */
export type HubBlock = ContentBlock | CourseGroupBlock | NavGroupBlock;
