"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StudioSaveBar } from "@/components/studio-save-bar";
import { BlockToolbar } from "@/components/block-toolbar";
import { BlockCard } from "@/components/block-card";
import { SectionBlockEditor } from "@/components/section-block-editor";
import { AccordionBlockEditor } from "@/components/accordion-block-editor";
import { SlideshowBlockEditor } from "@/components/slideshow-block-editor";
import { YoutubeBlockEditor } from "@/components/youtube-block-editor";
import { VideoBlockEditor } from "@/components/video-block-editor";
import { HeadingStyleEditor } from "@/components/heading-style-editor";
import { createBlock } from "@/lib/blocks";
import type { ContentBlock, SectionBlock, AccordionSectionBlock, SlideshowBlock, YoutubeBlock, VideoBlock } from "@/lib/blocks";

type ContactInfoBlock = {
 id: string;
 type: "contact-info";
 addressStreet: string;
 addressCity: string;
 phone: string;
 email: string;
 invoiceEmail: string;
 invoiceNote: string;
 bankgiro: string;
};

type Block = ContactInfoBlock | SectionBlock | AccordionSectionBlock | SlideshowBlock | YoutubeBlock | VideoBlock;

const BLOCK_LABELS: Record<Block["type"], string> = {
 "contact-info": "Contact details",
 section: "Section",
 "accordion-section": "Accordion",
 slideshow: "Slideshow",
 youtube: "YouTube",
 video: "Video",
};

const FIXED_TYPES: Set<Block["type"]> = new Set(["contact-info"]);

const DEFAULT_CONTACT_INFO: ContactInfoBlock = {
 id: "contact-info",
 type: "contact-info",
 addressStreet: "",
 addressCity: "",
 phone: "",
 email: "",
 invoiceEmail: "",
 invoiceNote: "",
 bankgiro: "",
};

function parseBlocks(raw: string, dbFields: Omit<ContactInfoBlock, "id" | "type">): Block[] {
 try {
 const parsed = (JSON.parse(raw) as Record<string, unknown>[]).map((block) => {
 if (block.type === "gallery" || block.type === "expandable") {
 // migrate old gallery/expandable -> slideshow
 if (block.type === "gallery") {
 const b = block as unknown as { id: string; heading: string; headingVisible: boolean; images: (string | { src: string; alt: string })[] };
 return { id: b.id, type: "slideshow" as const, heading: b.heading ?? "", headingVisible: b.headingVisible ?? false, images: (b.images ?? []).map((img) => typeof img === "string" ? { src: img, alt: "" } : { src: img.src, alt: img.alt ?? "" }) };
 }
 const b = block as unknown as { id: string; heading: string; headingVisible: boolean; image: string; alt: string };
 return { id: b.id, type: "slideshow" as const, heading: b.heading ?? "", headingVisible: b.headingVisible ?? false, images: b.image ? [{ src: b.image, alt: b.alt ?? "" }] : [] };
 }
 return block as unknown as Block;
 });

 // Ensure contact-info block is always present and up to date with DB fields
 const hasContactInfo = parsed.some((b) => b.type === "contact-info");
 const contactBlock: ContactInfoBlock = { id: "contact-info", type: "contact-info", ...dbFields };
 if (hasContactInfo) {
 return parsed.map((b) => b.type === "contact-info" ? contactBlock : b);
 }
 return [contactBlock, ...parsed];
 } catch {
 return [{ id: "contact-info", type: "contact-info", ...dbFields }];
 }
}

