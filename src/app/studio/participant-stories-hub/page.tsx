"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StudioSaveBar } from "@/components/studio-save-bar";
import { BlockToolbar } from "@/components/block-toolbar";
import { BlockCard } from "@/components/block-card";
import { SectionBlockEditor } from "@/components/section-block-editor";
import { AccordionBlockEditor } from "@/components/accordion-block-editor";
import { SlideshowBlockEditor } from "@/components/slideshow-block-editor";
import { KursgruppBlockEditor } from "@/components/kursgrupp-block-editor";
import { NavGroupBlockEditor } from "@/components/nav-group-block-editor";
import { YoutubeBlockEditor } from "@/components/youtube-block-editor";
import { VideoBlockEditor } from "@/components/video-block-editor";
import { HeadingStyleEditor } from "@/components/heading-style-editor";
import { createHubBlock } from "@/lib/blocks";
import type { HubBlock } from "@/lib/blocks";
import { parseHubBlocks } from "@/lib/parse-blocks";

const BLOCK_LABELS: Record<HubBlock["type"], string> = {
  "nav-group": "NavGroup ✦",
  "course-group": "CourseGroup ✦",
  section: "Section",
  "accordion-section": "Accordion",
  slideshow: "Slideshow",
  profiles: "Profiles",
  youtube: "YouTube",
  video: "Video",
  instagram: "Instagram-feed",
};

export default function StudioDeltagerberatelserPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<HubBlock[]>([]);
  const [heading, setHeading] = useState("");
  const [headingVisible, setHeadingVisible] = useState(true);
  const [headingColor, setHeadingColor] = useState<string | undefined>(
    undefined,
  );
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const isDirty =
    savedSnapshot !== "" &&
    JSON.stringify({ blocks, heading, headingVisible, headingColor }) !==
      savedSnapshot;

  useEffect(() => {
    fetch("/api/participant-stories-hub/content")
      .then(
        (r) =>
          r.json() as Promise<{
            blocks: string;
            heading: string;
            headingVisible: boolean;
            headingColor?: string;
          }>,
      )
      .then((d) => {
        const parsed = parseHubBlocks(d.blocks ?? "[]");
        const h = d.heading ?? "";
        const hv = d.headingVisible ?? true;
        const hc = d.headingColor;
        setBlocks(parsed);
        setHeading(h);
        setHeadingVisible(hv);
        setHeadingColor(hc);
        setSavedSnapshot(
          JSON.stringify({
            blocks: parsed,
            heading: h,
            headingVisible: hv,
            headingColor: hc,
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

  function updateBlock(id: string, patch: Partial<HubBlock>) {
    setBlocks(
      blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as HubBlock) : b)),
    );
  }

  function addBlock(type: HubBlock["type"]) {
    setBlocks([...blocks, createHubBlock(type)]);
  }

  function doDiscard() {
    const snap = JSON.parse(savedSnapshot) as {
      blocks: HubBlock[];
      heading: string;
      headingVisible: boolean;
      headingColor?: string;
    };
    setBlocks(snap.blocks);
    setHeading(snap.heading);
    setHeadingVisible(snap.headingVisible);
    setHeadingColor(snap.headingColor);
  }

  async function doSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/participant-stories-hub/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: JSON.stringify(blocks),
          heading,
          headingVisible,
          headingColor,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSavedSnapshot(
        JSON.stringify({ blocks, heading, headingVisible, headingColor }),
      );
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
      <h1 className="mt-1">Participant Stories — hub page</h1>

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
              "nav-group",
              "course-group",
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
          {blocks.length === 0 && (
            <p className="text-sm text-gray-600">
              No blocks yet. Add a block above to add content above the
              stories list.
            </p>
          )}
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
              onMoveUp={() => move(block.id, -1)}
              onMoveDown={() => move(block.id, 1)}
              onDelete={() => removeBlock(block.id)}
            >
              {block.type === "nav-group" && (
                <NavGroupBlockEditor
                  block={block}
                  onChange={(patch) => updateBlock(block.id, patch)}
                />
              )}
              {block.type === "course-group" && (
                <KursgruppBlockEditor
                  block={block}
                  onChange={(patch) => updateBlock(block.id, patch)}
                />
              )}
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
                  uploadPrefix="deltagarberattelser"
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
      </form>
    </div>
  );
}
