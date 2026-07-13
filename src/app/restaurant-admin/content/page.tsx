"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RichTextEditor } from "@/components/rich-text-editor";
import { StudioSaveBar } from "@/components/studio-save-bar";

type ContentData = { intro: string; pricesNote: string };

export default function ContentPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ContentData>({ intro: "", pricesNote: "" });
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const isDirty =
    savedSnapshot !== "" && JSON.stringify(form) !== savedSnapshot;

  useEffect(() => {
    fetch("/api/restaurant/content")
      .then((r) => r.json() as Promise<ContentData>)
      .then((d) => {
        setForm(d);
        setSavedSnapshot(JSON.stringify(d));
      })
      .catch(() => setError("Could not load content."))
      .finally(() => setLoading(false));
  }, []);

  async function doSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/restaurant/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setSavedSnapshot(JSON.stringify(form));
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
        href="/restaurant-admin"
        className=" font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors"
      >
        ← Manage Restaurant
      </Link>
      <h1 className="mt-1 text-gray-900">Content</h1>

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
          onDiscard={() => setForm(JSON.parse(savedSnapshot) as ContentData)}
        />

        <div>
          <label
            htmlFor="intro"
            className="block text-base font-medium text-gray-700"
          >
            Intro Text
          </label>
          <RichTextEditor
            value={form.intro}
            onChange={(html) => setForm((f) => ({ ...f, intro: html }))}
            placeholder="Welcome text for the Restaurant page…"
          />
        </div>

        <div>
          <label
            htmlFor="pricesNote"
            className="block text-base font-medium text-gray-700"
          >
            Price Information
          </label>
          <p className="text-sm text-gray-700 mt-0.5 mb-1">
            Shown below the menu on the Restaurant page.
          </p>
          <RichTextEditor
            value={form.pricesNote}
            onChange={(html) => setForm((f) => ({ ...f, pricesNote: html }))}
            placeholder="Price list, allergens and other info…"
          />
        </div>
      </form>
    </div>
  );
}
