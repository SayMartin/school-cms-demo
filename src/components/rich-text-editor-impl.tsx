"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { useEffect, useState } from "react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    twoColumns: { insertTwoColumns: () => ReturnType };
  }
}

const Column = Node.create({
  name: "column",
  content: "block+",
  parseHTML: () => [{ tag: 'div[data-type="column"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, {
      "data-type": "column",
      class: "rte-col",
    }),
    0,
  ],
});

const TwoColumns = Node.create({
  name: "twoColumns",
  group: "block",
  content: "column column",
  parseHTML: () => [{ tag: 'div[data-type="two-columns"]' }],
  renderHTML: ({ HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, {
      "data-type": "two-columns",
      class: "rte-two-col",
    }),
    0,
  ],
  addCommands() {
    return {
      insertTwoColumns:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: "twoColumns",
            content: [
              { type: "column", content: [{ type: "paragraph" }] },
              { type: "column", content: [{ type: "paragraph" }] },
            ],
          }),
    };
  },
});

const COLOR_SWATCHES = [
  { color: "#ffffff", label: "White (H1/hero)" },
  { color: "#111827", label: "Near black (H2)" },
  { color: "#374151", label: "Mid gray (H3)" },
  { color: "#1f2937", label: "Dark gray (body text)" },
] as const;

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  topSlot?: React.ReactNode;
};

// Link extension extended with class, target, rel attributes.
// renderHTML always returns the key (even as null) so that null explicitly overrides
// the Link extension's default HTMLAttributes ({ target: "_blank", rel: "..." }) via
// mergeAttributes — ProseMirror then skips null attrs when building the DOM.
const LinkWithButton = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: (el) => el.getAttribute("class") || null,
        renderHTML: (attrs) => ({
          class: (attrs.class as string | null) ?? null,
        }),
      },
      target: {
        default: null,
        parseHTML: (el) => el.getAttribute("target") || null,
        renderHTML: (attrs) => ({
          target: (attrs.target as string | null) ?? null,
        }),
      },
      rel: {
        default: null,
        parseHTML: (el) => el.getAttribute("rel") || null,
        renderHTML: (attrs) => ({ rel: (attrs.rel as string | null) ?? null }),
      },
    };
  },
}).configure({
  openOnClick: false,
});

const CLOSED_PANEL = {
  open: false,
  url: "",
  isButton: false,
  newTab: false,
  from: 0,
  to: 0,
};

const btnBase =
  "rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-30";
