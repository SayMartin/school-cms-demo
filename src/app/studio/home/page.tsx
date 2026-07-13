"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StudioSaveBar } from "@/components/studio-save-bar";
import { Button } from "@/components/button";
import { BlockCard } from "@/components/block-card";
import { SectionBlockEditor } from "@/components/section-block-editor";
import { AccordionBlockEditor } from "@/components/accordion-block-editor";
import { SlideshowBlockEditor } from "@/components/slideshow-block-editor";
import { ProfilesBlockEditor } from "@/components/profiles-block-editor";
import { KursgruppBlockEditor } from "@/components/kursgrupp-block-editor";
import { NavGroupBlockEditor } from "@/components/nav-group-block-editor";
import { BlockToolbar } from "@/components/block-toolbar";
import { YoutubeBlockEditor } from "@/components/youtube-block-editor";
import { VideoBlockEditor } from "@/components/video-block-editor";
import { createHubBlock } from "@/lib/blocks";
import type { HubBlock } from "@/lib/blocks";
import { HeadingStyleEditor } from "@/components/heading-style-editor";

const BLOCK_LABELS: Record<HubBlock["type"], string> = {
  "course-group": "Course Group ✦",
  "nav-group": "Nav Group ✦",
  section: "Section",
  "accordion-section": "Accordion",
  slideshow: "Slideshow",
  profiles: "Profiles",
  youtube: "YouTube",
  video: "Video",
  instagram: "Instagram Feed",
};

type HomeData = {
  heading: string;
  headingVisible: number;
  headingColor: string | null;
  heroIngress: string;
  whyUsText: string;
  whyUsHeading: string;
  whyUsHeadingVisible: number;
  blocks: string;
};

function seedBlocks(data: HomeData): HubBlock[] {
  try {
    const parsed = JSON.parse(data.blocks) as HubBlock[];
    if (parsed.length > 0) return parsed;
  } catch {
    /* fall through */
  }
  return [
    {
      id: crypto.randomUUID(),
      type: "section",
      heading: "",
      headingVisible: false,
      body: data.whyUsText ?? "",
    },
  ];
}

