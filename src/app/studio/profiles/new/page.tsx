"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageUpload } from "@/components/image-upload";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/button";

const inputClass =
 "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark";

type DeptForm = {
 departmentId: string;
 name: string;
 checked: boolean;
 titles: string[];
 newTitle: string;
 sortOrder: number;
};

type Department = { id: string; name: string; sortOrder: number };

export default function NewProfilePage() {
 const router = useRouter();
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [deptForms, setDeptForms] = useState<DeptForm[]>([]);

 const [form, setForm] = useState({
 name: "",
 phone: "",
 directPhone: "",
 email: "",
 bio: "",
 imageKey: null as string | null,
 sortOrder: 0,
 published: false,
 });

 useEffect(() => {
 fetch("/api/departments")
 .then((r) => r.json() as Promise<Department[]>)
 .then((data) =>
 setDeptForms(
 data.map((d) => ({
 departmentId: d.id,
 name: d.name,
 checked: false,
 titles: [],
 newTitle: "",
 sortOrder: d.sortOrder,
 }))
 )
 )
 .catch(() => setError("Could not load departments."));
 }, []);

 function toggleDept(departmentId: string) {
 setDeptForms((prev) =>
 prev.map((d) => (d.departmentId === departmentId ? { ...d, checked: !d.checked } : d))
 );
 }

 function addTitle(departmentId: string) {
 setDeptForms((prev) =>
 prev.map((d) => {
 if (d.departmentId !== departmentId || !d.newTitle.trim()) return d;
 return { ...d, titles: [...d.titles, d.newTitle.trim()], newTitle: "" };
 })
 );
 }

 function removeTitle(departmentId: string, index: number) {
 setDeptForms((prev) =>
 prev.map((d) =>
 d.departmentId === departmentId
 ? { ...d, titles: d.titles.filter((_, i) => i !== index) }
 : d
 )
 );
 }

 async function handleSubmit(e: React.SyntheticEvent) {
 e.preventDefault();
 setSaving(true);
 setError(null);
 try {
 const res = await fetch("/api/profiles", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 name: form.name,
 phone: form.phone || null,
 directPhone: form.directPhone || null,
 email: form.email || null,
 bio: form.bio || null,
 imageKey: form.imageKey,
 sortOrder: form.sortOrder,
 published: form.published,
 departments: deptForms
 .filter((d) => d.checked)
 .map((d, i) => ({ departmentId: d.departmentId, titles: d.titles, sortOrder: i })),
 }),
 });
 if (!res.ok) throw new Error(await res.text());
 router.push("/studio/profiles");
 } catch (err) {
 setError(err instanceof Error ? err.message : "Something went wrong.");
 } finally {
 setSaving(false);
 }
 }

 return (
 <div className="mx-auto max-w-7xl px-4 py-12">
 <Link
 href="/studio/profiles"
 className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors"
 >
 ← Profiles
 </Link>
 <h1 className="mt-1">New profile</h1>

 {error && (
 <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
 )}

 <form onSubmit={handleSubmit} className="mt-8 space-y-6">
 <div>
 <label className="block text-sm font-medium text-gray-700">Name</label>
 <input
 required
 value={form.name}
 onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
 className={inputClass}
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-700">Phone (switchboard)</label>
 <input
 type="tel"
 value={form.phone}
 onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
 className={inputClass}
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700">Direct phone</label>
 <input
 type="tel"
 value={form.directPhone}
 onChange={(e) => setForm((f) => ({ ...f, directPhone: e.target.value }))}
 className={inputClass}
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700">Email</label>
 <input
 type="email"
 value={form.email}
 onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
 className={inputClass}
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">About the person</label>
 <RichTextEditor
 value={form.bio}
 onChange={(html) => setForm((f) => ({ ...f, bio: html }))}
 placeholder="Short description of the person…"
 />
 </div>

 <ImageUpload
 value={form.imageKey}
 onChange={(key) => setForm((f) => ({ ...f, imageKey: key }))}
 prefix="profiles"
 label="Profile photo"
 />

 {deptForms.length > 0 && (
 <div>
 <span className="block text-sm font-medium text-gray-700 mb-3">Departments</span>
 <div className="space-y-2">
 {deptForms.map((d) => (
 <div key={d.departmentId} className="rounded-md border border-gray-200 p-3">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={d.checked}
 onChange={() => toggleDept(d.departmentId)}
 className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-brand-green-dark"
 />
 <span className="text-sm font-medium text-gray-800">{d.name}</span>
 </label>

 {d.checked && (
 <div className="mt-3 ml-6 space-y-2">
 <p className="text-sm font-medium text-gray-600">Titles in this department</p>
 {d.titles.length > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {d.titles.map((t, i) => (
 <span
 key={i}
 className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-700"
 >
 {t}
 <button
 type="button"
 onClick={() => removeTitle(d.departmentId, i)}
 className="text-gray-600 hover:text-red-500 transition-colors leading-none"
 >
 ×
 </button>
 </span>
 ))}
 </div>
 )}
 <div className="flex gap-2">
 <input
 type="text"
 placeholder="Add title…"
 value={d.newTitle}
 onChange={(e) =>
 setDeptForms((prev) =>
 prev.map((x) =>
 x.departmentId === d.departmentId
 ? { ...x, newTitle: e.target.value }
 : x
 )
 )
 }
 onKeyDown={(e) => {
 if (e.key === "Enter") {
 e.preventDefault();
 addTitle(d.departmentId);
 }
 }}
 className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
 />
 <button
 type="button"
 onClick={() => addTitle(d.departmentId)}
 className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
 >
 + Add
 </button>
 </div>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 <div>
 <label className="block text-sm font-medium text-gray-700">Sort order</label>
 <input
 type="number"
 min="0"
 value={form.sortOrder}
 onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
 className={inputClass}
 />
 </div>

 <div>
 <span className="block text-sm font-medium text-gray-700 mb-2">Status</span>
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

 <div className="flex flex-wrap gap-3 pt-2">
 <Button type="submit" disabled={saving}>
 {saving ? "Saving…" : form.published ? "Publish" : "Save draft"}
 </Button>
 <Button type="button" variant="outline-green" onClick={() => router.back()}>
 Cancel
 </Button>
 </div>
 </form>
 </div>
 );
}
