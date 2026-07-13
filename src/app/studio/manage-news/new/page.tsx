"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageUpload } from "@/components/image-upload";
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

const BLOCK_LABELS: Record<ContentBlock["type"], string> = {
 section: "Section",
 "accordion-section": "Accordion",
 slideshow: "Slideshow",
 profiles: "Profiles",
 youtube: "YouTube",
 video: "Video",
  instagram: "Instagram feed",
};

function toLocalDatetime(date: Date): string {
 const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
 return local.toISOString().slice(0, 16);
}

function slugify(title: string) {
 return title
 .toLowerCase()
 .replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o")
 .replace(/[^a-z0-9]+/g, "-")
 .replace(/^-|-$/g, "");
}

export default function NewAktuellPage() {
 const router = useRouter();
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [publishMode, setPublishMode] = useState<"now" | "date" | "draft">("now");
 const [slugExpanded, setSlugExpanded] = useState(false);

 const [title, setTitle] = useState("");
 const [currentSlug, setCurrentSlug] = useState("");
 const [author, setAuthor] = useState("");
 const [imageKey, setImageKey] = useState<string | null>(null);
 const [publishedAt, setPublishedAt] = useState(toLocalDatetime(new Date()));
 const [blocks, setBlocks] = useState<ContentBlock[]>([]);

 const isDirty = useMemo(
 () => title !== "" || blocks.length > 0 || author !== "" || imageKey !== null,
 [title, blocks, author, imageKey]
 );

 function handleTitle(t: string) {
 if (currentSlug === slugify(title) || currentSlug === "") setCurrentSlug(slugify(t));
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

 function removeBlock(id: string) { setBlocks((b) => b.filter((x) => x.id !== id)); }

 function updateBlock(id: string, patch: Partial<ContentBlock>) {
 setBlocks((b) => b.map((x) => x.id === id ? { ...x, ...patch } as ContentBlock : x));
 }

 function addBlock(type: ContentBlock["type"]) {
 setBlocks((b) => [...b, createBlock(type)]);
 }

 async function doSave() {
 setSaving(true);
 setError(null);
 try {
 const isDraft = publishMode === "draft";
 const publishedAtVal = isDraft
 ? undefined
 : publishMode === "now"
 ? new Date().toISOString()
 : new Date(publishedAt).toISOString();

 const res = await fetch("/api/news", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 title,
 slug: currentSlug,
 excerpt: "",
 content: JSON.stringify(blocks),
 author: author || undefined,
 imageKey,
 isPublished: !isDraft,
 publishedAt: publishedAtVal,
 links: [],
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

 return (
 <div className="mx-auto max-w-7xl px-4 py-12">
 <Link href="/studio/manage-news" className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors">
 ← News
 </Link>
 <h1 className="mt-1">New Article</h1>

 <form onSubmit={(e) => { e.preventDefault(); void doSave(); }} className="mt-8 space-y-6">
 <StudioSaveBar isDirty={isDirty} saving={saving} error={error} onSave={doSave} onDiscard={() => router.back()}>
 <BlockToolbar types={["section", "accordion-section", "slideshow", "youtube", "video"]} onAdd={addBlock} />
 </StudioSaveBar>

 {/* Title */}
 <div>
 <label className="block text-sm font-medium text-gray-700">Title</label>
 <input
 required
 value={title}
 onChange={(e) => handleTitle(e.target.value)}
 className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
 />
 <div className="mt-1.5 flex items-center gap-2">
 <span className="text-sm text-gray-600 truncate">/news/{currentSlug || "…"}</span>
 <button type="button" onClick={() => setSlugExpanded((v) => !v)}
 className="shrink-0 text-sm text-gray-600 hover:text-brand-green-dark transition-colors">
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
 <label className="block text-sm font-medium text-gray-700">Author</label>
 <input
 value={author}
 onChange={(e) => setAuthor(e.target.value)}
 className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
 />
 </div>

 {/* Blocks */}
 <div className="space-y-3">
 {blocks.map((block, idx) => (
 <BlockCard key={block.id} label={BLOCK_LABELS[block.type]}
 isFirst={idx === 0} isLast={idx === blocks.length - 1}
 onMoveUp={() => move(block.id, -1)} onMoveDown={() => move(block.id, 1)}
 onDelete={() => removeBlock(block.id)}
              summary={block.type === "accordion-section" ? block.summary : ("heading" in block ? block.heading : "")}
              summaryColor={"headingColor" in block ? (block as {headingColor?: string}).headingColor : undefined}
 >
 {block.type === "section" && <SectionBlockEditor block={block} onChange={(p) => updateBlock(block.id, p)} />}
 {block.type === "accordion-section" && <AccordionBlockEditor block={block} onChange={(p) => updateBlock(block.id, p)} />}
 {block.type === "slideshow" && <SlideshowBlockEditor block={block} uploadPrefix="news" onChange={(p) => updateBlock(block.id, p)} />}
 {block.type === "youtube" && <YoutubeBlockEditor block={block} onChange={(p) => updateBlock(block.id, p)} />}
 {block.type === "video" && <VideoBlockEditor block={block} onChange={(p) => updateBlock(block.id, p)} />}
 </BlockCard>
 ))}
 </div>

 {/* Cover image */}
 <ImageUpload value={imageKey} onChange={setImageKey} prefix="news" label="Cover Image" />

 {/* Publishing */}
 <fieldset>
 <legend className="block text-sm font-medium text-gray-700">Publish</legend>
 <div className="mt-2 space-y-2">
 <label className="flex items-center gap-2 cursor-pointer">
 <input type="radio" name="publishMode" checked={publishMode === "now"} onChange={() => setPublishMode("now")} className="accent-brand-green-dark" />
 <span className="text-sm text-gray-700">Immediately</span>
 </label>
 <label className="flex items-center gap-2 cursor-pointer">
 <input type="radio" name="publishMode" checked={publishMode === "date"} onChange={() => setPublishMode("date")} className="accent-brand-green-dark" />
 <span className="text-sm text-gray-700">Choose date</span>
 </label>
 <label className="flex items-center gap-2 cursor-pointer">
 <input type="radio" name="publishMode" checked={publishMode === "draft"} onChange={() => setPublishMode("draft")} className="accent-brand-green-dark" />
 <span className="text-sm text-gray-700">Save as draft</span>
 </label>
 </div>
 {publishMode === "date" && (
 <input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)}
 className="mt-2 block rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
 />
 )}
 </fieldset>
 <div className="pt-2">
 <Button type="button" variant="outline-green" onClick={() => router.back()}>
 Cancel
 </Button>
 </div>
 </form>
 </div>
 );
}
