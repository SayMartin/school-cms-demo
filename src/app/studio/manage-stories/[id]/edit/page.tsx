"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ImageUpload } from "@/components/image-upload";
import { RichTextEditor } from "@/components/rich-text-editor";
import { StudioSaveBar } from "@/components/studio-save-bar";
import { Button } from "@/components/button";

const currentYear = new Date().getFullYear();

function validateYear(value: string): string | null {
  if (!value) return null;
  if (!/^\d{4}$/.test(value)) return "Enter a four-digit year";
  const n = parseInt(value, 10);
  if (n < 1970 || n > currentYear + 1) return `Must be between 1970 and ${currentYear + 1}`;
  return null;
}

type Story = {
  id: string;
  name: string;
  graduationYear: number | null;
  courseName: string | null;
  story: string;
  imageKey: string | null;
  published: boolean;
};

export default function StudioRedigeraBerattelse() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseOptions, setCourseOptions] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [yearError, setYearError] = useState<string | null>(null);
  const [courseName, setCourseName] = useState("");
  const [story, setStory] = useState("");
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const [saved, setSaved] = useState<Story | null>(null);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json() as Promise<{ title: string }[]>)
      .then((items) => {
        const titles = [...new Set(items.map((c) => c.title))].sort((a, b) => a.localeCompare(b, "en"));
        setCourseOptions(titles);
      })
      .catch(() => {/* dropdown stays empty */});
  }, []);

  useEffect(() => {
    fetch(`/api/participant-stories/${id}`)
      .then((r) => r.json() as Promise<Story>)
      .then((d) => {
        setName(d.name);
        setGraduationYear(d.graduationYear ? String(d.graduationYear) : "");
        setCourseName(d.courseName ?? "");
        setStory(d.story);
        setImageKey(d.imageKey);
        setPublished(d.published);
        setSaved(d);
      })
      .catch(() => setError("Could not load the story."))
      .finally(() => setLoading(false));
  }, [id]);

  const isDirty = saved !== null && (
    name !== saved.name ||
    (graduationYear ? parseInt(graduationYear, 10) : null) !== saved.graduationYear ||
    (courseName.trim() || null) !== saved.courseName ||
    story !== saved.story ||
    imageKey !== saved.imageKey ||
    published !== saved.published
  );

  function doDiscard() {
    if (!saved) return;
    setName(saved.name);
    setGraduationYear(saved.graduationYear ? String(saved.graduationYear) : "");
    setYearError(null);
    setCourseName(saved.courseName ?? "");
    setStory(saved.story);
    setImageKey(saved.imageKey);
    setPublished(saved.published);
  }

  async function doSave() {
    const yErr = validateYear(graduationYear);
    if (yErr) { setYearError(yErr); return; }
    if (!name.trim() || !story.trim()) {
      setError("Name and Story are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/participant-stories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
          courseName: courseName.trim() || null,
          story,
          imageKey: imageKey ?? null,
          published,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/studio/manage-stories");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-12 text-gray-600">Loading…</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Link
        href="/studio/manage-stories"
        className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors"
      >
        ← Stories
      </Link>
      <h1 className="mt-1">Edit story</h1>

      <div className="mt-8 space-y-6">
        <StudioSaveBar
          isDirty={isDirty}
          saving={saving}
          error={error}
          onSave={() => void doSave()}
          onDiscard={doDiscard}
        />

        {/* Name · Graduation year · Course name */}
        <div className="grid grid-cols-[1fr_8rem_1fr] gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Graduation year</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={graduationYear}
              onChange={(e) => {
                setGraduationYear(e.target.value);
                setYearError(validateYear(e.target.value));
              }}
              placeholder={String(currentYear)}
              className={`block w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${yearError ? "border-red-400 focus:border-red-400 focus:ring-red-400" : "border-gray-300 focus:border-brand-green-dark focus:ring-brand-green-dark"}`}
            />
            {yearError && <p className="text-sm text-red-500">{yearError}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Course name</label>
            <select
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
            >
              <option value="">— Select course —</option>
              {courseOptions.map((title) => (
                <option key={title} value={title}>{title}</option>
              ))}
              {courseName && !courseOptions.includes(courseName) && (
                <option value={courseName}>{courseName} (existing value)</option>
              )}
            </select>
          </div>
        </div>

        {/* Story — RTE */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Story <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            value={story}
            onChange={setStory}
            placeholder="Write the participant's story…"
          />
        </div>

        {/* Image */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Image (optional)</label>
          <ImageUpload
            value={imageKey}
            prefix="participant-portraits"
            onChange={setImageKey}
          />
        </div>

        {/* Published */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-green-dark focus:ring-brand-green-dark"
          />
          <span className="text-sm font-medium text-gray-700">Published</span>
        </label>
        <div className="pt-4">
          <Button type="button" variant="outline-green" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
