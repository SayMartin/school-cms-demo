"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ImageUpload } from "@/components/image-upload";
import { HeadingStyleEditor } from "@/components/heading-style-editor";
import { StudioSaveBar } from "@/components/studio-save-bar";
import { Button } from "@/components/button";
import { BlockToolbar } from "@/components/block-toolbar";
import { BlockCard } from "@/components/block-card";
import { SectionBlockEditor } from "@/components/section-block-editor";
import { AccordionBlockEditor } from "@/components/accordion-block-editor";
import { SlideshowBlockEditor } from "@/components/slideshow-block-editor";
import { YoutubeBlockEditor } from "@/components/youtube-block-editor";
import { VideoBlockEditor } from "@/components/video-block-editor";
import { createBlock } from "@/lib/blocks";
import type { ContentBlock } from "@/lib/blocks";
import { parseContentBlocks } from "@/lib/parse-blocks";

const BLOCK_LABELS: Record<ContentBlock["type"], string> = {
  section: "Section",
  "accordion-section": "Accordion",
  slideshow: "Slideshow",
  profiles: "Profiles",
  youtube: "YouTube",
  video: "Video",
  instagram: "Instagram feed",
};

type NewsItem = {
  title: string;
  slug: string;
  content: string;
  author: string | null;
  imageKey: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  headingColor: string | null;
};

