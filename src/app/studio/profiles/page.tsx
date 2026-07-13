"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

type DeptInfo = { departmentId: string; departmentName: string };
type ProfileItem = {
  id: string;
  name: string;
  email: string | null;
  published: boolean;
  departments: DeptInfo[];
};
type Department = { id: string; name: string; sortOrder: number };

type RowProps = {
  item: ProfileItem;
  deleting: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

function ProfileRow({ item, deleting, onEdit, onDelete }: RowProps) {
  return (
    <tr className="bg-brand-pink-light hover:bg-brand-pink transition-colors">
      <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
      <td className="hidden md:table-cell px-4 py-3 text-gray-700">{item.email ?? "—"}</td>
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
            onClick={() => onEdit(item.id)}
            className="inline-flex items-center rounded px-3 py-1 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
          <ConfirmDeleteButton
            onConfirm={() => onDelete(item.id)}
            loading={deleting === item.id}
            locked={false}
          />
        </div>
      </td>
    </tr>
  );
}

type GroupTableProps = {
  profiles: ProfileItem[];
  deleting: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

function GroupTable({ profiles, deleting, onEdit, onDelete }: GroupTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
            <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-gray-700">Email</th>
            <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-gray-700">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-green">
          {profiles.map((item) => (
            <ProfileRow
              key={item.id}
              item={item}
              deleting={deleting}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StudioProfilerPage() {
  const router = useRouter();
  const [items, setItems] = useState<ProfileItem[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/profiles").then((r) => r.json() as Promise<ProfileItem[]>),
      fetch("/api/departments").then((r) => r.json() as Promise<Department[]>),
    ])
      .then(([profiles, departments]) => {
        setItems(profiles);
        setDepts(departments);
      })
      .catch(() => setError("Could not load profiles."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/profiles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError("Could not delete the profile.");
    } finally {
      setDeleting(null);
    }
  }

  const onEdit = (id: string) => router.push(`/studio/profiles/${id}/edit`);
  const withoutDept = items.filter((p) => p.departments.length === 0);

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
          <h1 className="mt-1">Profiles</h1>
        </div>
        <Link
          href="/studio/profiles/new"
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-gray-900 hover:bg-brand-green-dark hover:text-white transition-colors border border-brand-green-dark"
        >
          + New profile
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
        <p className="text-gray-700">No profiles yet.</p>
      ) : (
        <div className="space-y-10">
          {depts.map((dept) => {
            const group = items.filter((p) =>
              p.departments.some((d) => d.departmentId === dept.id),
            );
            if (group.length === 0) return null;
            return (
              <section key={dept.id}>
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-600">
                  {dept.name}
                </p>
                <GroupTable
                  profiles={group}
                  deleting={deleting}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                />
              </section>
            );
          })}

          {withoutDept.length > 0 && (
            <section>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-600">
                No department
              </p>
              <GroupTable
                profiles={withoutDept}
                deleting={deleting}
                onEdit={onEdit}
                onDelete={handleDelete}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
