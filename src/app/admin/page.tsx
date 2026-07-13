import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin" };

const modules = [
  {
    href: "/admin/users",
    label: "Users",
    description: "Review applications, approve accounts, and manage roles.",
  },
  {
    href: "/admin/handbook",
    label: "IT Handbook",
    description: "Notes for IT staff — deploy, export, token renewal, etc.",
  },
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <p className="font-semibold uppercase tracking-widest ">Admin</p>
      <h1 className="mt-1 text-gray-900">Dashboard</h1>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-brand-green-dark hover:shadow-md transition-all"
          >
            <p className="font-semibold text-gray-900 group-hover:text-brand-green-dark transition-colors">
              {m.label}
            </p>
            <p className="mt-1 ">{m.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
