"use client";

import { useState } from "react";
import { StudioSaveBar } from "@/components/studio-save-bar";
import { HeadingStyleEditor } from "@/components/heading-style-editor";
import { BlockCard } from "@/components/block-card";
import { BlockToolbar } from "@/components/block-toolbar";
import { SectionBlockEditor } from "@/components/section-block-editor";
import { AccordionBlockEditor } from "@/components/accordion-block-editor";
import { SlideshowBlockEditor } from "@/components/slideshow-block-editor";
import { ProfilesBlockEditor } from "@/components/profiles-block-editor";
import { KursgruppBlockEditor } from "@/components/kursgrupp-block-editor";
import { NavGroupBlockEditor } from "@/components/nav-group-block-editor";
import { YoutubeBlockEditor } from "@/components/youtube-block-editor";
import { VideoBlockEditor } from "@/components/video-block-editor";
import { createHubBlock } from "@/lib/blocks";
import type { HubBlock } from "@/lib/blocks";

const BLOCK_LABELS: Record<HubBlock["type"], string> = {
  "course-group": "CourseGroup ✦",
  "nav-group": "NavGroup ✦",
  section: "Section",
  "accordion-section": "Accordion",
  slideshow: "Slideshow",
  profiles: "Profiles",
  youtube: "YouTube",
  video: "Video",
  instagram: "Instagram-feed",
};

type Props = {
  id: string;
  uploadPrefix: string;
  initialHeading: string;
  initialHeadingVisible: boolean;
  initialHeadingColor: string | undefined;
  initialIngress: string;
  initialBlocks: HubBlock[];
};

export function NavHubEditor({
  id,
  uploadPrefix,
  initialHeading,
  initialHeadingVisible,
  initialHeadingColor,
  initialIngress,
  initialBlocks,
}: Props) {
  const [heading, setHeading] = useState(initialHeading);
  const [headingVisible, setHeadingVisible] = useState(initialHeadingVisible);
  const [headingColor, setHeadingColor] = useState<string | undefined>(initialHeadingColor);
  const [ingress, setIngress] = useState(initialIngress);
  const [blocks, setBlocks] = useState<HubBlock[]>(initialBlocks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({ heading: initialHeading, headingVisible: initialHeadingVisible, headingColor: initialHeadingColor, ingress: initialIngress, blocks: initialBlocks }),
  );

  const isDirty =
    JSON.stringify({ heading, headingVisible, headingColor, ingress, blocks }) !== savedSnapshot;

  async function handleSaveWithBlocks(newBlocks: HubBlock[]) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/nav-hub/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heading, headingVisible, headingColor: headingColor ?? null, ingress, blocks: newBlocks }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedSnapshot(JSON.stringify({ heading, headingVisible, headingColor, ingress, blocks: newBlocks }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    await handleSaveWithBlocks(blocks);
  }

  function move(blockId: string, dir: 1 | -1) {
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx < 0) return;
    const next = [...blocks];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap]!, next[idx]!];
    setBlocks(next);
  }

  function removeBlock(blockId: string) {
    setBlocks(blocks.filter((b) => b.id !== blockId));
  }

  function updateBlock(blockId: string, patch: Partial<HubBlock>) {
    setBlocks(blocks.map((b) => (b.id === blockId ? ({ ...b, ...patch } as HubBlock) : b)));
  }

  function addBlock(type: HubBlock["type"]) {
    setBlocks([...blocks, createHubBlock(type)]);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        className="space-y-8"
      >
        <StudioSaveBar
          isDirty={isDirty}
          saving={saving}
          error={error}
          onSave={() => void handleSave()}
          onDiscard={() => {
            const snap = JSON.parse(savedSnapshot) as {
              heading: string;
              headingVisible: boolean;
              headingColor?: string;
              ingress: string;
              blocks: HubBlock[];
            };
            setHeading(snap.heading);
            setHeadingVisible(snap.headingVisible);
            setHeadingColor(snap.headingColor);
            setIngress(snap.ingress);
            setBlocks(snap.blocks);
          }}
        >
          <BlockToolbar
            types={[
              "nav-group",
              "course-group",
              "section",
              "accordion-section",
              "slideshow",
              "profiles",
              "youtube",
              "video",
            ]}
            onAdd={addBlock}
          />
        </StudioSaveBar>

        {/* Fixed fields */}
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center">
              <label className="text-sm font-medium text-gray-700">
                Page heading <span className="font-normal text-gray-600">(H1 centered)</span>
              </label>
              <div className="ml-8">
                <HeadingStyleEditor
                  color={headingColor}
                  onColorChange={setHeadingColor}
                  visible={headingVisible}
                  onVisibleChange={setHeadingVisible}
                  enabled={true}
                />
              </div>
            </div>
            <input
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm focus:border-brand-green-dark focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Intro text
            </label>
            <textarea
              value={ingress}
              onChange={(e) => setIngress(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green-dark focus:ring-1 focus:ring-brand-green-dark"
            />
          </div>
        </div>

        {/* Block list */}
        {blocks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
            <p className="text-sm text-gray-600">
              No blocks yet. Add a block above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block, idx) => (
              <BlockCard
                key={block.id}
                label={BLOCK_LABELS[block.type]}
                summary={
                  block.type === "accordion-section" ? block.summary : block.heading
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
                    onAutoSave={async (updatedBlock) => {
                      const newBlocks = blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b));
                      setBlocks(newBlocks);
                      await handleSaveWithBlocks(newBlocks);
                    }}
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
                    uploadPrefix={uploadPrefix}
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
      </form>
    </div>
  );
}
