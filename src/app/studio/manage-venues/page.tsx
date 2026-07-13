"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

type VenueItem = {
  id: string;
  name: string;
  slug: string;
  capacity: number | null;
  availableTo: string;
  sortOrder: number;
  published: boolean;
};

const availableToLabel: Record<string, string> = {
  all: "Alla",
  organizations: "Organizations & businesses",
};

export default function StudioMotesplatsPage() {
  const router = useRouter();
  const [items, setItems] = useState<VenueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/venues")
      .then((r) => r.json())
      .then((data) => setItems(data as VenueItem[]))
      .catch(() => setError("Could not load venues."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(slug: string) {
    setDeleting(slug);
    try {
      const res = await fetch(`/api/venues/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.slug !== slug));
    } catch {
      setError("Could not delete the venue.");
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
          <h1 className="mt-1">Manage Venues</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/studio/manage-venues/inquiries"
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 bg-brand-pink-light hover:bg-brand-pink transition-colors"
          >
            Inquiries
          </Link>
          <Link
            href="/studio/manage-venues/new"
            className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-gray-900 hover:bg-brand-green-dark hover:text-white transition-colors border border-brand-green-dark"
          >
            + New venue
          </Link>
        </div>
      </div>

      {error && (
        <p className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-700">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-700">No venues yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left font-medium text-gray-700">Available to</th>
                <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-gray-700">Capacity</th>
                <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-gray-700">Order</th>
                <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-gray-700">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-green">
              {items.map((item) => (
                <tr key={item.id} className="bg-brand-pink-light hover:bg-brand-pink transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="hidden sm:table-cell px-4 py-3 text-gray-700">
                    {availableToLabel[item.availableTo] ?? item.availableTo}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-gray-700">
                    {item.capacity ? `${item.capacity} people` : "—"}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-gray-700">{item.sortOrder}</td>
                  <td className="hidden md:table-cell px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-sm font-semibold ${
                      item.published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {item.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => router.push(`/studio/manage-venues/${item.slug}/edit`)}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
