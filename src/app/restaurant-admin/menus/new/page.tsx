"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RichTextEditor } from "@/components/rich-text-editor";
import { StudioSaveBar } from "@/components/studio-save-bar";
import { Button } from "@/components/button";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const inputClass = "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark text-sm";

type DishOption = { id: string; name: string };
type DayState = { closed: boolean; items: string[] }; // items = dishIds

function getISOWeek(d: Date) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const defaultDays = (): DayState[] => Array.from({ length: 5 }, () => ({ closed: false, items: [""] }));

export default function NewMenyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dishes, setDishes] = useState<DishOption[]>([]);
  const isDirty = true;

  const now = new Date();
  const [form, setForm] = useState({
    week: String(getISOWeek(now)),
    year: String(now.getFullYear()),
    notes: "",
    published: false,
  });
  const [days, setDays] = useState<DayState[]>(defaultDays());

  const [footer, setFooter] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/restaurant/dishes").then((r) => r.json() as Promise<DishOption[]>),
      fetch("/api/restaurant/content").then((r) => r.json() as Promise<{ defaultMenuFooter: string }>),
    ])
      .then(([dishes, content]) => {
        setDishes(dishes);
        setFooter(content.defaultMenuFooter);
      })
      .catch(() => {});
  }, []);

  function updateDay(idx: number, patch: Partial<DayState>) {
    setDays((prev) => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));
  }

  function addDish(dayIdx: number) {
    setDays((prev) => prev.map((d, i) => i === dayIdx ? { ...d, items: [...d.items, ""] } : d));
  }

  function removeDish(dayIdx: number, itemIdx: number) {
    setDays((prev) => prev.map((d, i) => i === dayIdx ? { ...d, items: d.items.filter((_, j) => j !== itemIdx) } : d));
  }

  function setDish(dayIdx: number, itemIdx: number, dishId: string) {
    setDays((prev) => prev.map((d, i) => i === dayIdx ? { ...d, items: d.items.map((v, j) => j === itemIdx ? dishId : v) } : d));
  }

  async function doSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        week: parseInt(form.week, 10),
        year: parseInt(form.year, 10),
        notes: form.notes || null,
        footer: footer || null,
        published: form.published,
        days: days.map((d, i) => ({
          day: i + 1,
          closed: d.closed,
          items: d.closed ? [] : d.items.filter(Boolean).map((dishId, j) => ({ dishId, sortOrder: j })),
        })),
      };
      const requests: Promise<Response>[] = [
        fetch("/api/restaurant/menus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      ];
      if (saveAsDefault) {
        requests.push(
          fetch("/api/restaurant/content", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ defaultMenuFooter: footer }),
          })
        );
      }
      const [res] = await Promise.all(requests);
      if (!res.ok) throw new Error(await res.text());
      router.push("/restaurant-admin/menus");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Link href="/restaurant-admin/menus" className="font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors">
        ← Weekly Menus
      </Link>
      <h1 className="mt-1 text-gray-900">New Weekly Menu</h1>

      <form onSubmit={(e) => { e.preventDefault(); void doSave(); }} className="mt-8 space-y-8">
        <StudioSaveBar isDirty={isDirty} saving={saving} error={error} onSave={doSave} onDiscard={() => router.back()} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="week" className="block text-sm font-medium text-gray-700">Week</label>
            <input id="week" required type="number" min="1" max="53" value={form.week} onChange={(e) => setForm((f) => ({ ...f, week: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
            <input id="year" required type="number" min="2020" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Note (optional)</label>
          <RichTextEditor value={form.notes} onChange={(html) => setForm((f) => ({ ...f, notes: html }))} placeholder="e.g. Christmas buffet on Tuesday" />
        </div>

        <div className="border-t border-gray-200 pt-6 space-y-6">
          <p className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Daily Menu</p>
          {days.map((day, dayIdx) => (
            <div key={dayIdx} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">{DAY_NAMES[dayIdx]}</span>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={day.closed} onChange={(e) => updateDay(dayIdx, { closed: e.target.checked })} className="rounded border-gray-300" />
                  Closed
                </label>
              </div>

              {!day.closed && (
                <div className="space-y-2">
                  {day.items.map((dishId, itemIdx) => (
                    <div key={itemIdx} className="flex items-center gap-2">
                      <select
                        id={`day-${dayIdx}-item-${itemIdx}`}
                        name={`day-${dayIdx}-item-${itemIdx}`}
                        value={dishId}
                        onChange={(e) => setDish(dayIdx, itemIdx, e.target.value)}
                        className={`flex-1 bg-white ${inputClass}`}
                      >
                        <option value="">— Select dish —</option>
                        {dishes.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      {day.items.length > 1 && (
                        <button type="button" onClick={() => removeDish(dayIdx, itemIdx)} className="shrink-0 text-sm text-red-500 hover:text-red-700">✕</button>
                      )}
                    </div>
                  ))}
                  {day.items.length < 3 && (
                    <button type="button" onClick={() => addDish(dayIdx)} className="text-sm font-medium text-brand-green-dark hover:underline">
                      + Add dish
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <span className="block text-sm font-medium text-gray-700 mb-2">Status</span>
          <button
            type="button"
            role="switch"
            aria-checked={form.published}
            onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
            className="flex items-center gap-3"
          >
            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.published ? "bg-brand-green-dark" : "bg-gray-300"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.published ? "translate-x-6" : "translate-x-1"}`} />
            </span>
            <span className="text-sm text-gray-700">{form.published ? "Published" : "Draft"}</span>
          </button>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <label htmlFor="footer" className="block text-sm font-medium text-gray-700">Footer (prices &amp; info)</label>
          <p className="text-sm text-gray-600 mt-0.5 mb-1">Shown at the bottom of the printout and the Restaurant page.</p>
          <RichTextEditor value={footer} onChange={setFooter} placeholder="Prices, allergens and other info…" />
          <label className="mt-2 flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={saveAsDefault} onChange={(e) => setSaveAsDefault(e.target.checked)} className="rounded border-gray-300" />
            Save as default footer for new menus
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