export default function StudioHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<HubBlock[]>([]);
  const [savedBlocksSnapshot, setSavedBlocksSnapshot] = useState("");
  const [whyUsText, setWhyUsText] = useState("");
  const [savedWhyUsText, setSavedWhyUsText] = useState("");
  const [heading, setHeading] = useState("");
  const [headingVisible, setHeadingVisible] = useState(false);
  const [headingColor, setHeadingColor] = useState<string | undefined>(
    undefined,
  );
  const [savedHeading, setSavedHeading] = useState("");
  const [savedHeadingVisible, setSavedHeadingVisible] = useState(false);
  const [savedHeadingColor, setSavedHeadingColor] = useState<
    string | undefined
  >(undefined);
  const [whyUsHeading, setWhyUsHeading] = useState("Why Us?");
  const [whyUsHeadingVisible, setWhyUsHeadingVisible] =
    useState(true);
  const [savedWhyUsHeading, setSavedWhyUsHeading] =
    useState("Why Us?");
  const [savedWhyUsHeadingVisible, setSavedWhyUsHeadingVisible] =
    useState(true);

  const isDirty =
    savedBlocksSnapshot !== "" &&
    (JSON.stringify(blocks) !== savedBlocksSnapshot ||
      heading !== savedHeading ||
      headingVisible !== savedHeadingVisible ||
      headingColor !== savedHeadingColor ||
      whyUsText !== savedWhyUsText ||
      whyUsHeading !== savedWhyUsHeading ||
      whyUsHeadingVisible !== savedWhyUsHeadingVisible);

  useEffect(() => {
    fetch("/api/home/content")
      .then((r) => r.json() as Promise<HomeData>)
      .then((d) => {
        const seeded = seedBlocks(d);
        setBlocks(seeded);
        setSavedBlocksSnapshot(JSON.stringify(seeded));
        setWhyUsText(d.whyUsText ?? "");
        setSavedWhyUsText(d.whyUsText ?? "");
        setHeading(d.heading ?? "");
        setSavedHeading(d.heading ?? "");
        setHeadingVisible((d.headingVisible ?? 0) === 1);
        setSavedHeadingVisible((d.headingVisible ?? 0) === 1);
        setHeadingColor(d.headingColor ?? undefined);
        setSavedHeadingColor(d.headingColor ?? undefined);
        setWhyUsHeading(d.whyUsHeading ?? "Why Us?");
        setSavedWhyUsHeading(d.whyUsHeading ?? "Why Us?");
        setWhyUsHeadingVisible((d.whyUsHeadingVisible ?? 1) === 1);
        setSavedWhyUsHeadingVisible(
          (d.whyUsHeadingVisible ?? 1) === 1,
        );
      })
      .catch(() => setError("Could not load content."))
      .finally(() => setLoading(false));
  }, []);

  function doDiscard() {
    setBlocks(JSON.parse(savedBlocksSnapshot) as HubBlock[]);
    setHeading(savedHeading);
    setHeadingVisible(savedHeadingVisible);
    setHeadingColor(savedHeadingColor);
    setWhyUsText(savedWhyUsText);
    setWhyUsHeading(savedWhyUsHeading);
    setWhyUsHeadingVisible(savedWhyUsHeadingVisible);
  }

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

  async function doSaveWithBlocks(newBlocks: HubBlock[]) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/home/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: JSON.stringify(newBlocks),
          heading,
          headingVisible: headingVisible ? 1 : 0,
          headingColor: headingColor ?? null,
          whyUsText,
          whyUsHeading,
          whyUsHeadingVisible: whyUsHeadingVisible ? 1 : 0,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSavedBlocksSnapshot(JSON.stringify(newBlocks));
      setSavedWhyUsText(whyUsText);
      setSavedHeading(heading);
      setSavedHeadingVisible(headingVisible);
      setSavedHeadingColor(headingColor);
      setSavedWhyUsHeading(whyUsHeading);
      setSavedWhyUsHeadingVisible(whyUsHeadingVisible);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function doSave() {
    await doSaveWithBlocks(blocks);
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
      <h1 className="mt-1">Home Page</h1>

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
          onSave={() => void doSave()}
          onDiscard={doDiscard}
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

        {/* ── Page heading ── */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Page heading
              <span className="font-normal text-gray-600">(H1 centered)</span>
            </label>
            <HeadingStyleEditor
              color={headingColor}
              onColorChange={setHeadingColor}
              visible={headingVisible}
              onVisibleChange={setHeadingVisible}
              enabled={true}
            />
          </div>
          <input
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="e.g. Welcome to our school"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
          />
        </div>

        <div>
          {blocks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
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
                      onAutoSave={async (updatedBlock) => {
                        const newBlocks = blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b));
                        setBlocks(newBlocks);
                        await doSaveWithBlocks(newBlocks);
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
                      uploadPrefix="home"
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

        <fieldset className="space-y-3 border-t border-gray-200 pt-8">
          <legend className="text-base font-semibold text-gray-900">
            Why Us?{" "}
            <span className="text-sm font-normal text-gray-600">
              — yellow section, always at the bottom of the home page
            </span>
          </legend>
          <SectionBlockEditor
            block={{
              id: "why-us",
              type: "section",
              heading: whyUsHeading,
              headingVisible: whyUsHeadingVisible,
              body: whyUsText,
            }}
            onChange={(patch) => {
              if (patch.heading !== undefined)
                setWhyUsHeading(patch.heading);
              if (patch.headingVisible !== undefined)
                setWhyUsHeadingVisible(patch.headingVisible);
              if (patch.body !== undefined) setWhyUsText(patch.body);
            }}
          />
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
