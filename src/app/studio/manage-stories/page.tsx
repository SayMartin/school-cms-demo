"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

type Story = {
  id: string;
  name: string;
  graduationYear: number | null;
  courseName: string | null;
  story: string;
  published: boolean;
  createdAt: number;
};

export default function StudioHanteraBerattelser() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/participant-stories")
      .then((r) => r.json() as Promise<Story[]>)
      .then(setStories)
      .catch(() => setError("Could not load stories."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/participant-stories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setStories((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Could not delete the story.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/studio"
            className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors"
          >
            ← Studio
          </Link>
          <h1 className="mt-1">Manage Stories</h1>
        </div>
        <Link
          href="/studio/manage-stories/new"
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-gray-900 hover:bg-brand-green-dark hover:text-white transition-colors border border-brand-green-dark"
        >
          + New story
        </Link>
      </div>

      {error && <p className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-gray-700">Loading…</p>
      ) : stories.length === 0 ? (
        <p className="text-gray-700">No stories yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Year</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Course</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-green">
              {stories.map((s) => (
                <tr key={s.id} className="bg-brand-pink-light hover:bg-brand-pink transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.graduationYear ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{s.courseName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-sm font-semibold ${
                      s.published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {s.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/studio/manage-stories/${s.id}/edit`}
                        className="inline-flex items-center rounded px-3 py-1 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </Link>
                      <ConfirmDeleteButton
                        onConfirm={() => handleDelete(s.id)}
                        loading={deleting === s.id}
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
