"use client";

import { useEffect, useRef, useState } from "react";
import { BrandColorPicker } from "@/components/brand-color-picker";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ImageUpload } from "@/components/image-upload";
import { HeadingStyleEditor } from "@/components/heading-style-editor";
import { BallStyleEditor } from "@/components/ball-style-editor";
import { mediaUrl } from "@/lib/r2/client";
import { getColorHex } from "@/lib/brand-colors";
import type { LinkCandidate } from "@/app/api/link-candidates/route";
import type { NavGroupBlock, NavGruppItem } from "@/lib/blocks";

type Props = {
  block: NavGroupBlock;
  onChange: (patch: Partial<NavGroupBlock>) => void;
  uploadPrefix?: string;
};

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green-dark focus:outline-none";

function LinkPicker({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (href: string) => void;
}) {
  const [candidates, setCandidates] = useState<LinkCandidate[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/link-candidates")
      .then((r) => {
        if (!r.ok) throw new Error("unauthorized");
        return r.json() as Promise<LinkCandidate[]>;
      })
      .then(setCandidates)
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = candidates.filter((c) =>
    search
      ? c.label.toLowerCase().includes(search.toLowerCase()) ||
        c.href.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const groups = Array.from(new Set(filtered.map((c) => c.group)));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loadError}
        className="mt-1 text-sm text-brand-green-dark hover:underline disabled:cursor-not-allowed disabled:text-gray-600 disabled:no-underline"
      >
        {loadError ? "Could not load pages" : open ? "Close" : "Browse pages…"}
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-80 max-w-[90vw] rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <input
            type="search"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages, courses, venues…"
            className={inputClass}
          />
          <div className="mt-2 max-h-64 overflow-y-auto">
            {candidates.length === 0 && !loadError && (
              <p className="px-2 py-2 text-sm text-gray-600">Loading…</p>
            )}
            {filtered.length === 0 && candidates.length > 0 && (
              <p className="px-2 py-2 text-sm text-gray-600">No matches.</p>
            )}
            {groups.map((group) => (
              <div key={group} className="mb-1">
                <p className="px-2 py-1 text-sm font-semibold uppercase tracking-wide text-gray-600">
                  {group}
                </p>
                {filtered
                  .filter((c) => c.group === group)
                  .map((c) => (
                    <button
                      key={c.href}
                      type="button"
                      onClick={() => {
                        onSelect(c.href);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`block w-full truncate rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50 ${
                        value === c.href ? "bg-brand-green-light text-brand-green-dark" : "text-gray-800"
                      }`}
                    >
                      <span className="block truncate font-medium">{c.label}</span>
                      <span className="block truncate text-gray-600">{c.href}</span>
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function NavGroupBlockEditor({
  block,
  onChange,
  uploadPrefix = "navgrupp",
}: Props) {
  const items = block.items;

  function updateItem(id: string, patch: Partial<NavGruppItem>) {
    onChange({
      items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
  }

  function removeItem(id: string) {
    onChange({ items: items.filter((i) => i.id !== id) });
  }

  function addItem() {
    onChange({
      items: [
        ...items,
        { id: crypto.randomUUID(), name: "", href: "", ballType: "color" },
      ],
    });
  }

  function move(id: string, dir: 1 | -1) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const next = [...items];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap]!, next[idx]!];
    onChange({ items: next });
  }

  return (
    <div className="space-y-4">
      {/* ── Group heading ─────────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Group heading <span className="font-normal text-gray-600">(H2)</span>
        </label>
        <HeadingStyleEditor
          color={block.headingColor}
          onColorChange={(c) => onChange({ headingColor: c })}
          visible={block.headingVisible}
          onVisibleChange={(v) => onChange({ headingVisible: v })}
          enabled={true}
        />
        <input
          value={block.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
          placeholder="e.g. Our Short Courses"
          className={inputClass}
        />
      </div>

      {/* ── Balls ──────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {items.map((item, idx) => {
          const effectiveBallType: "image" | "color" =
            item.ballType ?? (item.imageKey ? "image" : "color");

          return (
            <div
              key={item.id}
              className="rounded-md border border-gray-200 bg-white"
            >
              {/* Header row */}
              <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
                <span className="flex-1 truncate text-sm font-medium text-gray-700">
                  {item.name || (
                    <span className="text-gray-600 font-normal italic">
                      New ball
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => move(item.id, -1)}
                    className="rounded px-1.5 py-0.5 text-gray-600 hover:text-gray-700 disabled:opacity-30 transition-colors"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => move(item.id, 1)}
                    className="rounded px-1.5 py-0.5 text-gray-600 hover:text-gray-700 disabled:opacity-30 transition-colors"
                  >
                    ▼
                  </button>
                  <ConfirmDeleteButton onConfirm={() => removeItem(item.id)} locked={false} />
                </div>
              </div>

              {/* Fields */}
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 shrink-0">
                      Name <span className="text-red-500">*</span>{" "}
                      <span className="font-normal text-gray-600">(H3)</span>
                    </label>
                    <HeadingStyleEditor
                      color={item.nameColor}
                      onColorChange={(c) =>
                        updateItem(item.id, { nameColor: c })
                      }
                      visible={true}
                      onVisibleChange={() => {}}
                    />
                    <input
                      value={item.name}
                      onChange={(e) =>
                        updateItem(item.id, { name: e.target.value })
                      }
                      placeholder="e.g. Summer courses"
                      className={`${inputClass} ${!item.name ? "border-amber-300 focus:border-amber-400" : ""}`}
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Link <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={item.href}
                      onChange={(e) =>
                        updateItem(item.id, { href: e.target.value })
                      }
                      placeholder="/summer-courses"
                      className={`${inputClass} ${!item.href ? "border-amber-300 focus:border-amber-400" : ""}`}
                    />
                    <LinkPicker
                      value={item.href}
                      onSelect={(href) => updateItem(item.id, { href })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intro{" "}
                    <span className="text-gray-700 font-normal">
                      (optional, shown inside the ball)
                    </span>
                  </label>
                  <input
                    value={item.ingress ?? ""}
                    onChange={(e) =>
                      updateItem(item.id, {
                        ingress: e.target.value || undefined,
                      })
                    }
                    placeholder="Short description…"
                    className={inputClass}
                  />
                </div>

                {/* ── Ball type toggle + image picker ─────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Choose ball type
                    </p>
                    <BallStyleEditor
                      value={effectiveBallType}
                      onChange={(v) =>
                        updateItem(
                          item.id,
                          v === "color"
                            ? { ballType: "color", imageKey: undefined }
                            : { ballType: "image" },
                        )
                      }
                      colorHex={getColorHex(item.color ?? "brand-pergament")}
                      imageSrc={
                        item.imageKey ? mediaUrl(item.imageKey) : undefined
                      }
                    />
                  </div>
                  <div>
                    <ImageUpload
                      value={item.imageKey ?? null}
                      onChange={(key) =>
                        updateItem(item.id, { imageKey: key ?? undefined })
                      }
                      prefix={uploadPrefix}
                      label="Image"
                      required
                      srcResolver={mediaUrl}
                      enabled={effectiveBallType === "image"}
                    />
                  </div>
                </div>

                {/* ── Color ──────────────────────────────────────────── */}
                <div>
                  <BrandColorPicker
                    value={item.color ?? "brand-purple"}
                    onChange={(token) => updateItem(item.id, { color: token })}
                    defaultToken="brand-purple"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-brand-green-dark hover:text-brand-green-dark transition-colors w-full"
      >
        ＋ Add ball
      </button>
    </div>
  );
}