function toLocalDatetime(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function EditAktuellPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalSlug, setOriginalSlug] = useState("");
  const [publishMode, setPublishMode] = useState<"now" | "date">("date");
  const [slugExpanded, setSlugExpanded] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const [title, setTitle] = useState("");
  const [currentSlug, setCurrentSlug] = useState("");
  const [author, setAuthor] = useState("");
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [publishedAt, setPublishedAt] = useState("");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [headingColor, setHeadingColor] = useState<string | undefined>(
    undefined,
  );

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        title,
        slug: currentSlug,
        author,
        imageKey,
        isPublished,
        publishedAt,
        blocks,
        headingColor,
      }),
    [
      title,
      currentSlug,
      author,
      imageKey,
      isPublished,
      publishedAt,
      blocks,
      headingColor,
    ],
  );
  const isDirty = savedSnapshot !== "" && currentSnapshot !== savedSnapshot;

  useEffect(() => {
    fetch(`/api/news/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json() as Promise<NewsItem>;
      })
      .then((data) => {
        setOriginalSlug(data.slug);
        setTitle(data.title);
        setCurrentSlug(data.slug);
        setAuthor(data.author ?? "");
        setImageKey(data.imageKey);
        setIsPublished(data.isPublished);
        const pat = data.publishedAt
          ? toLocalDatetime(new Date(data.publishedAt))
          : "";
        setPublishedAt(pat);
        const parsed = parseContentBlocks(data.content);
        setBlocks(parsed);
        setHeadingColor(data.headingColor ?? undefined);
        setSavedSnapshot(
          JSON.stringify({
            title: data.title,
            slug: data.slug,
            author: data.author ?? "",
            imageKey: data.imageKey,
            isPublished: data.isPublished,
            publishedAt: pat,
            blocks: parsed,
            headingColor: data.headingColor ?? undefined,
          }),
        );
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  function handleTitle(t: string) {
    if (currentSlug === slugify(title)) setCurrentSlug(slugify(t));
    setTitle(t);
  }

  function move(id: string, dir: 1 | -1) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap]!, next[idx]!];
      return next;
    });
  }

  function removeBlock(id: string) {
    setBlocks((b) => b.filter((x) => x.id !== id));
  }

  function updateBlock(id: string, patch: Partial<ContentBlock>) {
    setBlocks((b) =>
      b.map((x) => (x.id === id ? ({ ...x, ...patch } as ContentBlock) : x)),
    );
  }

  function addBlock(type: ContentBlock["type"]) {
    setBlocks((b) => [...b, createBlock(type)]);
  }

  function doDiscard() {
    const snap = JSON.parse(savedSnapshot) as {
      title: string;
      slug: string;
      author: string;
      imageKey: string | null;
      isPublished: boolean;
      publishedAt: string;
      blocks: ContentBlock[];
      headingColor?: string;
    };
    setTitle(snap.title);
    setCurrentSlug(snap.slug);
    setAuthor(snap.author);
    setImageKey(snap.imageKey);
    setIsPublished(snap.isPublished);
    setPublishedAt(snap.publishedAt);
    setBlocks(snap.blocks);
    setHeadingColor(snap.headingColor);
  }

  async function doSave() {
    setSaving(true);
    setError(null);
    try {
      const publishedAtVal = isPublished
        ? publishMode === "now"
          ? new Date().toISOString()
          : new Date(publishedAt).toISOString()
        : undefined;

      const res = await fetch(`/api/news/${originalSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: currentSlug,
          content: JSON.stringify(blocks),
          author: author || null,
          imageKey,
          isPublished,
          publishedAt: publishedAtVal,
          links: [],
          headingColor: headingColor ?? null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/studio/manage-news");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-gray-600">Loading…</div>
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Link
        href="/studio/manage-news"
        className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors"
      >
        ← News
      </Link>
      <h1 className="mt-1">Edit News</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void doSave();
        }}
        className="mt-8 space-y-6"
      >
        <StudioSaveBar
          isDirty={isDirty}
          saving={saving}
          error={error}
          onSave={doSave}
          onDiscard={doDiscard}
        >
          <BlockToolbar
            types={[
              "section",
              "accordion-section",
              "slideshow",
              "youtube",
              "video",
            ]}
            onAdd={addBlock}
          />
        </StudioSaveBar>

        {/* Title */}
        <div>
          <div className="flex items-center gap-6">
            <label className="text-sm font-medium text-gray-700">
              Title{" "}
              <span className="font-normal text-gray-600">(H1 centered)</span>
            </label>
            <HeadingStyleEditor
              color={headingColor}
              onColorChange={setHeadingColor}
              visible={true}
              onVisibleChange={() => {}}
            />
          </div>
          <input
            required
            value={title}
            onChange={(e) => handleTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
          />
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sm text-gray-600 truncate">
              /news/{currentSlug || "…"}
            </span>
            <button
              type="button"
              onClick={() => setSlugExpanded((v) => !v)}
              className="shrink-0 text-sm text-gray-600 hover:text-brand-green-dark transition-colors"
            >
              {slugExpanded ? "Hide slug" : "✎ Edit slug"}
            </button>
          </div>
          {slugExpanded && (
            <input
              required
              value={currentSlug}
              onChange={(e) => setCurrentSlug(e.target.value)}
              className="mt-1.5 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 text-sm shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
            />
          )}
        </div>

        {/* Author */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Author
          </label>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
          />
        </div>

        {/* Blocks */}
        <div className="space-y-3">
          {blocks.map((block, idx) => (
            <BlockCard
              key={block.id}
              label={BLOCK_LABELS[block.type]}
              isFirst={idx === 0}
              isLast={idx === blocks.length - 1}
              onMoveUp={() => move(block.id, -1)}
              onMoveDown={() => move(block.id, 1)}
              onDelete={() => removeBlock(block.id)}
              summary={
                block.type === "accordion-section"
                  ? block.summary
                  : "heading" in block
                    ? block.heading
                    : ""
              }
              summaryColor={
                "headingColor" in block
                  ? (block as { headingColor?: string }).headingColor
                  : undefined
              }
            >
              {block.type === "section" && (
                <SectionBlockEditor
                  block={block}
                  onChange={(p) => updateBlock(block.id, p)}
                />
              )}
              {block.type === "accordion-section" && (
                <AccordionBlockEditor
                  block={block}
                  onChange={(p) => updateBlock(block.id, p)}
                />
              )}
              {block.type === "slideshow" && (
                <SlideshowBlockEditor
                  block={block}
                  uploadPrefix="news"
                  onChange={(p) => updateBlock(block.id, p)}
                />
              )}
              {block.type === "youtube" && (
                <YoutubeBlockEditor
                  block={block}
                  onChange={(p) => updateBlock(block.id, p)}
                />
              )}
              {block.type === "video" && (
                <VideoBlockEditor
                  block={block}
                  onChange={(p) => updateBlock(block.id, p)}
                />
              )}
            </BlockCard>
          ))}
        </div>

        {/* Cover image */}
        <ImageUpload
          value={imageKey}
          onChange={setImageKey}
          prefix="news"
          label="Cover Image"
        />

        {/* Status */}
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isPublished}
            onClick={() => {
              setIsPublished((v) => {
                if (!v && !publishedAt)
                  setPublishedAt(toLocalDatetime(new Date()));
                return !v;
              });
            }}
            className="flex items-center gap-3"
          >
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublished ? "bg-brand-green-dark" : "bg-gray-300"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublished ? "translate-x-6" : "translate-x-1"}`}
              />
            </span>
            <span className="text-sm text-gray-700">
              {isPublished ? "Published" : "Draft"}
            </span>
          </button>
        </div>

        {/* Publish date */}
        {isPublished && (
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700">
              Publish Date
            </legend>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="publishMode"
                  checked={publishMode === "now"}
                  onChange={() => setPublishMode("now")}
                  className="accent-brand-green-dark"
                />
                <span className="text-sm text-gray-700">Update to now</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="publishMode"
                  checked={publishMode === "date"}
                  onChange={() => setPublishMode("date")}
                  className="accent-brand-green-dark"
                />
                <span className="text-sm text-gray-700">
                  Keep / choose date
                </span>
              </label>
            </div>
            {publishMode === "date" && (
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="mt-2 block rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
              />
            )}
          </fieldset>
        )}
        <div className="pt-2">
          <Button type="button" variant="outline-green" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
