"use client";

import { useEffect, useRef, useState } from "react";
import { HeadingStyleEditor } from "@/components/heading-style-editor";
import type { ProfilesBlock } from "@/lib/blocks";

type ProfileItem = { id: string; name: string; email: string | null };

type Props = {
  block: ProfilesBlock;
  onChange: (patch: Partial<ProfilesBlock>) => void;
};

export function ProfilesBlockEditor({ block, onChange }: Props) {
  const [allProfiles, setAllProfiles] = useState<ProfileItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json() as Promise<ProfileItem[]>)
      .catch(() => [])
      .then((profiles) =>
        setAllProfiles(
          [...profiles].sort((a, b) => a.name.localeCompare(b.name, "en")),
        ),
      );
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

  const selected = block.profileIds
    .map((id) => allProfiles.find((p) => p.id === id))
    .filter(Boolean) as ProfileItem[];

  function toggle(id: string) {
    const next = block.profileIds.includes(id)
      ? block.profileIds.filter((v) => v !== id)
      : [...block.profileIds, id];
    onChange({ profileIds: next });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center">
          <label className="text-sm font-medium text-gray-700">
            Profile heading <span className="font-normal text-gray-600">(H2)</span>
          </label>
          <div className="ml-8">
            <HeadingStyleEditor
              color={block.headingColor}
              onColorChange={(c) => onChange({ headingColor: c })}
              visible={block.headingVisible}
              onVisibleChange={(v) => onChange({ headingVisible: v })}
              enabled={true}
            />
          </div>
        </div>
        <input
          type="text"
          value={block.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
          placeholder="Optional"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-brand-green-dark focus:outline-none"
        />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1"
            >
              {p.name}
              <button
                type="button"
                onClick={() => toggle(p.id)}
                className="text-gray-600 hover:text-red-500 transition-colors leading-none"
                aria-label={`Remove ${p.name}`}
              >
                X
              </button>
            </span>
          ))}
        </div>
      )}

      <div ref={pickerRef}>
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          disabled={allProfiles.length === 0}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          {pickerOpen
            ? "Close"
            : `+ Choose teachers${selected.length > 0 ? ` (${selected.length} selected)` : ""}`}
        </button>

        {pickerOpen && allProfiles.length > 0 && (
          <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {allProfiles.map((p) => {
                const checked = block.profileIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 transition-colors ${
                      checked
                        ? "border-brand-green-dark bg-brand-green-light"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(p.id)}
                      className="mt-0.5 shrink-0 rounded accent-brand-green-dark"
                    />
                    <span className="min-w-0">
                      <span className="block truncate">{p.name}</span>
                      {p.email && (
                        <span className="block truncate">{p.email}</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
