import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Manage Restaurant" };

const cards = [
  {
    href: "/restaurant-admin/menus",
    label: "Weekly Menus",
    desc: "Create and publish this week's menu",
  },
  {
    href: "/restaurant-admin/dishes",
    label: "Dishes",
    desc: "Manage the dish library with images and allergens",
  },
  {
    href: "/restaurant-admin/content",
    label: "Content",
    desc: "Edit intro text and price information",
  },
];

export default function RestaurangHanteraPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className=" text-gray-900">Manage Restaurant</h1>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow border-t-4 border-t-brand-green-dark"
            >
              <span className="font-semibold text-gray-900">{c.label}</span>
              <span className="mt-1 text-base text-gray-700">{c.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