const btnActive = "bg-brand-green-dark text-gray-900 hover:bg-brand-green-dark";

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`${btnBase} ${active ? btnActive : ""}`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, placeholder, topSlot }: Props) {
  const [, setTick] = useState(0);
  const [linkPanel, setLinkPanel] = useState<{
    open: boolean;
    url: string;
    isButton: boolean;
    newTab: boolean;
    from: number;
    to: number;
  }>({
    open: false,
    url: "",
    isButton: false,
    newTab: false,
    from: 0,
    to: 0,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      LinkWithButton,
      Placeholder.configure({ placeholder: placeholder ?? "Write here…" }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Column,
      TwoColumns,
      TextStyle,
      Color,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    onSelectionUpdate: () => setTick((n) => n + 1),
    editorProps: {
      attributes: {
        class:
          "rich-content min-h-48 px-3 py-2 text-sm text-gray-900 leading-relaxed focus:outline-none",
      },
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement;
        if (target.closest("a")) {
          event.preventDefault();
          return true;
        }
        return false;
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    if (
      value !== editor.getHTML() &&
      value !== (editor.getHTML() === "<p></p>" ? "" : editor.getHTML())
    ) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  function openLinkPanel() {
    if (!editor) return;
    const attrs = editor.getAttributes("link");
    if (editor.isActive("link")) {
      editor.chain().extendMarkRange("link").run();
    }
    const { from, to } = editor.state.selection;
    setLinkPanel({
      open: true,
      url: (attrs.href as string) ?? "",
      isButton: (attrs.class as string) === "rte-btn",
      newTab: (attrs.target as string) === "_blank",
      from,
      to,
    });
  }

  function applyLink() {
    const url = linkPanel.url.trim();
    const sel = { from: linkPanel.from, to: linkPanel.to };
    if (!url) {
      editor?.chain().focus().setTextSelection(sel).unsetMark("link").run();
    } else {
      // Pass explicit null for every attr so schema defaults can't preserve old values
      const attrs: Record<string, string | null> = {
        href: url,
        class: linkPanel.isButton ? "rte-btn" : null,
        target: linkPanel.newTab ? "_blank" : null,
        rel: linkPanel.newTab ? "noopener noreferrer" : null,
      };
      editor
        ?.chain()
        .focus()
        .setTextSelection(sel)
        .unsetMark("link")
        .setMark("link", attrs)
        .run();
    }
  }

  function removeLink() {
    editor
      ?.chain()
      .focus()
      .setTextSelection({ from: linkPanel.from, to: linkPanel.to })
      .unsetMark("link")
      .run();
    setLinkPanel((p) => ({ ...p, url: "", isButton: false, newTab: false }));
  }

  const hasLink = editor?.isActive("link") ?? false;

  return (
    <div className="mt-1 rounded-md border border-gray-300 bg-white shadow-sm focus-within:border-brand-green-dark focus-within:ring-1 focus-within:ring-brand-green-dark overflow-hidden">
      {topSlot && (
        <div className="border-b border-gray-200 bg-white px-3 py-2.5">
          {topSlot}
        </div>
      )}
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <ToolbarButton
          title="Heading 2"
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3"
          active={editor?.isActive("heading", { level: 3 })}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          H3
        </ToolbarButton>

        <span className="mx-1 my-0.5 w-px bg-gray-200" />

        {/* Color swatches */}
        {(() => {
          // Explicit TextStyle mark takes priority; otherwise infer from element type
          const explicitColor = editor?.getAttributes("textStyle").color as string | undefined;
          const impliedColor = !editor ? "#1f2937"
            : editor.isActive("heading", { level: 1 }) ? "#ffffff"
            : editor.isActive("heading", { level: 2 }) ? "#111827"
            : editor.isActive("heading", { level: 3 }) ? "#374151"
            : "#1f2937";
          const activeColor = explicitColor ?? impliedColor;

          return COLOR_SWATCHES.map(({ color, label }) => {
            const isActive = activeColor === color;
            return (
              <button
                key={color}
                type="button"
                title={label}
                onClick={() => editor?.chain().focus().setColor(color).run()}
                className={`h-5 w-7 rounded border-2 self-center transition-all ${
                  isActive
                    ? "border-brand-green-dark ring-2 ring-brand-green-dark ring-offset-1"
                    : "border-gray-300 hover:border-gray-500"
                }`}
                style={{ backgroundColor: color }}
              />
            );
          });
        })()}

        <span className="mx-1 my-0.5 w-px bg-gray-200" />

        <ToolbarButton
          title="Bold"
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h8a4 4 0 010 8H6V4zm0 8h9a4 4 0 010 8H6v-8z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M10 4h4l-4 16H6l4-16zm4 0h4M6 20h4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </ToolbarButton>

        <span className="mx-1 my-0.5 w-px bg-gray-200" />

        <ToolbarButton
          title="Bullet list"
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="4" cy="7" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="4" cy="17" r="1.5" fill="currentColor" stroke="none" />
            <line x1="8" y1="7" x2="20" y2="7" />
            <line x1="8" y1="12" x2="20" y2="12" />
            <line x1="8" y1="17" x2="20" y2="17" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M9 7h11M9 12h11M9 17h11" />
            <path
              d="M4 6h1v4M4 10h2M4 17a1 1 0 011-1h0a1 1 0 011 1v0a1 1 0 01-1 1H4.5l1.5 2H4"
              strokeWidth="1.5"
            />
          </svg>
        </ToolbarButton>

        <span className="mx-1 my-0.5 w-px bg-gray-200" />

        <ToolbarButton
          title="Quote"
          active={editor?.isActive("blockquote")}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton title="Link" active={hasLink} onClick={openLinkPanel}>
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
        </ToolbarButton>

        <span className="mx-1 my-0.5 w-px bg-gray-200" />

        <ToolbarButton
          title="Undo"
          disabled={!editor?.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7v6h6" />
            <path d="M3 13a9 9 0 1018 0 9 9 0 00-9-9 9 9 0 00-6 2.3L3 9" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          disabled={!editor?.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 7v6h-6" />
            <path d="M21 13a9 9 0 10-18 0 9 9 0 009-9 9 9 0 016 2.3L21 9" />
          </svg>
        </ToolbarButton>

        <span className="mx-1 my-0.5 w-px bg-gray-200" />

        {/* Two-column layout */}
        <ToolbarButton
          title="Two columns"
          onClick={() => editor?.chain().focus().insertTwoColumns().run()}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="9" height="16" rx="1" />
            <rect x="13" y="4" width="9" height="16" rx="1" />
          </svg>
        </ToolbarButton>

        <span className="mx-1 my-0.5 w-px bg-gray-200" />

        {/* Table controls */}
        <ToolbarButton
          title="Insert table (3×3)"
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="1" />
            <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          title="Add row"
          disabled={!editor?.isActive("table")}
          onClick={() => editor?.chain().focus().addRowAfter().run()}
        >
          +R
        </ToolbarButton>
        <ToolbarButton
          title="Remove row"
          disabled={!editor?.isActive("table")}
          onClick={() => editor?.chain().focus().deleteRow().run()}
        >
          −R
        </ToolbarButton>
        <ToolbarButton
          title="Add column"
          disabled={!editor?.isActive("table")}
          onClick={() => editor?.chain().focus().addColumnAfter().run()}
        >
          +K
        </ToolbarButton>
        <ToolbarButton
          title="Remove column"
          disabled={!editor?.isActive("table")}
          onClick={() => editor?.chain().focus().deleteColumn().run()}
        >
          −K
        </ToolbarButton>
        <ToolbarButton
          title="Remove table"
          disabled={!editor?.isActive("table")}
          onClick={() => editor?.chain().focus().deleteTable().run()}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="1" />
            <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            <line x1="5" y1="5" x2="19" y2="19" stroke="#ef4444" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Link panel */}
      {linkPanel.open && (
        <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 space-y-2">
          {/* Row 1: URL + close */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                type="url"
                placeholder="https://…"
                value={linkPanel.url}
                onChange={(e) =>
                  setLinkPanel((p) => ({ ...p, url: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyLink();
                  }
                  if (e.key === "Escape") setLinkPanel(CLOSED_PANEL);
                }}
                autoFocus
                className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-brand-green-dark focus:outline-none"
              />
              {!linkPanel.url.trim() && (
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600">
                  URL required
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setLinkPanel(CLOSED_PANEL)}
              className="cursor-pointer shrink-0 rounded border border-gray-300 bg-white px-2.5 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Close link panel"
            >
              ✕ Close
            </button>
          </div>
          {/* Row 2: Options + action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer select-none items-center gap-1.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={linkPanel.isButton}
                onChange={(e) =>
                  setLinkPanel((p) => ({ ...p, isButton: e.target.checked }))
                }
                className="rounded accent-brand-green-dark"
              />
              Show as button
            </label>
            <label className="flex cursor-pointer select-none items-center gap-1.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={linkPanel.newTab}
                onChange={(e) =>
                  setLinkPanel((p) => ({ ...p, newTab: e.target.checked }))
                }
                className="rounded accent-brand-green-dark"
              />
              Open in new tab
            </label>
            <button
              type="button"
              onClick={applyLink}
              disabled={!linkPanel.url.trim()}
              className="cursor-pointer shrink-0 rounded border border-brand-green-dark bg-brand-green-dark px-3 py-1 text-sm font-semibold text-gray-900 hover:bg-brand-green-dark hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply
            </button>
            {hasLink && (
              <button
                type="button"
                onClick={removeLink}
                className="cursor-pointer shrink-0 rounded bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Remove link
              </button>
            )}
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
