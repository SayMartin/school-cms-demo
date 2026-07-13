"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ImageUpload } from "@/components/image-upload";
import { HeadingStyleEditor } from "@/components/heading-style-editor";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/button";
import { StudioSaveBar } from "@/components/studio-save-bar";
import { BlockCard } from "@/components/block-card";
import { SectionBlockEditor } from "@/components/section-block-editor";
import { AccordionBlockEditor } from "@/components/accordion-block-editor";
import { SlideshowBlockEditor } from "@/components/slideshow-block-editor";
import { ProfilesBlockEditor } from "@/components/profiles-block-editor";
import { BlockToolbar } from "@/components/block-toolbar";
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
  instagram: "Instagram Feed",
};

const inputClass = "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark";

const DELIVERY_MODES = [
 { value: "campus", label: "On campus" },
 { value: "distance_hybrid", label: "Distance with in-person meetups" },
 { value: "distance_pure", label: "Distance without in-person meetups" },
 { value: "outdoor", label: "Outdoors" },
];

const STUDY_AID_LEVELS = [
 { value: "", label: "— Select level —" },
 { value: "compulsory", label: "Compulsory school level" },
 { value: "upper_secondary", label: "Upper secondary level" },
 { value: "post_secondary", label: "Post-secondary level" },
 { value: "none", label: "Not eligible for study aid" },
];

const STUDY_PACES = [
 { value: "", label: "— Select study pace —" },
 { value: "25", label: "25%" },
 { value: "50", label: "50%" },
 { value: "75", label: "75%" },
 { value: "100", label: "100% (full-time)" },
];


type KursDetail = {
 id: string;
 courseType: string;
 deliveryMode: string | null;
 parentKursId: string | null;
 slug: string;
 title: string;
 excerpt: string;
 description: string;
 imageKey: string | null;
 isPublished: boolean;
 duration: string | null;
 studyPace: number | null;
 studyAidLevel: string | null;
 hasAccommodation: boolean;
 locationText: string | null;
 tracks: string;
 blocks: string;
 headingColor: string | null;
 applicationSectionHeading: string;
 avdelningIds: string[];
};

type Department = { id: string; name: string; sortOrder: number };

