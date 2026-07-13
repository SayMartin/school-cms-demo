"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ImageUpload } from "@/components/image-upload";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/button";
import { StudioSaveBar } from "@/components/studio-save-bar";

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
type ProfileDept = {
 departmentId: string;
 departmentName: string;
 titles: string[];
 sortOrder: number;
};
type ProfileData = {
 name: string;
 phone: string | null;
 directPhone: string | null;
 email: string | null;
 bio: string | null;
 imageKey: string | null;
 sortOrder: number;
 published: boolean;
 departments: ProfileDept[];
};

export default function EditProfilePage() {
 const router = useRouter();
 const { id } = useParams<{ id: string }>();

 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [deptForms, setDeptForms] = useState<DeptForm[]>([]);
 const [savedSnapshot, setSavedSnapshot] = useState("");

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

 const isDirty = useMemo(
 () => savedSnapshot !== "" &&
 JSON.stringify({ form, deptForms: deptForms.map(({ newTitle: _newTitle, ...r }) => r) }) !== savedSnapshot,
 [savedSnapshot, form, deptForms]
 );

 useEffect(() => {
 Promise.all([
 fetch(`/api/profiles/${id}`).then((r) => {
 if (!r.ok) throw new Error("Not found");
 return r.json() as Promise<ProfileData>;
 }),
 fetch("/api/departments").then((r) => r.json() as Promise<Department[]>),
 ])
 .then(([profileData, allDepts]) => {
 const loadedForm = {
 name: profileData.name,
 phone: profileData.phone ?? "",
 directPhone: profileData.directPhone ?? "",
 email: profileData.email ?? "",
 bio: profileData.bio ?? "",
 imageKey: profileData.imageKey,
 sortOrder: profileData.sortOrder,
 published: profileData.published,
 };

 const deptMap = new Map(
 profileData.departments.map((d) => [d.departmentId, d])
 );

 const loadedDeptForms = allDepts.map((d) => {
 const existing = deptMap.get(d.id);
 return {
 departmentId: d.id,
 name: d.name,
 checked: !!existing,
 titles: existing?.titles ?? [],
 newTitle: "",
 sortOrder: existing?.sortOrder ?? d.sortOrder,
 };
 });

 setForm(loadedForm);
 setDeptForms(loadedDeptForms);
 setSavedSnapshot(JSON.stringify({ form: loadedForm, deptForms: loadedDeptForms.map(({ newTitle: _newTitle, ...r }) => r) }));
 })
 .catch((err: Error) => setError(err.message))
 .finally(() => setLoading(false));
 }, [id]);

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

 function doDiscard() {
 const snap = JSON.parse(savedSnapshot) as { form: typeof form; deptForms: DeptForm[] };
 setForm(snap.form);
 setDeptForms(snap.deptForms);
 }

 async function doSave() {
 setSaving(true);
 setError(null);
 try {
 const res = await fetch(`/api/profiles/${id}`, {
 method: "PUT",
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

 if (loading)
 return <div className="mx-auto max-w-7xl px-4 py-12 text-gray-600">Loading…</div>;

 return (
 <div className="mx-auto max-w-7xl px-4 py-12">
 <Link
 href="/studio/profiles"
 className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors"
 >
 ← Profiles
 </Link>
 <h1 className="mt-1">Edit profile</h1>

 <form onSubmit={(e) => { e.preventDefault(); void doSave(); }} className="mt-8 space-y-6">
 <StudioSaveBar isDirty={isDirty} saving={saving} error={error} onSave={doSave} onDiscard={doDiscard} />

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
 <button
 type="button"
 onClick={() => void doSave()}
 disabled={saving || !isDirty}
 className={`rounded-md px-6 py-2.5 text-sm font-semibold transition-colors ${isDirty ? "bg-gray-900 text-white hover:bg-gray-700" : "bg-gray-100 text-gray-600"} disabled:opacity-50`}
 >
 {saving ? "Saving…" : isDirty ? "Save changes" : "All saved"}
 </button>
 <Button type="button" variant="outline-green" onClick={() => router.back()}>
 Cancel
 </Button>
 </div>
 </form>
 </div>
 );
}
