"use client";

import { useEffect, useState, useMemo } from "react";
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

type OmSkolanData = {
  blocks: string;
  heading: string;
  headingVisible: boolean;
  headingColor?: string;
  boardHeading: string;
  boardIntro: string;
};

export default function StudioOmSkolanPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [heading, setHeading] = useState("");
  const [headingVisible, setHeadingVisible] = useState(true);
  const [headingColor, setHeadingColor] = useState<string | undefined>(
    undefined,
  );
  const [boardHeading, setBoardHeading] = useState("");
  const [boardIntro, setBoardIntro] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        blocks,
        heading,
        headingVisible,
        headingColor,
        boardHeading,
        boardIntro,
      }),
    [
      blocks,
      heading,
      headingVisible,
      headingColor,
      boardHeading,
      boardIntro,
    ],
  );
  const isDirty = savedSnapshot !== "" && currentSnapshot !== savedSnapshot;

  useEffect(() => {
    fetch("/api/about/content")
      .then((r) => r.json() as Promise<OmSkolanData>)
      .then((d) => {
        const parsed = parseContentBlocks(d.blocks ?? "[]");
        const h = d.heading ?? "";
        const hv = d.headingVisible ?? true;
        const hc = d.headingColor;
        const sh = d.boardHeading ?? "";
        const si = d.boardIntro ?? "";
        setBlocks(parsed);
        setHeading(h);
        setHeadingVisible(hv);
        setHeadingColor(hc);
        setBoardHeading(sh);
        setBoardIntro(si);
        setSavedSnapshot(
          JSON.stringify({
            blocks: parsed,
            heading: h,
            headingVisible: hv,
            headingColor: hc,
            boardHeading: sh,
            boardIntro: si,
          }),
        );
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

  function doDiscard() {
    const snap = JSON.parse(savedSnapshot) as {
      blocks: ContentBlock[];
      heading: string;
      headingVisible: boolean;
      headingColor?: string;
      boardHeading: string;
      boardIntro: string;
    };
    setBlocks(snap.blocks);
    setHeading(snap.heading);
    setHeadingVisible(snap.headingVisible);
    setHeadingColor(snap.headingColor);
    setBoardHeading(snap.boardHeading);
    setBoardIntro(snap.boardIntro);
  }

  async function doSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/about/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: JSON.stringify(blocks),
          heading,
          headingVisible,
          headingColor,
          boardHeading,
          boardIntro,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSavedSnapshot(currentSnapshot);
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
        href="/studio"
        className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors"
      >
        ← Studio
      </Link>
      <h1 className="mt-1">The Association</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void doSave();
        }}
        className="mt-8 space-y-12"
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

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Page heading{" "}
            <span className="font-normal text-gray-600">(H1 centered)</span>
          </label>
          <HeadingStyleEditor
            color={headingColor}
            onColorChange={setHeadingColor}
            visible={headingVisible}
            onVisibleChange={setHeadingVisible}
            enabled={true}
          />
          <input
            type="text"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="Page H1 heading"
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm focus:border-brand-green-dark focus:bg-white focus:outline-none"
          />
        </div>

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
                  uploadPrefix="om-skolan"
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

        {/* Board section */}
        <fieldset className="space-y-3 border-t border-gray-200 pt-8">
          <legend className="text-base font-semibold text-gray-900">
            Board section
          </legend>
          <p className="text-sm text-gray-600">
            Board members are managed via Studio → Profiles (department
            &ldquo;Board&rdquo;).
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Heading
            </label>
            <input
              type="text"
              value={boardHeading}
              onChange={(e) => setBoardHeading(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green-dark focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Intro
            </label>
            <input
              type="text"
              value={boardIntro}
              onChange={(e) => setBoardIntro(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green-dark focus:outline-none"
            />
          </div>
        </fieldset>
      </form>
    </div>
  );
}