export default function EditKursPage() {
 const router = useRouter();
 const { slug: currentSlug } = useParams<{ slug: string }>();

 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [slugExpanded, setSlugExpanded] = useState(false);
 const [savedSnapshot, setSavedSnapshot] = useState("");
 const [departments, setDepartments] = useState<Department[]>([]);
 const [blocks, setBlocks] = useState<ContentBlock[]>([]);
 const [savedBlocksSnapshot, setSavedBlocksSnapshot] = useState("");
 const [headingColor, setHeadingColor] = useState<string | undefined>(undefined);
 const [savedHeadingColor, setSavedHeadingColor] = useState<string | undefined>(undefined);

 const [form, setForm] = useState({
 courseType: "program" as "program" | "program_track" | "short" | "summer" | "evening",
 deliveryMode: "campus",
 title: "",
 slug: "",
 excerpt: "",
 description: "",
 imageKey: null as string | null,
 isPublished: false,
 duration: "",
 studyPace: "",
 studyAidLevel: "",
 hasAccommodation: false,
 locationText: "",
 applicationSectionHeading: "",
 tracks: "",
 avdelningIds: [] as string[],
 });

 useEffect(() => {
 void fetch("/api/departments?courses=true")
 .then((r) => r.json() as Promise<Department[]>)
 .then(setDepartments)
 .catch(() => { /* departments are optional, fail silently */ });
 }, []);

 useEffect(() => {
 fetch(`/api/courses/${currentSlug}`)
 .then((r) => {
 if (!r.ok) throw new Error("Not found");
 return r.json();
 })
 .then((raw) => {
 const d = raw as KursDetail;
 const loaded = {
 courseType: d.courseType as "program" | "program_track" | "short" | "summer" | "evening",
 deliveryMode: d.deliveryMode ?? "campus",
 title: d.title,
 slug: d.slug,
 excerpt: d.excerpt,
 description: d.description,
 imageKey: d.imageKey,
 isPublished: d.isPublished,
 duration: d.duration ?? "",
 studyPace: d.studyPace != null ? String(d.studyPace) : "",
 studyAidLevel: d.studyAidLevel ?? "",
 hasAccommodation: d.hasAccommodation,
 locationText: d.locationText ?? "",
 applicationSectionHeading: d.applicationSectionHeading ?? "",
 tracks: (() => { try { return (JSON.parse(d.tracks ?? "[]") as string[]).join(", "); } catch { return ""; } })(),
 avdelningIds: d.avdelningIds ?? [],
 };
 const parsedBlocks = (() => {
 try { return JSON.parse(d.blocks ?? "[]") as ContentBlock[]; } catch { return []; }
 })();
 setForm(loaded);
 setHeadingColor(d.headingColor ?? undefined);
 setSavedHeadingColor(d.headingColor ?? undefined);
 setSavedSnapshot(JSON.stringify(loaded));
 setBlocks(parsedBlocks);
 setSavedBlocksSnapshot(JSON.stringify(parsedBlocks));
 })
 .catch(() => setError("Could not load course."))
 .finally(() => setLoading(false));
 }, [currentSlug]);

 const deliveryModes = DELIVERY_MODES;

 const urlPrefix =
 form.courseType === "program" ? "/education-programs"
 : form.courseType === "short" ? ""
 : form.courseType === "summer" ? "/summer-courses"
 : "/evening-courses";

 const isDirty = savedSnapshot !== "" && (
 JSON.stringify(form) !== savedSnapshot ||
 JSON.stringify(blocks) !== savedBlocksSnapshot ||
 headingColor !== savedHeadingColor
 );

 function move(id: string, dir: 1 | -1) {
 const idx = blocks.findIndex((b) => b.id === id);
 if (idx < 0) return;
 const next = [...blocks];
 const swap = idx + dir;
 if (swap < 0 || swap >= next.length) return;
 [next[idx], next[swap]] = [next[swap]!, next[idx]!];
 setBlocks(next);
 }

 function removeBlock(id: string) {
 setBlocks(blocks.filter((b) => b.id !== id));
 }

 function updateBlock(id: string, patch: Partial<ContentBlock>) {
 setBlocks(blocks.map((b) => b.id === id ? { ...b, ...patch } as ContentBlock : b));
 }

 function addBlock(type: ContentBlock["type"]) {
 setBlocks([...blocks, createBlock(type)]);
 }

 function doDiscard() {
 setForm(JSON.parse(savedSnapshot) as typeof form);
 setBlocks(JSON.parse(savedBlocksSnapshot) as ContentBlock[]);
 setHeadingColor(savedHeadingColor);
 }

 async function doSave() {
 const errs: string[] = [];
 if (!form.title.trim()) errs.push("Title");
 if (!form.excerpt.replace(/<[^>]*>/g, "").trim()) errs.push("Excerpt");
 if (errs.length > 0) {
 setError("Required fields are missing: " + errs.join(", ") + ".");
 return;
 }
 setSaving(true);
 setError(null);
 try {
 const res = await fetch(`/api/courses/${currentSlug}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 courseType: form.courseType,
 deliveryMode: form.deliveryMode || null,
 slug: form.slug,
 title: form.title,
 excerpt: form.excerpt,
 description: form.description,
 imageKey: form.imageKey,
 isPublished: form.isPublished,
 duration: form.duration || null,
 studyPace: form.studyPace !== "" ? Number(form.studyPace) : null,
 studyAidLevel: form.studyAidLevel || null,
 hasAccommodation: form.hasAccommodation,
 locationText: form.locationText || null,
 applicationSectionHeading: form.applicationSectionHeading,
 tracks: JSON.stringify(form.tracks.split(",").map((t) => t.trim()).filter(Boolean)),
 blocks: JSON.stringify(blocks),
 headingColor: headingColor ?? null,
 avdelningIds: form.avdelningIds,
 }),
 });
 if (!res.ok) throw new Error(await res.text());
 const updated = await res.json() as KursDetail;
 setSavedSnapshot(JSON.stringify(form));
 setSavedBlocksSnapshot(JSON.stringify(blocks));
 setSavedHeadingColor(headingColor);
 if (updated.slug !== currentSlug) {
 router.replace(`/studio/manage-courses/${updated.slug}/edit`);
 }
 } catch (err) {
 setError(err instanceof Error ? err.message : "Something went wrong.");
 } finally {
 setSaving(false);
 }
 }

 if (loading) return <div className="mx-auto max-w-7xl px-4 py-12 text-gray-600">Loading…</div>;

 return (
 <div className="mx-auto max-w-7xl px-4 py-12">
 <Link href="/studio/manage-courses" className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors">
 ← Manage Courses
 </Link>
 <h1 className="mt-1">Edit Course</h1>

 <form onSubmit={(e) => { e.preventDefault(); void doSave(); }} className="mt-8 space-y-6">
 <StudioSaveBar isDirty={isDirty} saving={saving} error={error} onSave={() => void doSave()} onDiscard={doDiscard}>
 <BlockToolbar types={["section", "accordion-section", "slideshow", "profiles", "youtube", "video", "instagram"]} onAdd={addBlock} />
 </StudioSaveBar>

 {/* ── Course Type + Delivery Mode ──────────────────────────── */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-700">Course Type <span className="text-red-500">*</span></label>
 <select
 value={form.courseType}
 onChange={(e) => setForm((f) => ({ ...f, courseType: e.target.value as "program" | "program_track" | "short" | "summer" | "evening", deliveryMode: "campus" }))}
 className={`bg-white ${inputClass}`}
 >
 <option value="program">Program (long course)</option>
 <option value="program_track">Program Track</option>
 <option value="short">Short Course (MHFA, SMF)</option>
 <option value="summer">Summer Course</option>
 <option value="evening">Evening Course</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700">Delivery Mode <span className="text-red-500">*</span></label>
 <select
 value={form.deliveryMode}
 onChange={(e) => setForm((f) => ({ ...f, deliveryMode: e.target.value }))}
 className={`bg-white ${inputClass}`}
 >
 {deliveryModes.map((m) => (
 <option key={m.value} value={m.value}>{m.label}</option>
 ))}
 </select>
 </div>
 </div>

 {/* ── Title ────────────────────────────────────────────── */}
 {/* SchoolSoft ID is now managed per course instance (Studio → Course Instances), not here. */}
 <div>
 <div className="flex items-center gap-6">
 <label className="text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span> <span className="font-normal text-gray-600">(H1)</span></label>
 <HeadingStyleEditor color={headingColor} onColorChange={setHeadingColor} visible={true} onVisibleChange={() => {}} />
 </div>
 <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputClass} />
 <div className="mt-1.5 flex items-center gap-2">
 <span className="text-sm text-gray-600 truncate">{urlPrefix}/{form.slug || "…"}</span>
 <button type="button" onClick={() => setSlugExpanded((v) => !v)} className="shrink-0 text-sm text-gray-600 hover:text-brand-green-dark transition-colors">
 {slugExpanded ? "Hide slug" : "✎ Edit slug"}
 </button>
 </div>
 {slugExpanded && (
 <input required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className={`mt-1.5 text-sm ${inputClass}`} />
 )}
 </div>

 {/* ── Excerpt ──────────────────────────────────────────── */}
 <div>
 <label className="block text-sm font-medium text-gray-700">Excerpt <span className="text-red-500">*</span></label>
 <RichTextEditor
 value={form.excerpt}
 onChange={(html) => setForm((f) => ({ ...f, excerpt: html }))}
 placeholder="Short description shown on the course page…"
 />
 </div>

 {/* ── Duration display text ───────────────────────────────── */}
 <div>
 <label className="block text-sm font-medium text-gray-700">Duration (display text)</label>
 <input placeholder="e.g. 2 terms" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} className={inputClass} />
 </div>

 {/* ── Study pace and study aid ────────────────────────── */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-700">Study Pace</label>
 <select value={form.studyPace} onChange={(e) => setForm((f) => ({ ...f, studyPace: e.target.value }))} className={`bg-white ${inputClass}`}>
 {STUDY_PACES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700">Study Aid Level</label>
 <select value={form.studyAidLevel} onChange={(e) => setForm((f) => ({ ...f, studyAidLevel: e.target.value }))} className={`bg-white ${inputClass}`}>
 {STUDY_AID_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
 </select>
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700">Location</label>
 <p className="text-sm text-gray-600 mb-1">Shown in the course intro — e.g. &quot;Demo Folk High School in Lindeby&quot;</p>
 <input placeholder="e.g. Demo Folk High School in Lindeby" value={form.locationText} onChange={(e) => setForm((f) => ({ ...f, locationText: e.target.value }))} className={inputClass} />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700">Application Section Heading</label>
 <p className="text-sm text-gray-600 mb-1">Shown above the application instances — leave blank for the default value &quot;Application&quot;</p>
 <input placeholder="Application" value={form.applicationSectionHeading} onChange={(e) => setForm((f) => ({ ...f, applicationSectionHeading: e.target.value }))} className={inputClass} />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700">Tracks</label>
 <p className="text-sm text-gray-600 mb-1">Comma-separated — e.g. &quot;Foundation Intro, Foundation, IT, University Prep&quot;</p>
 <input placeholder="e.g. Foundation Intro, Foundation, IT" value={form.tracks} onChange={(e) => setForm((f) => ({ ...f, tracks: e.target.value }))} className={inputClass} />
 </div>

 {/* ── Accommodation ───────────────────────────────────────────── */}
 <div>
 <span className="block text-sm font-medium text-gray-700 mb-2">Accommodation</span>
 <button
 type="button"
 role="switch"
 aria-checked={form.hasAccommodation}
 onClick={() => setForm((f) => ({ ...f, hasAccommodation: !f.hasAccommodation }))}
 className="flex items-center gap-3"
 >
 <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.hasAccommodation ? "bg-brand-green-dark" : "bg-gray-300"}`}>
 <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.hasAccommodation ? "translate-x-6" : "translate-x-1"}`} />
 </span>
 <span className="text-sm text-gray-700">This course offers accommodation</span>
 </button>
 </div>

 {/* ── Departments ──────────────────────────────────────── */}
 {departments.length > 0 && (
 <div>
 <span className="block text-sm font-medium text-gray-700 mb-2">Departments</span>
 <div className="grid grid-cols-2 gap-2">
 {departments.map((dept) => (
 <label key={dept.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
 <input
 type="checkbox"
 checked={form.avdelningIds.includes(dept.id)}
 onChange={() => setForm((f) => ({
 ...f,
 avdelningIds: f.avdelningIds.includes(dept.id)
 ? f.avdelningIds.filter((id) => id !== dept.id)
 : [...f.avdelningIds, dept.id],
 }))}
 className="rounded border-gray-300 text-brand-green-dark focus:ring-brand-green-dark"
 />
 {dept.name}
 </label>
 ))}
 </div>
 </div>
 )}

 {/* ── Image ─────────────────────────────────────────────── */}
 <ImageUpload
 value={form.imageKey}
 onChange={(key) => setForm((f) => ({ ...f, imageKey: key }))}
 prefix="kurser"
 label="Cover Image"
 heroPreview
 />

 {/* ── Extra Content ───────────────────────────────────── */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">Extra Content</label>
 {blocks.length === 0 ? (
 <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
 <p className="text-sm text-gray-600">No extra blocks yet. Add e.g. a slideshow or a section above.</p>
 </div>
 ) : (
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
              summary={block.type === "accordion-section" ? block.summary : ("heading" in block ? block.heading : "")}
              summaryColor={"headingColor" in block ? (block as {headingColor?: string}).headingColor : undefined}
 >
 {block.type === "section" && (
 <SectionBlockEditor block={block} onChange={(patch) => updateBlock(block.id, patch)} />
 )}
 {block.type === "accordion-section" && (
 <AccordionBlockEditor block={block} onChange={(patch) => updateBlock(block.id, patch)} />
 )}
 {block.type === "slideshow" && (
 <SlideshowBlockEditor block={block} uploadPrefix="kurser" onChange={(patch) => updateBlock(block.id, patch)} />
 )}
 {block.type === "profiles" && (
 <ProfilesBlockEditor block={block} onChange={(patch) => updateBlock(block.id, patch)} />
 )}
 {block.type === "youtube" && (
 <YoutubeBlockEditor block={block} onChange={(patch) => updateBlock(block.id, patch)} />
 )}
 {block.type === "video" && (
 <VideoBlockEditor block={block} onChange={(patch) => updateBlock(block.id, patch)} />
 )}
 </BlockCard>
 ))}
 </div>
 )}
 </div>

 {/* ── Publishing Status ───────────────────────────────── */}
 <div>
 <span className="block text-sm font-medium text-gray-700 mb-2">Status</span>
 <button
 type="button"
 role="switch"
 aria-checked={form.isPublished}
 onClick={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}
 className="flex items-center gap-3"
 >
 <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isPublished ? "bg-brand-green-dark" : "bg-gray-300"}`}>
 <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isPublished ? "translate-x-6" : "translate-x-1"}`} />
 </span>
 <span className="text-sm text-gray-700">{form.isPublished ? "Published" : "Draft"}</span>
 </button>
 </div>

 <div className="pt-2">
 <Button type="button" variant="outline-green" onClick={() => router.back()}>
 Cancel
 </Button>
 </div>
 </form>
 </div>
 );
}
