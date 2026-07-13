import dynamic from "next/dynamic";

// Tiptap/Prosemirror is client-only — keep it out of the server bundle entirely.
export const RichTextEditor = dynamic(
  () => import("./rich-text-editor-impl").then((m) => ({ default: m.RichTextEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="mt-1 min-h-48 animate-pulse rounded-md border border-gray-200 bg-gray-50" />
    ),
  }
);
