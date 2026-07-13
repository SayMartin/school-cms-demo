"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageUpload } from "@/components/image-upload";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/button";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const inputClass =
  "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark";
const sectionHeading =
  "text-sm font-semibold text-gray-700 uppercase tracking-wider";
const addBtn = "text-sm font-medium text-brand-green-dark hover:underline";
const removeBtn = "text-sm text-red-500 hover:text-red-700";

export default function NewVenuePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugExpanded, setSlugExpanded] = useState(false);

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

  function handleName(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug:
        f.slug === slugify(f.name) || f.slug === "" ? slugify(name) : f.slug,
    }));
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category: form.category || null,
          capacity: form.capacity ? parseInt(form.capacity, 10) : null,
          priceInfo: form.priceInfo || null,
          sortOrder: parseInt(form.sortOrder, 10) || 0,
          features: features.filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/studio/manage-venues");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Link
        href="/studio/manage-venues"
        className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors"
      >
        ← Venues
      </Link>
      <h1 className="mt-1">New venue</h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* ── Name + slug ──────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => handleName(e.target.value)}
            className={inputClass}
          />
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sm text-gray-600 truncate">
              /venues#{form.slug || "…"}
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

        {/* ── Description ──────────────────────────────────── */}
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

        {/* ── Category + price ──────────────────────────────── */}
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
              <option value="">— Choose category —</option>
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

        {/* ── Meta ─────────────────────────────────────────── */}
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
            <option value="organizations">Organizations and businesses</option>
            <option value="all">Everyone (incl. private individuals)</option>
          </select>
        </div>

        {/* ── Features ───────────────────────────────────── */}
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

        {/* ── Status ───────────────────────────────────────── */}
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

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : form.published ? "Publish" : "Save draft"}
          </Button>
          <Button
            type="button"
            variant="outline-green"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