function Field({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
 return (
 <div>
 <label className="block text-sm font-medium text-gray-700">{label}</label>
 {hint && <p className="mt-0.5 mb-1 text-sm text-gray-600">{hint}</p>}
 <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
 className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green-dark focus:outline-none" />
 </div>
 );
}

type ApiResponse = {
 blocks: string;
 addressStreet: string; addressCity: string; phone: string;
 email: string; invoiceEmail: string; invoiceNote: string; bankgiro: string;
 heading: string; headingVisible: boolean; headingColor?: string;
};

export default function StudioKontaktPage() {
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [blocks, setBlocks] = useState<Block[]>([]);
 const [heading, setHeading] = useState("");
 const [headingVisible, setHeadingVisible] = useState(true);
 const [headingColor, setHeadingColor] = useState<string | undefined>(undefined);
 const [savedSnapshot, setSavedSnapshot] = useState("");

 const isDirty = savedSnapshot !== "" && JSON.stringify({ blocks, heading, headingVisible, headingColor }) !== savedSnapshot;

 useEffect(() => {
 fetch("/api/contact/content")
 .then((r) => r.json() as Promise<ApiResponse>)
 .then((d) => {
 const dbFields = {
 addressStreet: d.addressStreet, addressCity: d.addressCity,
 phone: d.phone, email: d.email, invoiceEmail: d.invoiceEmail,
 invoiceNote: d.invoiceNote, bankgiro: d.bankgiro,
 };
 const parsed = parseBlocks(d.blocks ?? "[]", dbFields);
 const h = d.heading ?? "";
 const hv = d.headingVisible ?? true;
 const hc = d.headingColor;
 setBlocks(parsed);
 setHeading(h);
 setHeadingVisible(hv);
 setHeadingColor(hc);
 setSavedSnapshot(JSON.stringify({ blocks: parsed, heading: h, headingVisible: hv, headingColor: hc }));
 })
 .catch(() => setError("Could not load content."))
 .finally(() => setLoading(false));
 }, []);

 function move(id: string, dir: 1 | -1) {
 const idx = blocks.findIndex((b) => b.id === id);
 if (idx < 0) return;
 const next = [...blocks];
 const swap = idx + dir;
 if (swap < 0 || swap >= next.length) return;
 [next[idx], next[swap]] = [next[swap]!, next[idx]!];
 setBlocks(next);
 }

 function removeBlock(id: string) { setBlocks(blocks.filter((b) => b.id !== id)); }

 function updateBlock(id: string, patch: Partial<Block>) {
 setBlocks(blocks.map((b) => b.id === id ? { ...b, ...patch } as Block : b));
 }

 function addBlock(type: Exclude<Block["type"], "contact-info">) {
 setBlocks([...blocks, createBlock(type as ContentBlock["type"]) as Block]);
 }

 function doDiscard() {
 const snap = JSON.parse(savedSnapshot) as { blocks: Block[]; heading: string; headingVisible: boolean; headingColor?: string };
 setBlocks(snap.blocks); setHeading(snap.heading); setHeadingVisible(snap.headingVisible); setHeadingColor(snap.headingColor);
 }

 async function doSave() {
 setSaving(true);
 setError(null);
 try {
 const contactBlock = blocks.find((b): b is ContactInfoBlock => b.type === "contact-info") ?? DEFAULT_CONTACT_INFO;
 const { addressStreet, addressCity, phone, email, invoiceEmail, invoiceNote, bankgiro } = contactBlock;
 const res = await fetch("/api/contact/content", {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 addressStreet, addressCity, phone, email, invoiceEmail, invoiceNote, bankgiro,
 blocks: JSON.stringify(blocks),
 heading, headingVisible, headingColor,
 }),
 });
 if (!res.ok) throw new Error(await res.text());
 setSavedSnapshot(JSON.stringify({ blocks, heading, headingVisible, headingColor }));
 } catch (err) {
 setError(err instanceof Error ? err.message : "Something went wrong.");
 } finally {
 setSaving(false);
 }
 }

 if (loading) return <div className="mx-auto max-w-7xl px-4 py-12 text-gray-600">Loading…</div>;

 return (
 <div className="mx-auto max-w-7xl px-4 py-12">
 <Link href="/studio" className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors">
 ← Studio
 </Link>
 <h1 className="mt-1">Contact page</h1>

 <form onSubmit={(e) => { e.preventDefault(); void doSave(); }} className="mt-8 space-y-6">
 <StudioSaveBar isDirty={isDirty} saving={saving} error={error} onSave={doSave} onDiscard={doDiscard}>
 <BlockToolbar types={["section", "accordion-section", "slideshow", "youtube", "video"]} onAdd={addBlock} />
 </StudioSaveBar>

 <div className="space-y-1">
 <label className="text-sm font-medium text-gray-700">Page heading <span className="font-normal text-gray-600">(centered H1)</span></label>
 <HeadingStyleEditor color={headingColor} onColorChange={setHeadingColor} visible={headingVisible} onVisibleChange={setHeadingVisible} enabled={true} />
 <input type="text" value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="Page H1 heading" className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm focus:border-brand-green-dark focus:bg-white focus:outline-none" />
 </div>

 <div className="space-y-2">
 <p className="text-sm text-gray-600">The contact details block is fixed and can&apos;t be removed. Other blocks can be added and reordered freely.</p>
 <div className="space-y-3">
 {blocks.map((block, idx) => (
 <BlockCard key={block.id} label={BLOCK_LABELS[block.type]}
 isFirst={idx === 0} isLast={idx === blocks.length - 1}
 onMoveUp={() => move(block.id, -1)} onMoveDown={() => move(block.id, 1)}
 onDelete={FIXED_TYPES.has(block.type) ? undefined : () => removeBlock(block.id)}
              summary={block.type === "accordion-section" ? block.summary : ("heading" in block ? block.heading : "")}
              summaryColor={"headingColor" in block ? (block as {headingColor?: string}).headingColor : undefined}
 >
 {block.type === "contact-info" && (
 <div className="space-y-4">
 <fieldset className="space-y-3">
 <legend className="text-sm font-semibold uppercase tracking-wide text-gray-600">Address</legend>
 <Field label="Street address" value={block.addressStreet} onChange={(v) => updateBlock(block.id, { addressStreet: v })} />
 <Field label="Postal code and city" value={block.addressCity} onChange={(v) => updateBlock(block.id, { addressCity: v })} />
 </fieldset>
 <fieldset className="space-y-3">
 <legend className="text-sm font-semibold uppercase tracking-wide text-gray-600">Contact details</legend>
 <Field label="Phone" value={block.phone} onChange={(v) => updateBlock(block.id, { phone: v })} />
 <Field label="Email (office)" value={block.email} onChange={(v) => updateBlock(block.id, { email: v })} />
 <Field label="Invoice email" value={block.invoiceEmail} onChange={(v) => updateBlock(block.id, { invoiceEmail: v })} />
 <Field label="Invoice note" hint='E.g. "Please send the invoice as a PDF."'
 value={block.invoiceNote} onChange={(v) => updateBlock(block.id, { invoiceNote: v })} />
 <Field label="Bankgiro" value={block.bankgiro} onChange={(v) => updateBlock(block.id, { bankgiro: v })} />
 </fieldset>
 </div>
 )}
 {block.type === "section" && (
 <SectionBlockEditor block={block} onChange={(patch) => updateBlock(block.id, patch)} />
 )}
 {block.type === "accordion-section" && (
 <AccordionBlockEditor block={block} onChange={(patch) => updateBlock(block.id, patch)} />
 )}
 {block.type === "slideshow" && (
 <SlideshowBlockEditor block={block} uploadPrefix="kontakt" onChange={(patch) => updateBlock(block.id, patch)} />
 )}
 {block.type === "youtube" && (
 <YoutubeBlockEditor block={block} onChange={(patch) => updateBlock(block.id, patch)} />
 )}
 {block.type === "video" && (
 <VideoBlockEditor block={block} onChange={(patch) => updateBlock(block.id, patch)} />
 )}
 </BlockCard>
 ))}

 <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4">
 <div className="flex items-center justify-between">
 <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-sm font-semibold text-gray-600">
 Staff
 </span>
 <Link href="/studio/profiles" className="text-sm font-medium text-gray-600 underline-offset-2 hover:text-brand-green-dark hover:underline transition-colors">
 Edit in Profiles →
 </Link>
 </div>
 <p className="mt-2 text-sm text-gray-600">
 The staff listing is fetched automatically from departments and profiles, and always appears last on the page.
 </p>
 </div>
 </div>
 </div>
 </form>
 </div>
 );
}
