"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ImageUpload } from "@/components/image-upload";
import { HeadingStyleEditor } from "@/components/heading-style-editor";
import { RichTextEditor } from "@/components/rich-text-editor";
import { StudioSaveBar } from "@/components/studio-save-bar";
import { Button } from "@/components/button";
import { BlockToolbar } from "@/components/block-toolbar";
import { BlockCard } from "@/components/block-card";
import { SectionBlockEditor } from "@/components/section-block-editor";
import { AccordionBlockEditor } from "@/components/accordion-block-editor";
import { SlideshowBlockEditor } from "@/components/slideshow-block-editor";
import { ProfilesBlockEditor } from "@/components/profiles-block-editor";
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

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type VenueItem = {
  name: string;
  slug: string;
  description: string;
  category: string | null;
  capacity: number | null;
  priceInfo: string | null;
  availableTo: string;
  features: string;
  imageKey: string | null;
  blocks: string;
  headingColor: string | null;
  sortOrder: number;
  published: boolean;
};

const inputClass =
  "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark";
const sectionHeading =
  "text-sm font-semibold text-gray-700 uppercase tracking-wider";
const addBtn = "text-sm font-medium text-brand-green-dark hover:underline";
const removeBtn = "text-sm text-red-500 hover:text-red-700";

export default function EditVenuePage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalSlug, setOriginalSlug] = useState("");
  const [slugExpanded, setSlugExpanded] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    capacity: "",
    priceInfo: "",
    availableTo: "organizations",
    imageKey: null as string | null,
    sortOrder: "0",
    published: false,
  });

  const [features, setFeatures] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [headingColor, setHeadingColor] = useState<string | undefined>(
    undefined,
  );

  const isDirty =
    savedSnapshot !== "" &&
    JSON.stringify({ form, features, blocks, headingColor }) !== savedSnapshot;

  useEffect(() => {
    fetch(`/api/venues/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json() as Promise<VenueItem>;
      })
      .then((data) => {
        setOriginalSlug(data.slug);
        const loadedForm = {
          name: data.name,
          slug: data.slug,
          description: data.description,
          category: data.category ?? "",
          capacity: data.capacity !== null ? String(data.capacity) : "",
          priceInfo: data.priceInfo ?? "",
          availableTo: data.availableTo,
          imageKey: data.imageKey,
          sortOrder: String(data.sortOrder),
          published: data.published,
        };
        let loadedFeatures: string[] = [];
        try {
          loadedFeatures = JSON.parse(data.features) as string[];
        } catch {
          /* empty */
        }
        let loadedBlocks: ContentBlock[] = [];
        try {
          loadedBlocks = JSON.parse(data.blocks) as ContentBlock[];
        } catch {
          /* empty */
        }
        const loadedHeadingColor = data.headingColor ?? undefined;
        setForm(loadedForm);
        setFeatures(loadedFeatures);
        setBlocks(loadedBlocks);
        setHeadingColor(loadedHeadingColor);
        setSavedSnapshot(
          JSON.stringify({
            form: loadedForm,
            features: loadedFeatures,
            blocks: loadedBlocks,
            headingColor: loadedHeadingColor,
          }),
        );
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  function handleName(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug: f.slug === slugify(f.name) ? slugify(name) : f.slug,
    }));
  }

  function doDiscard() {
    const snap = JSON.parse(savedSnapshot) as {
      form: typeof form;
      features: string[];
      blocks: ContentBlock[];
      headingColor?: string;
    };
    setForm(snap.form);
    setFeatures(snap.features);
    setBlocks(snap.blocks);
    setHeadingColor(snap.headingColor);
  }

  function moveBlock(id: string, dir: 1 | -1) {
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
    setBlocks(
      blocks.map((b) =>
        b.id === id ? ({ ...b, ...patch } as ContentBlock) : b,
      ),
    );
  }

  function addBlock(type: ContentBlock["type"]) {
    setBlocks([...blocks, createBlock(type)]);
  }

  async function doSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/venues/${originalSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category: form.category || null,
          capacity: form.capacity ? parseInt(form.capacity, 10) : null,
          priceInfo: form.priceInfo || null,
          sortOrder: parseInt(form.sortOrder, 10) || 0,
          features: features.filter(Boolean),
          blocks,
          headingColor: headingColor ?? null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSavedSnapshot(
        JSON.stringify({ form, features, blocks, headingColor }),
      );
      if (form.slug !== originalSlug) {
        router.replace(`/studio/manage-venues/${form.slug}/edit`);
        setOriginalSlug(form.slug);
      }
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
        href="/studio/manage-venues"
        className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors"
      >
        ← Manage Venues
      </Link>
      <h1 className="mt-1">Edit venue</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void doSave();
        }}
        className="mt-8 space-y-8"
      >
        <StudioSaveBar
          isDirty={isDirty}
          saving={saving}
          error={error}
          onSave={() => void doSave()}
          onDiscard={doDiscard}
        >
          <BlockToolbar
            types={[
              "section",
              "accordion-section",
              "slideshow",
              "profiles",
              "youtube",
              "video",
            ]}
            onAdd={addBlock}
            label="Detail page:"
          />
        </StudioSaveBar>

        {/* ── Name + slug ── */}
        <div>
          <div className="flex items-center gap-6">
            <label className="text-sm font-medium text-gray-700">
              Name{" "}
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
            value={form.name}
            onChange={(e) => handleName(e.target.value)}
            className={inputClass}
          />
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sm text-gray-600 truncate">
              /venues/{form.slug || "…"}
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
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className={`mt-1.5 text-sm ${inputClass}`}
            />
          )}
        </div>

        {/* ── Description ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <RichTextEditor
            value={form.description}
            onChange={(html) => setForm((f) => ({ ...f, description: html }))}
            placeholder="Describe the venue…"
          />
        </div>

        {/* ── Category + price ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              className={`bg-white ${inputClass}`}
            >
              <option value="">— Select category —</option>
              <option value="Conference Room">Conference room</option>
              <option value="Event Venue">Event venue</option>
              <option value="Sports Hall">Sports hall</option>
              <option value="Classroom">Classroom</option>
              <option value="Dining Hall">Dining hall</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price information
            </label>
            <input
              type="text"
              placeholder="e.g. 2,500 kr / half day"
              value={form.priceInfo}
              onChange={(e) =>
                setForm((f) => ({ ...f, priceInfo: e.target.value }))
              }
              className={inputClass}
            />
          </div>
        </div>

        {/* ── Meta ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Capacity (number of people)
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 80"
              value={form.capacity}
              onChange={(e) =>
                setForm((f) => ({ ...f, capacity: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sort order
            </label>
            <input
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(e) =>
                setForm((f) => ({ ...f, sortOrder: e.target.value }))
              }
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Available to
          </label>
          <select
            value={form.availableTo}
            onChange={(e) =>
              setForm((f) => ({ ...f, availableTo: e.target.value }))
            }
            className={`bg-white ${inputClass}`}
          >
            <option value="organizations">Organizations and companies</option>
            <option value="all">All (incl. private individuals)</option>
          </select>
        </div>

        {/* ── Features ── */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className={sectionHeading}>Features</span>
            <button
              type="button"
              onClick={() => setFeatures((p) => [...p, ""])}
              className={addBtn}
            >
              + Add
            </button>
          </div>
          <p className="mb-3 text-sm text-gray-600">
            {'E.g. "Stage", "Projector", "Whiteboard"'}
          </p>
          {features.length > 0 && (
            <ul className="space-y-2">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <input
                    placeholder="Feature"
                    value={f}
                    onChange={(e) =>
                      setFeatures((prev) =>
                        prev.map((v, idx) => (idx === i ? e.target.value : v)),
                      )
                    }
                    className={`flex-1 ${inputClass}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFeatures((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className={`shrink-0 ${removeBtn}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ImageUpload
          value={form.imageKey}
          onChange={(key) => setForm((f) => ({ ...f, imageKey: key }))}
          prefix="venues"
          label="Image"
        />

        {/* ── Status ── */}
        <div className="border-t border-gray-200 pt-6">
          <span className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={form.published}
            onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
            className="flex items-center gap-3"
          >
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.published ? "bg-brand-green-dark" : "bg-gray-300"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.published ? "translate-x-6" : "translate-x-1"}`}
              />
            </span>
            <span className="text-sm text-gray-700">
              {form.published ? "Published" : "Draft"}
            </span>
          </button>
        </div>

        {/* ── Detail page blocks ── */}
        <div className="border-t border-gray-200 pt-8">
          <h2 className="mb-4">Detail page content</h2>
          {blocks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
              <p className="text-sm text-gray-600">
                No blocks. Add a block above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block, idx) => (
                <BlockCard
                  key={block.id}
                  label={BLOCK_LABELS[block.type]}
                  summary={
                    block.type === "accordion-section"
                      ? block.summary
                      : block.heading
                  }
                  summaryColor={
                    block.type === "section" ? block.headingColor : undefined
                  }
                  isFirst={idx === 0}
                  isLast={idx === blocks.length - 1}
                  onMoveUp={() => moveBlock(block.id, -1)}
                  onMoveDown={() => moveBlock(block.id, 1)}
                  onDelete={() => removeBlock(block.id)}
                >
                  {block.type === "section" && (
                    <SectionBlockEditor
                      block={block}
                      onChange={(patch) => updateBlock(block.id, patch)}
                    />
                  )}
                  {block.type === "accordion-section" && (
                    <AccordionBlockEditor
                      block={block}
                      onChange={(patch) => updateBlock(block.id, patch)}
                    />
                  )}
                  {block.type === "slideshow" && (
                    <SlideshowBlockEditor
                      block={block}
                      uploadPrefix={`venues/${slug}`}
                      onChange={(patch) => updateBlock(block.id, patch)}
                    />
                  )}
                  {block.type === "profiles" && (
                    <ProfilesBlockEditor
                      block={block}
                      onChange={(patch) => updateBlock(block.id, patch)}
                    />
                  )}
                  {block.type === "youtube" && (
                    <YoutubeBlockEditor
                      block={block}
                      onChange={(patch) => updateBlock(block.id, patch)}
                    />
                  )}
                  {block.type === "video" && (
                    <VideoBlockEditor
                      block={block}
                      onChange={(patch) => updateBlock(block.id, patch)}
                    />
                  )}
                </BlockCard>
              ))}
            </div>
          )}
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
