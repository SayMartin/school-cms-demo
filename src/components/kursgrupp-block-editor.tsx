"use client";

import { useEffect, useRef, useState } from "react";
import { BrandColorPicker } from "@/components/brand-color-picker";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { RichTextEditor } from "@/components/rich-text-editor";
import { HeadingStyleEditor } from "@/components/heading-style-editor";
import { BallStyleEditor } from "@/components/ball-style-editor";
import { getColorHex } from "@/lib/brand-colors";
import type { CandidateItem } from "@/app/api/hub-block-candidates/route";
import type { CourseGroupBlock, HubBlockItem } from "@/lib/blocks";

type Props = {
  block: CourseGroupBlock;
  onChange: (patch: Partial<CourseGroupBlock>) => void;
  onAutoSave?: (updatedBlock: CourseGroupBlock) => Promise<void>;
};

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green-dark focus:outline-none";

type ItemTab = "both" | "course" | "department";

const COURSE_TYPES = [
  { value: "program", label: "Program" },
  { value: "program_track", label: "Program track" },
  { value: "short", label: "Short course (SMF, MHFA)" },
  { value: "summer", label: "Summer course" },
  { value: "evening", label: "Evening course" },
];

const DELIVERY_MODES = [
  { value: "campus", label: "On campus" },
  { value: "distance_hybrid", label: "Distance with in-person meetups" },
  { value: "distance_pure", label: "Fully distance" },
  { value: "outdoor", label: "Outdoors" },
];

