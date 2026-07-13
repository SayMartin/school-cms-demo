"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { StudioSaveBar } from "@/components/studio-save-bar";
import { HeadingStyleEditor } from "@/components/heading-style-editor";
import { RichTextEditor } from "@/components/rich-text-editor";
import { SlideshowBlockEditor } from "@/components/slideshow-block-editor";
import type { TimelineEntry } from "@/lib/historia-timeline";
import { parseTimeline } from "@/lib/historia-timeline";
import type { SlideshowBlock } from "@/lib/blocks";

function toSlideshowBlock(entry: TimelineEntry): SlideshowBlock {
  return {
    type: "slideshow",
    id: entry.id,
    heading: "",
    headingVisible: false,
    images: entry.images,
  };
}

export default function StudioHistoriaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [heading, setHeading] = useState("");
  const [headingVisible, setHeadingVisible] = useState(true);
  const [headingColor, setHeadingColor] = useState<string | undefined>(undefined);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const isDirty =
    savedSnapshot !== "" &&
    JSON.stringify({ entries, heading, headingVisible, headingColor }) !== savedSnapshot;

  useEffect(() => {
    fetch("/api/history/content")
      .then((r) => r.json() as Promise<{
        timeline: string;
        heading: string;
        headingVisible: boolean;
        headingColor?: string;
      }>)
      .then((d) => {
        const parsed = parseTimeline(d.timeline ?? "[]");
        const h = d.heading ?? "";
        const hv = d.headingVisible ?? true;
        const hc = d.headingColor;
        setEntries(parsed);
        setHeading(h);
        setHeadingVisible(hv);
        setHeadingColor(hc);
        setSavedSnapshot(JSON.stringify({ entries: parsed, heading: h, headingVisible: hv, headingColor: hc }));
      })
      .catch(() => setError("Could not load content."))
      .finally(() => setLoading(false));
  }, []);

  function removeEntry(id: string) {
    setEntries(entries.filter((e) => e.id !== id));
    if (openId === id) setOpenId(null);
  }

  function updateEntry(id: string, patch: Partial<TimelineEntry>) {
    setEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function addEntry() {
    const newEntry: TimelineEntry = {
      id: crypto.randomUUID(),
      year: new Date().getFullYear(),
      text: "",
      images: [],
    };
    setEntries([newEntry, ...entries]);
    setOpenId(newEntry.id);
  }

  function doDiscard() {
    const snap = JSON.parse(savedSnapshot) as {
      entries: TimelineEntry[];
      heading: string;
      headingVisible: boolean;
      headingColor?: string;
    };
    setEntries(snap.entries);
    setHeading(snap.heading);
    setHeadingVisible(snap.headingVisible);
    setHeadingColor(snap.headingColor);
  }

  async function doSave() {
    setSaving(true);
    setError(null);
    const sorted = [...entries].sort((a, b) => a.year - b.year);
    setEntries(sorted);
    try {
      const res = await fetch("/api/history/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeline: JSON.stringify(sorted),
          heading,
          headingVisible,
          headingColor,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSavedSnapshot(JSON.stringify({ entries, heading, headingVisible, headingColor }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <div className="mx-auto max-w-7xl px-4 py-12 text-gray-600">Loading…</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Link
        href="/studio"
        className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors"
      >
        ← Studio
      </Link>
      <h1 className="mt-1">History — Timeline</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); void doSave(); }}
        className="mt-8 space-y-6"
      >
        <StudioSaveBar
          isDirty={isDirty}
          saving={saving}
          error={error}
          onSave={doSave}
          onDiscard={doDiscard}
        >
          <button
            type="button"
            onClick={addEntry}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Add entry
          </button>
        </StudioSaveBar>

        {/* Heading */}
        <div className="space-y-1">
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700">
              Page heading{" "}
              <span className="font-normal text-gray-600">(centered H1)</span>
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
            placeholder="Page H1 heading"
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm focus:border-brand-green-dark focus:bg-white focus:outline-none"
          />
        </div>

        {/* Timeline entries */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">
            Timeline entries{" "}
            <span className="font-normal text-gray-600">({entries.length})</span>
          </p>

          {entries.map((entry) => {
            const isOpen = openId === entry.id;
            const textPreview = entry.text.replace(/<[^>]+>/g, "").slice(0, 80);
            return (
              <div
                key={entry.id}
                className="rounded-lg border border-gray-200 bg-white"
              >
                {/* Header row */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : entry.id)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-gray-600 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                    <span className="shrink-0 font-semibold tabular-nums text-gray-800 w-12">
                      {entry.year}
                    </span>
                    {!isOpen && textPreview && (
                      <span className="truncate text-sm text-gray-600">{textPreview}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="rounded p-1 text-red-400 hover:bg-red-50"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>

                {/* Expanded editor */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                    {/* Year input */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-600">Year</label>
                      <input
                        type="number"
                        value={entry.year}
                        onChange={(e) => updateEntry(entry.id, { year: Number(e.target.value) })}
                        className="w-28 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-green-dark focus:outline-none"
                      />
                    </div>

                    {/* Text editor */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-600">Text</label>
                      <RichTextEditor
                        value={entry.text}
                        onChange={(val) => updateEntry(entry.id, { text: val })}
                      />
                    </div>

                    {/* Slideshow */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-600">
                        Slideshow (optional — shown next to the text)
                      </label>
                      <SlideshowBlockEditor
                        block={toSlideshowBlock(entry)}
                        uploadPrefix="historia"
                        showHeading={false}
                        onChange={(patch) => {
                          if (patch.images !== undefined) {
                            updateEntry(entry.id, { images: patch.images });
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {entries.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-600">
              No entries yet. Click &quot;+ Add entry&quot; above.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
