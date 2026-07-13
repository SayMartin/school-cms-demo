"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

type NewsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string | null;
  isPublished: boolean;
  publishedAt: string | null;
};

export default function StudioAktuellPage() {
  const router = useRouter();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((data) => setItems(data as NewsItem[]))
      .catch(() => setError("Could not load news."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(slug: string) {
    setDeleting(slug);
    try {
      const res = await fetch(`/api/news/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.slug !== slug));
    } catch {
      setError("Could not delete the news item.");
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
          <h1 className="mt-1">News</h1>
        </div>
        <Link
          href="/studio/manage-news/new"
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-gray-900 hover:bg-brand-green-dark hover:text-white transition-colors border border-brand-green-dark"
        >
          + New article
        </Link>
      </div>

      {error && (
        <p className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-700">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-700">No news published yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Title</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left font-medium text-gray-700">Author</th>
                <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-gray-700">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-green">
              {items.map((item) => {
                const date = item.publishedAt
                  ? new Date(item.publishedAt).toLocaleDateString("en-US", {
                      timeZone: "Europe/Stockholm",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : null;
                return (
                  <tr key={item.id} className="bg-brand-pink-light hover:bg-brand-pink transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/news/${item.slug}`}
                        target="_blank"
                        className="font-medium text-gray-900 hover:text-brand-green-dark transition-colors"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-sm text-gray-600 line-clamp-1">{item.excerpt}</p>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-gray-700">
                      {item.author ?? "—"}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      {item.isPublished ? (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-sm font-semibold bg-green-100 text-green-700">
                          {date ?? "Published"}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-sm font-semibold bg-yellow-100 text-yellow-700">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => router.push(`/studio/manage-news/${item.slug}/edit`)}
                          className="inline-flex items-center rounded px-3 py-1 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Edit
                        </button>
                        <ConfirmDeleteButton
                          onConfirm={() => handleDelete(item.slug)}
                          loading={deleting === item.slug}
                          locked={false}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
