"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { Button } from "@/components/button";
import { DishItem } from "@/components/dish-item";

type Dish = {
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

export default function RatterPage() {
  const [items, setItems] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/restaurant/dishes")
      .then((r) => r.json())
      .then((d) => setItems(d as Dish[]))
      .catch(() => setError("Could not load dishes."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    await fetch(`/api/restaurant/dishes/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/restaurant-admin"
            className="font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors"
          >
            ← Manage Restaurant
          </Link>
          <h1 className="mt-1 text-gray-900">Dishes</h1>
        </div>
        <Link
          href="/restaurant-admin/dishes/new"
          className="rounded-md bg-brand-green-light px-4 py-2 text-lg font-semibold text-brand-green-dark hover:bg-brand-green transition-colors">
          + New Dish
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-600">No dishes yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 hover:shadow-md transition-shadow"
            >
              <DishItem
                dish={item}
                actions={
                  <>
                    <Button
                      href={`/restaurant-admin/dishes/${item.id}/edit`}
                      variant="outline-green"
                      size="sm"
                    >
                      Edit
                    </Button>
                    <ConfirmDeleteButton
                      onConfirm={() => handleDelete(item.id)}
                      label="Delete"
                      locked={false}
                    />
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