export function KursgruppBlockEditor({ block, onChange, onAutoSave }: Props) {
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<ItemTab>("both");
  const [filterCourseTypes, setFilterCourseTypes] = useState<string[]>([]);
  const [filterDelivery, setFilterDelivery] = useState<string[]>([]);
  const [filterAvdelningIds, setFilterAvdelningIds] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [colorPickerItem, setColorPickerItem] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/hub-block-candidates")
      .then((r) => {
        if (!r.ok) throw new Error("unauthorized");
        return r.json() as Promise<CandidateItem[]>;
      })
      .then(setCandidates)
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedItems = block.selectedItems;
  const displayMode = block.displayMode ?? "with-image";

  const allAvdelningar = candidates.filter(
    (c): c is Extract<CandidateItem, { itemType: "department" }> =>
      c.itemType === "department",
  );

  const filtered = candidates.filter((c) => {
    if (tab === "course" && c.itemType !== "course") return false;
    if (tab === "department" && c.itemType !== "department") return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !c.label.toLowerCase().includes(q) &&
        !c.meta.toLowerCase().includes(q)
      )
        return false;
    }
    if (c.itemType === "course") {
      if (
        filterCourseTypes.length > 0 &&
        !filterCourseTypes.includes(c.courseType)
      )
        return false;
      if (
        filterDelivery.length > 0 &&
        (c.deliveryMode == null || !filterDelivery.includes(c.deliveryMode))
      )
        return false;
      if (
        filterAvdelningIds.length > 0 &&
        !filterAvdelningIds.some((id) => c.avdelningIds.includes(id))
      )
        return false;
    }
    return true;
  });

  const selectedSet = new Set(selectedItems.map((i) => i.id));

  function toggleItem(c: CandidateItem) {
    if (selectedSet.has(c.id)) {
      onChange({ selectedItems: selectedItems.filter((i) => i.id !== c.id) });
    } else {
      onChange({
        selectedItems: [...selectedItems, { id: c.id, itemType: c.itemType }],
      });
    }
  }

  function selectAllVisible() {
    const toAdd = filtered
      .filter((c) => !selectedSet.has(c.id))
      .map<HubBlockItem>((c) => ({ id: c.id, itemType: c.itemType }));
    onChange({ selectedItems: [...selectedItems, ...toAdd] });
  }

  function move(id: string, dir: 1 | -1) {
    const idx = selectedItems.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const next = [...selectedItems];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap]!, next[idx]!];
    onChange({ selectedItems: next });
  }

  function removeItem(id: string) {
    const newItems = selectedItems.filter((i) => i.id !== id);
    onChange({ selectedItems: newItems });
    if (onAutoSave) void onAutoSave({ ...block, selectedItems: newItems });
  }

  function setItemColor(id: string, color: string) {
    onChange({
      selectedItems: selectedItems.map((i) =>
        i.id === id ? { ...i, color } : i,
      ),
    });
  }

  function setItemTitleColor(id: string, titleColor: string) {
    onChange({
      selectedItems: selectedItems.map((i) =>
        i.id === id ? { ...i, titleColor } : i,
      ),
    });
  }

  function labelFor(id: string) {
    return candidates.find((c) => c.id === id)?.label ?? id;
  }

  function metaFor(id: string) {
    return candidates.find((c) => c.id === id)?.meta ?? "";
  }

  function toggleFilter<T>(list: T[], val: T, setter: (v: T[]) => void) {
    setter(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  }

  return (
    <div className="space-y-4">
      {/* ── Group heading + anchor ────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Group heading <span className="font-normal text-gray-600">(H2)</span>
          </label>
          <HeadingStyleEditor
            color={block.headingColor}
            onColorChange={(c) => onChange({ headingColor: c })}
            visible={block.headingVisible ?? false}
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
      </div>

      {/* ── Ball style ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Choose ball type</p>
        <BallStyleEditor
          value={displayMode === "with-image" ? "image" : "color"}
          onChange={(v) =>
            onChange({
              displayMode: v === "image" ? "with-image" : "without-image",
            })
          }
          colorHex={getColorHex(
            (colorPickerItem
              ? selectedItems.find((i) => i.id === colorPickerItem)?.color
              : selectedItems[0]?.color) ?? "brand-purple",
          )}
        />
      </div>

      {/* ── Picker dropdown ──────────────────────────────────────────── */}
      <div ref={pickerRef}>
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          disabled={loadError}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          {loadError
            ? "Could not load"
            : candidates.length === 0
              ? "Loading…"
              : pickerOpen
                ? "Close"
                : `+ Choose Courses${selectedItems.length > 0 ? ` (${selectedItems.length} selected)` : ""}`}
        </button>

        {pickerOpen && candidates.length > 0 && (
          <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm space-y-3">
            {/* Search + tabs */}
            <div className="flex gap-2">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className={`flex-1 ${inputClass}`}
              />
              <div className="flex rounded-md border border-gray-300 overflow-hidden shrink-0">
                {(["both", "course", "department"] as ItemTab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`px-3 py-2 text-sm font-semibold transition-colors ${tab === t ? "bg-brand-green-dark border-brand-green-dark text-gray-900" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                  >
                    {t === "both"
                      ? "All"
                      : t === "course"
                        ? "Courses"
                        : "Departments"}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter (collapsible) */}
            <div className="rounded-md border border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors rounded-md"
              >
                <span>Filter</span>
                <span>{filterOpen ? "▲" : "▼"}</span>
              </button>
              {filterOpen && (
                <div className="border-t border-gray-100 px-3 py-3 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Course type
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {COURSE_TYPES.map((t) => (
                        <label
                          key={t.value}
                          className="flex items-center gap-1.5 text-sm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={filterCourseTypes.includes(t.value)}
                            onChange={() =>
                              toggleFilter(
                                filterCourseTypes,
                                t.value,
                                setFilterCourseTypes,
                              )
                            }
                            className="accent-brand-green-dark"
                          />
                          {t.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Delivery mode
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {DELIVERY_MODES.map((m) => (
                        <label
                          key={m.value}
                          className="flex items-center gap-1.5 text-sm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={filterDelivery.includes(m.value)}
                            onChange={() =>
                              toggleFilter(
                                filterDelivery,
                                m.value,
                                setFilterDelivery,
                              )
                            }
                            className="accent-brand-green-dark"
                          />
                          {m.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  {allAvdelningar.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Department
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {allAvdelningar.map((d) => (
                          <label
                            key={d.id}
                            className="flex items-center gap-1.5 text-sm cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={filterAvdelningIds.includes(d.id)}
                              onChange={() =>
                                toggleFilter(
                                  filterAvdelningIds,
                                  d.id,
                                  setFilterAvdelningIds,
                                )
                              }
                              className="accent-brand-green-dark"
                            />
                            {d.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Result grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  {filtered.length} results
                </span>
                {filtered.some((c) => !selectedSet.has(c.id)) && (
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    className="text-sm text-brand-green-dark hover:underline"
                  >
                    Select all visible
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-sm text-gray-600 py-2">
                    No matches.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {filtered.map((c) => {
                      const checked = selectedSet.has(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 transition-colors ${
                            checked
                              ? "border-brand-green-dark bg-brand-green-light"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleItem(c)}
                            className="mt-0.5 shrink-0 accent-brand-green-dark"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-gray-800">
                              {c.label}
                            </span>
                            <span className="block truncate text-sm text-gray-600">
                              {c.meta}
                            </span>
                            {c.itemType === "course" && !c.isPublished && (
                              <span className="block text-sm text-amber-600">
                                Draft
                              </span>
                            )}
                            {c.itemType === "course" && c.isArchived && (
                              <span className="block text-sm text-orange-600">
                                Archived
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Selected balls ───────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1.5">
          Selected balls ({selectedItems.length})
        </p>
        {selectedItems.length === 0 ? (
          <p className="text-sm text-gray-600">
            None selected yet. Click &quot;+ Choose Courses&quot; above.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {selectedItems.map((item, idx) => (
              <li
                key={item.id}
                className="rounded-md border border-gray-200 bg-white"
              >
                <div className="flex items-center gap-2 px-3 py-1">
                  <button
                    type="button"
                    onClick={() =>
                      setColorPickerItem((prev) =>
                        prev === item.id ? null : item.id,
                      )
                    }
                    className={`flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-sm font-medium transition-colors ${colorPickerItem === item.id ? "border-brand-green-dark bg-brand-green-light text-brand-green-dark" : "border-gray-300 bg-white text-gray-600 hover:border-brand-green-dark hover:bg-gray-50"}`}
                  >
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
                      style={{
                        backgroundColor: getColorHex(
                          item.color ?? "brand-purple",
                        ),
                      }}
                    />
                    Color picker
                    <span className="text-gray-600">
                      {colorPickerItem === item.id ? "▲" : "▼"}
                    </span>
                  </button>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-800">
                      {labelFor(item.id)}
                    </span>
                    <span className="block truncate text-sm text-gray-600">
                      {metaFor(item.id)}
                    </span>
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
                      disabled={idx === selectedItems.length - 1}
                      onClick={() => move(item.id, 1)}
                      className="rounded px-1.5 py-0.5 text-gray-600 hover:text-gray-700 disabled:opacity-30 transition-colors"
                    >
                      ▼
                    </button>
                    <ConfirmDeleteButton
                      onConfirm={() => removeItem(item.id)}
                      locked={false}
                    />
                  </div>
                </div>
                {colorPickerItem === item.id && (
                  <div className="border-t border-gray-100 px-3 py-2 space-y-3">
                    <BrandColorPicker
                      value={item.color ?? "brand-purple"}
                      onChange={(token) => setItemColor(item.id, token)}
                      defaultToken="brand-purple"
                      label="Ribbon color"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Title text
                      </p>
                      <HeadingStyleEditor
                        color={item.titleColor}
                        onColorChange={(c) => setItemTitleColor(item.id, c)}
                        visible={true}
                        onVisibleChange={() => {}}
                      />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Intro text ───────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Intro text{" "}
          <span className="text-gray-600 font-normal">(optional)</span>
        </label>
        <RichTextEditor
          key={block.id}
          value={block.body}
          onChange={(html) => onChange({ body: html })}
          placeholder="Short text shown below the heading…"
        />
      </div>
    </div>
  );
}
