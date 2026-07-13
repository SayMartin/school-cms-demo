"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

type Menu = {
  id: string;
  week: number;
  year: number;
  notes: string | null;
  published: boolean;
  createdAt: string;
};

function getISOWeek(d: Date) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function MenyerPage() {
  const [items, setItems] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const currentWeek = getISOWeek(now);
  const currentYear = now.getFullYear();

  useEffect(() => {
    fetch("/api/restaurant/menus")
      .then((r) => r.json())
      .then((d) => setItems(d as Menu[]))
      .catch(() => setError("Could not load menus."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    await fetch(`/api/restaurant/menus/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/restaurant-admin" className="font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors">
            ← Manage Restaurant
          </Link>
          <h1 className="mt-1 text-gray-900">Weekly Menus</h1>
        </div>
        <Link href="/restaurant-admin/menus/new" className="rounded-md bg-brand-green-light px-4 py-2 text-lg font-semibold text-brand-green-dark hover:bg-brand-green transition-colors">
          + New Weekly Menu
        </Link>
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-600">No menus yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const isCurrent = item.week === currentWeek && item.year === currentYear;
            return (
              <li key={item.id} className={`flex items-center gap-4 rounded-lg border bg-white p-4 ${isCurrent ? "border-brand-green-dark border-l-4" : "border-gray-200"}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">
                    Week {item.week}, {item.year}
                    {isCurrent && <span className="ml-2 text-sm font-semibold text-brand-green-dark">Current</span>}
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.published ? "Published" : "Draft"}
                    {item.notes ? ` · ${item.notes}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3">
                  <Link href={`/restaurant-admin/menus/${item.id}/edit`} className="text-base font-medium text-gray-600 hover:text-gray-900">
                    Edit
                  </Link>
                  <ConfirmDeleteButton
                    onConfirm={() => handleDelete(item.id)}
                    label="Delete"
                    locked={false}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
