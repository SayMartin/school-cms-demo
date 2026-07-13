"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

type KursItem = {
 id: string;
 courseType: string;
 deliveryMode: string | null;
 slug: string;
 title: string;
 excerpt: string;
 isPublished: boolean;
 isArchived: boolean;
 studyAidLevel: string | null;
};

const courseTypeLabel: Record<string, string> = {
 program: "Program",
 program_track: "Program Track",
 short: "Short Course",
 summer: "Summer Course",
 evening: "Evening Course",
};

const deliveryModeLabel: Record<string, string> = {
 campus: "On campus",
 distance_hybrid: "Distance w/ sessions",
 distance_pure: "Distance / Online",
 outdoor: "Outdoors",
};

const studyAidLabel: Record<string, string> = {
 compulsory: "CSN compulsory school",
 upper_secondary: "CSN upper secondary",
 post_secondary: "CSN post-secondary",
 none: "No CSN",
};

type Tab = "all" | "program" | "program_track" | "summer" | "evening" | "short";

export default function StudioKurserPage() {
 const [items, setItems] = useState<KursItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [deleting, setDeleting] = useState<string | null>(null);
 const [archiving, setArchiving] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [tab, setTab] = useState<Tab>("all");

 useEffect(() => {
 const url = tab === "all" ? "/api/courses" : `/api/courses?type=${tab}`;
 async function load() {
 setLoading(true);
 try {
 const r = await fetch(url);
 const data = (await r.json()) as KursItem[];
 setItems(data);
 } catch {
 setError("Could not fetch courses.");
 } finally {
 setLoading(false);
 }
 }
 void load();
 }, [tab]);

 async function handleDelete(slug: string) {
 setDeleting(slug);
 try {
 const res = await fetch(`/api/courses/${slug}`, { method: "DELETE" });
 if (!res.ok) throw new Error();
 setItems((prev) => prev.filter((i) => i.slug !== slug));
 } catch {
 setError("Could not delete the course.");
 } finally {
 setDeleting(null);
 }
 }

 async function handleArchive(slug: string, currentlyArchived: boolean) {
 setArchiving(slug);
 try {
 const res = await fetch(`/api/courses/${slug}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ isArchived: !currentlyArchived }),
 });
 if (!res.ok) throw new Error();
 setItems((prev) =>
 prev.map((i) => (i.slug === slug ? { ...i, isArchived: !currentlyArchived } : i)),
 );
 } catch {
 setError("Could not change archive status.");
 } finally {
 setArchiving(null);
 }
 }

 const tabs: { value: Tab; label: string }[] = [
 { value: "all", label: "All" },
 { value: "program", label: "Programs" },
 { value: "program_track", label: "Program Tracks" },
 { value: "summer", label: "Summer Courses" },
 { value: "evening", label: "Evening Courses" },
 { value: "short", label: "Short Courses" },
 ];

 return (
 <div className="mx-auto max-w-7xl px-4 py-12">
 <div className="flex items-center justify-between mb-6">
 <div>
 <Link href="/studio" className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors">
 ← Studio
 </Link>
 <h1 className="mt-1">Manage Courses</h1>
 </div>
 <Link
 href="/studio/manage-courses/new"
 className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-gray-900 hover:bg-brand-green-dark hover:text-white transition-colors border border-brand-green-dark"
 >
 + New Course
 </Link>
 </div>

 {/* Tabs */}
 <div className="flex gap-1 mb-6 border-b border-gray-200">
 {tabs.map((t) => (
 <button
 key={t.value}
 onClick={() => setTab(t.value)}
 className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
 tab === t.value
 ? "border-brand-green-dark text-brand-green-dark"
 : "border-transparent text-gray-700 hover:text-gray-800"
 }`}
 >
 {t.label}
 </button>
 ))}
 </div>

 {error && (
 <p className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
 )}

 {loading ? (
 <p className="text-gray-700">Loading…</p>
 ) : items.length === 0 ? (
 <p className="text-gray-700">No courses yet.</p>
 ) : (
 <div className="overflow-hidden rounded-lg border border-gray-200">
 <table className="min-w-full divide-y divide-gray-200 text-sm">
 <thead className="bg-gray-50">
 <tr>
 <th className="px-4 py-3 text-left font-medium text-gray-700">Title</th>
 <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
 <th className="px-4 py-3 text-left font-medium text-gray-700">Delivery</th>
 <th className="px-4 py-3 text-left font-medium text-gray-700">CSN</th>
 <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
 <th className="px-4 py-3" />
 </tr>
 </thead>
 <tbody className="divide-y divide-brand-green">
 {items.map((item) => (
 <tr
 key={item.id}
 className={`transition-colors ${
 item.isArchived
 ? "bg-orange-50 hover:bg-orange-100"
 : "bg-brand-pink-light hover:bg-brand-pink"
 }`}
 >
 <td className="px-4 py-3 font-medium text-gray-900">
 <div>{item.title}</div>
 <div className="text-sm text-gray-600">{item.slug}</div>
 </td>
 <td className="px-4 py-3 text-gray-600">
 {courseTypeLabel[item.courseType] ?? item.courseType}
 </td>
 <td className="px-4 py-3 text-gray-600">
 {item.deliveryMode ? (deliveryModeLabel[item.deliveryMode] ?? item.deliveryMode) : "—"}
 </td>
 <td className="px-4 py-3 text-gray-600">
 {item.studyAidLevel ? (studyAidLabel[item.studyAidLevel] ?? item.studyAidLevel) : "—"}
 </td>
 <td className="px-4 py-3">
 {item.isArchived ? (
 <span className="inline-flex rounded-full px-2 py-0.5 text-sm font-semibold bg-orange-100 text-orange-700">
 Archived
 </span>
 ) : (
 <span className={`inline-flex rounded-full px-2 py-0.5 text-sm font-semibold ${
 item.isPublished ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
 }`}>
 {item.isPublished ? "Published" : "Draft"}
 </span>
 )}
 </td>
 <td className="px-4 py-3 text-right whitespace-nowrap">
 <div className="flex justify-end gap-2">
 <Link
 href={`/studio/manage-courses/${item.slug}/edit`}
 className="inline-flex items-center rounded px-3 py-1 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
 >
 Edit
 </Link>
 {item.isArchived ? (
 <button
 onClick={() => void handleArchive(item.slug, true)}
 disabled={archiving === item.slug}
 className="rounded px-3 py-1 text-sm font-medium border border-brand-green-dark text-brand-green-dark hover:bg-brand-green transition-colors disabled:opacity-50"
 >
 {archiving === item.slug ? "Saving…" : "Reactivate"}
 </button>
 ) : (
 <ConfirmDeleteButton
 label="Archive ›"
 confirmLabel="Yes, archive"
 triggerVariant="warning"
 message="The course will be archived and hidden from course groups. All open application periods will be closed automatically. You can reactivate the course later."
 onConfirm={() => handleArchive(item.slug, false)}
 loading={archiving === item.slug}
 locked={false}
 />
 )}
 <ConfirmDeleteButton
 onConfirm={() => handleDelete(item.slug)}
 loading={deleting === item.slug}
 locked={false}
 />
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 );
}
