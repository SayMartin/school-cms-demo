"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ImageUpload } from "@/components/image-upload";
import { RichTextEditor } from "@/components/rich-text-editor";
import { StudioSaveBar } from "@/components/studio-save-bar";
import { Button } from "@/components/button";

const inputClass = "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark";

type DishData = {
  id: string;
  name: string;
  description: string | null;
  allergens: string | null;
  price: number | null;
  studentPrice: number | null;
  vegetarian: boolean;
  vegan: boolean;
  imageKey: string | null;
};

export default function EditRattPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    allergens: "",
    price: "",
    studentPrice: "",
    vegetarian: false,
    vegan: false,
    imageKey: null as string | null,
  });

  const isDirty = savedSnapshot !== "" && JSON.stringify(form) !== savedSnapshot;

  useEffect(() => {
    fetch(`/api/restaurant/dishes/${id}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json() as Promise<DishData>; })
      .then((d) => {
        const loaded = {
          name: d.name,
          description: d.description ?? "",
          allergens: d.allergens ?? "",
          price: d.price !== null ? String(d.price) : "",
          studentPrice: d.studentPrice !== null ? String(d.studentPrice) : "",
          vegetarian: d.vegetarian,
          vegan: d.vegan,
          imageKey: d.imageKey,
        };
        setForm(loaded);
        setSavedSnapshot(JSON.stringify(loaded));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function doSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/restaurant/dishes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: form.price ? parseInt(form.price, 10) : null,
          studentPrice: form.studentPrice ? parseInt(form.studentPrice, 10) : null,
          description: form.description || null,
          allergens: form.allergens || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/restaurant-admin/dishes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-12 text-gray-600">Loading…</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Link href="/restaurant-admin/dishes" className="font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors">
        ← Dishes
      </Link>
      <h1 className="mt-1 text-gray-900">Edit Dish</h1>

      <form onSubmit={(e) => { e.preventDefault(); void doSave(); }} className="mt-8 space-y-6">
        <StudioSaveBar isDirty={isDirty} saving={saving} error={error} onSave={doSave} onDiscard={() => setForm(JSON.parse(savedSnapshot) as typeof form)} />
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <RichTextEditor value={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))} placeholder="Describe the dish…" />
        </div>

        <div>
          <label htmlFor="allergens" className="block text-sm font-medium text-gray-700">Allergens</label>
          <RichTextEditor value={form.allergens} onChange={(html) => setForm((f) => ({ ...f, allergens: html }))} placeholder="e.g. Gluten, Milk, Egg" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (kr)</label>
            <input id="price" type="number" min="0" placeholder="e.g. 95" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label htmlFor="studentPrice" className="block text-sm font-medium text-gray-700">Student Price (kr)</label>
            <input id="studentPrice" type="number" min="0" placeholder="e.g. 65" value={form.studentPrice} onChange={(e) => setForm((f) => ({ ...f, studentPrice: e.target.value }))} className={inputClass} />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.vegetarian} onChange={(e) => setForm((f) => ({ ...f, vegetarian: e.target.checked }))} className="rounded border-gray-300 text-brand-green-dark focus:ring-brand-green-dark" />
            Vegetarian
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.vegan} onChange={(e) => setForm((f) => ({ ...f, vegan: e.target.checked }))} className="rounded border-gray-300 text-brand-green-dark focus:ring-brand-green-dark" />
            Vegan
          </label>
        </div>

        <ImageUpload value={form.imageKey} onChange={(key) => setForm((f) => ({ ...f, imageKey: key }))} prefix="dishes" label="Image" />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
