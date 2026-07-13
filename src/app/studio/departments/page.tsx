"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { StudioSaveBar } from "@/components/studio-save-bar";
import { ImageUpload } from "@/components/image-upload";
import Link from "next/link";

type DeptRow = {
  id: string;
  name: string;
  sortOrder: number;
  isCourseDepartment: boolean;
  href: string | null;
  imageKey: string | null;
};

type EditState = {
  name: string;
  sortOrder: string;
  isCourseDepartment: boolean;
  href: string;
  imageKey: string | null;
};

const inputClass =
  "block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark";

function buildEdits(data: DeptRow[]): Record<string, EditState> {
  const map: Record<string, EditState> = {};
  for (const d of data) {
    map[d.id] = {
      name: d.name,
      sortOrder: String(d.sortOrder),
      isCourseDepartment: d.isCourseDepartment,
      href: d.href ?? "",
      imageKey: d.imageKey ?? null,
    };
  }
  return map;
}

export default function StudioAvdelningarPage() {
  const [items, setItems] = useState<DeptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newSortOrder, setNewSortOrder] = useState("");
  const [adding, setAdding] = useState(false);

  const isDirty =
    savedSnapshot !== "" && JSON.stringify(edits) !== savedSnapshot;

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json() as Promise<DeptRow[]>)
      .then((data) => {
        setItems(data);
        const initial = buildEdits(data);
        setEdits(initial);
        setSavedSnapshot(JSON.stringify(initial));
      })
      .catch(() => setError("Could not load departments."))
      .finally(() => setLoading(false));
  }, []);

  function setEdit<K extends keyof EditState>(
    id: string,
    field: K,
    value: EditState[K],
  ) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id]!, [field]: value } }));
  }

  function doDiscard() {
    setEdits(JSON.parse(savedSnapshot) as Record<string, EditState>);
    setError(null);
  }

  async function doSave() {
    setSaving(true);
    setError(null);
    const savedEditsMap = JSON.parse(savedSnapshot) as Record<
      string,
      EditState
    >;
    const changed = items.filter(
      (item) =>
        JSON.stringify(edits[item.id]) !==
        JSON.stringify(savedEditsMap[item.id]),
    );
    try {
      const results = await Promise.all(
        changed.map(async (item) => {
          const edit = edits[item.id]!;
          return fetch(`/api/departments/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: edit.name,
              sortOrder: Number(edit.sortOrder),
              isCourseDepartment: edit.isCourseDepartment,
              href: edit.href || null,
              imageKey: edit.imageKey,
            }),
          }).then((r) => {
            if (!r.ok) throw new Error(`Could not save "${item.name}".`);
            return r.json() as Promise<DeptRow>;
          });
        }),
      );
      setItems((prev) =>
        prev.map((item) => results.find((r) => r.id === item.id) ?? item),
      );
      setSavedSnapshot(JSON.stringify(edits));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((d) => d.id !== id));
      setEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setSavedSnapshot((snap) => {
        const map = JSON.parse(snap) as Record<string, EditState>;
        delete map[id];
        return JSON.stringify(map);
      });
    } catch {
      setError("Could not delete the department.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleAdd(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          sortOrder: newSortOrder !== "" ? Number(newSortOrder) : items.length,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = (await res.json()) as DeptRow;
      const newEdit: EditState = {
        name: created.name,
        sortOrder: String(created.sortOrder),
        isCourseDepartment: created.isCourseDepartment,
        href: created.href ?? "",
        imageKey: created.imageKey ?? null,
      };
      setItems((prev) => [...prev, created]);
      setEdits((prev) => ({ ...prev, [created.id]: newEdit }));
      setSavedSnapshot((snap) => {
        const map = JSON.parse(snap) as Record<string, EditState>;
        map[created.id] = newEdit;
        return JSON.stringify(map);
      });
      setNewName("");
      setNewSortOrder("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <StudioSaveBar
        isDirty={isDirty}
        saving={saving}
        error={error}
        onSave={doSave}
        onDiscard={doDiscard}
      />

      <div className="mb-8">
        <Link
          href="/studio"
          className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors"
        >
          ← Studio
        </Link>
        <h1 className="mt-1">Departments</h1>
      </div>

      {loading ? (
        <p className="text-gray-700">Loading…</p>
      ) : (
        <div className="space-y-4 mb-12">
          {items.map((item) => {
            const edit = edits[item.id];
            if (!edit) return null;
            return (
              <div
                key={item.id}
                className="rounded-lg border border-gray-200 bg-white p-5 space-y-4"
              >
                <div className="grid grid-cols-[1fr_7rem_auto] gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Name
                    </label>
                    <input
                      value={edit.name}
                      onChange={(e) => setEdit(item.id, "name", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={edit.sortOrder}
                      onChange={(e) =>
                        setEdit(item.id, "sortOrder", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="pb-1.5">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Course department
                    </label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={edit.isCourseDepartment}
                      onClick={() =>
                        setEdit(
                          item.id,
                          "isCourseDepartment",
                          !edit.isCourseDepartment,
                        )
                      }
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${edit.isCourseDepartment ? "bg-brand-green-dark" : "bg-gray-300"}`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${edit.isCourseDepartment ? "translate-x-5" : "translate-x-1"}`}
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Card link{" "}
                    <span className="font-normal text-gray-600">
                      (where the department card should link to)
                    </span>
                  </label>
                  <input
                    value={edit.href}
                    onChange={(e) => setEdit(item.id, "href", e.target.value)}
                    placeholder="/distance-education/samtliga-naturliv"
                    className={`${inputClass}`}
                  />
                </div>

                <ImageUpload
                  value={edit.imageKey}
                  onChange={(key) => setEdit(item.id, "imageKey", key)}
                  prefix="avdelningar"
                  label="Card image"
                />

                <div className="flex justify-end border-t border-gray-100 pt-3">
                  <ConfirmDeleteButton
                    onConfirm={() => handleDelete(item.id)}
                    loading={deleting === item.id}
                    message="Are you sure? All profile links to this department will also be removed. This cannot be undone."
                    locked={false}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <h2 className="mb-4">New department</h2>
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Department name"
              className={inputClass}
            />
          </div>
          <div className="w-28">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <input
              type="number"
              min="0"
              value={newSortOrder}
              onChange={(e) => setNewSortOrder(e.target.value)}
              placeholder={String(items.length)}
              className={inputClass}
            />
          </div>
          <Button type="submit" disabled={adding}>
            {adding ? "Adding…" : "+ Add"}
          </Button>
        </form>
      </div>
    </div>
  );
}
