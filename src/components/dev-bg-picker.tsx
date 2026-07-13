"use client";

import { useEffect, useState } from "react";

type BgColors = { color1: string; color2: string };
type GradientSettings = BgColors & {
  favorite1: string | null;
  favorite2: string | null;
  favorite3: string | null;
};

const DEFAULT: BgColors = { color1: "#FDFCF8", color2: "#F7F4ED" };
const EMPTY: GradientSettings = {
  ...DEFAULT,
  favorite1: null,
  favorite2: null,
  favorite3: null,
};

function parseFav(json: string | null): BgColors | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as BgColors;
  } catch {
    return null;
  }
}

export function DevBgPicker() {
  const [settings, setSettings] = useState<GradientSettings>(EMPTY);
  const [pending, setPending] = useState<BgColors>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bg-gradient/settings")
      .then((r) => r.json() as Promise<GradientSettings>)
      .then((d) => {
        setSettings(d);
        setPending({ color1: d.color1, color2: d.color2 });
      })
      .catch(() => {});
  }, []);

  async function apiPut(patch: Partial<GradientSettings>) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/bg-gradient/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as GradientSettings & { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Something went wrong.");
        return;
      }
      setSettings(data);
      setPending({ color1: data.color1, color2: data.color2 });
      setMsg("Saved!");
      setTimeout(() => setMsg(null), 2000);
    } finally {
      setSaving(false);
    }
  }

  const favs = [
    parseFav(settings.favorite1),
    parseFav(settings.favorite2),
    parseFav(settings.favorite3),
  ] as const;

  const FAV_KEYS = ["favorite1", "favorite2", "favorite3"] as const;

  return (
    <div className="space-y-6">
      <h3 className="font-medium">
        Test options — affects the whole site&apos;s background gradient immediately.
      </h3>

      {/* Color pickers + large preview */}
      <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
        {/* Left: pickers + buttons */}
        <div className="flex flex-col gap-5">
          <div className="flex gap-6">
            <div className="flex flex-col gap-2">
              <label>Top color</label>
              <input
                type="color"
                value={pending.color1}
                onChange={(e) =>
                  setPending((p) => ({ ...p, color1: e.target.value }))
                }
                className="h-14 w-20 cursor-pointer rounded-lg border border-gray-300"
              />
              <span className="text-center font-mono">{pending.color1}</span>
            </div>
            <div className="flex flex-col gap-2">
              <label>Bottom color</label>
              <input
                type="color"
                value={pending.color2}
                onChange={(e) =>
                  setPending((p) => ({ ...p, color2: e.target.value }))
                }
                className="h-14 w-20 cursor-pointer rounded-lg border border-gray-300"
              />
              <span className="text-center font-mono">{pending.color2}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => apiPut(pending)}
              disabled={saving}
              className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-300 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => apiPut(DEFAULT)}
              disabled={saving}
              className="rounded-md border border-gray-200 px-4 py-2 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Reset to default
            </button>
            {msg && <span className="self-center text-green-700">{msg}</span>}
          </div>
        </div>

        {/* Right: large gradient preview */}
        <div
          className="min-h-40 rounded-xl border border-gray-200"
          style={{
            background: `linear-gradient(to bottom, ${pending.color1} 0%, ${pending.color2} 100%)`,
          }}
        />
      </div>

      {/* Favorites */}
      <div className="grid grid-cols-3 gap-4">
        {([0, 1, 2] as const).map((i) => {
          const fav = favs[i];
          const favKey = FAV_KEYS[i];
          return (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4"
            >
              <p>Favorite {i + 1}</p>
              {fav ? (
                <div
                  className="h-24 w-full rounded-lg border border-gray-100"
                  style={{
                    background: `linear-gradient(to bottom, ${fav.color1} 0%, ${fav.color2} 100%)`,
                  }}
                />
              ) : (
                <div className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-gray-300">
                  empty
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => apiPut({ [favKey]: JSON.stringify(pending) })}
                  disabled={saving}
                  className="flex-1 rounded-md border border-gray-200 py-1.5 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() =>
                    fav && apiPut({ color1: fav.color1, color2: fav.color2 })
                  }
                  disabled={saving || !fav}
                  className="flex-1 rounded-md border border-brand-green-dark/30 py-1.5 text-brand-green-dark transition-colors hover:bg-brand-green-light disabled:opacity-30"
                >
                  Use
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <h3>
        Don&apos;t forget to refresh the page in your browser after saving, to
        see the changes in their full glory!
      </h3>
    </div>
  );
}
