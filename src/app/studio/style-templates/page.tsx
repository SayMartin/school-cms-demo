"use client";

import { useEffect, useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { StudioSaveBar } from "@/components/studio-save-bar";
import { authClient } from "@/lib/auth/auth-client";

const FONTS = [
 { value: "Geist", label: "Geist", headingOnly: false },
 { value: "Montserrat", label: "Montserrat", headingOnly: false },
 {
 value: "Montserrat Alternates",
 label: "Montserrat Alternates",
 headingOnly: false,
 },
 {
 value: "Montserrat Underline",
 label: "Montserrat Underline",
 headingOnly: true,
 },
 { value: "Playfair Display", label: "Playfair Display", headingOnly: false },
 {
 value: "Cormorant Garamond",
 label: "Cormorant Garamond",
 headingOnly: false,
 },
 { value: "Josefin Sans", label: "Josefin Sans", headingOnly: false },
 { value: "Raleway", label: "Raleway", headingOnly: false },
 { value: "Space Grotesk", label: "Space Grotesk", headingOnly: false },
 { value: "Lora", label: "Lora", headingOnly: false },
 { value: "Nunito", label: "Nunito", headingOnly: false },
 {
 value: "Libre Baskerville",
 label: "Libre Baskerville",
 headingOnly: false,
 },
 { value: "Germania One", label: "Germania One", headingOnly: true },
 { value: "Concert One", label: "Concert One", headingOnly: true },
 { value: "Merriweather", label: "Merriweather", headingOnly: false },
 { value: "Courgette", label: "Courgette", headingOnly: true },
 { value: "Parisienne", label: "Parisienne", headingOnly: true },
 { value: "Lugrasimo", label: "Lugrasimo", headingOnly: true },
] as const;

type FontValue = (typeof FONTS)[number]["value"];
type FontSet = {
 h1Font: FontValue;
 h2Font: FontValue;
 h3Font: FontValue;
 bodyFont: FontValue;
};
type Settings = FontSet & {
 locked: boolean;
 preset2: string | null;
 preset3: string | null;
};

const PRESET1: FontSet = {
 h1Font: "Geist",
 h2Font: "Geist",
 h3Font: "Geist",
 bodyFont: "Geist",
};
const DEFAULTS: Settings = {
 ...PRESET1,
 locked: false,
 preset2: null,
 preset3: null,
};

const selectClass =
 "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green-dark focus:outline-none disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed";

function fontStyle(name: string): React.CSSProperties {
 return name === "Geist" ? {} : { fontFamily: `'${name}', sans-serif` };
}

function parsePreset(json: string | null): FontSet | null {
 if (!json) return null;
 try {
 return JSON.parse(json) as FontSet;
 } catch {
 return null;
 }
}

function presetLabel(preset: FontSet | null): string {
 if (!preset) return "—";
 const names = [
 ...new Set([preset.h1Font, preset.h2Font, preset.h3Font, preset.bodyFont]),
 ];
 return names.join(" / ");
}

function fontsMatch(a: FontSet | null, b: FontSet | null): boolean {
 if (!a || !b) return false;
 return (
 a.h1Font === b.h1Font &&
 a.h2Font === b.h2Font &&
 a.h3Font === b.h3Font &&
 a.bodyFont === b.bodyFont
 );
}

function FontSelect({
 value,
 onChange,
 headingOnly = false,
 disabled = false,
}: {
 value: FontValue;
 onChange: (v: FontValue) => void;
 headingOnly?: boolean;
 disabled?: boolean;
}) {
 const options = headingOnly ? FONTS : FONTS.filter((f) => !f.headingOnly);
 return (
 <select
 value={value}
 onChange={(e) => onChange(e.target.value as FontValue)}
 disabled={disabled}
 className={selectClass}
 >
 {options.map((f) => (
 <option key={f.value} value={f.value}>
 {f.label}
 {f.headingOnly ? " (heading)" : ""}
 </option>
 ))}
 </select>
 );
}

export default function FormatmallarPage() {
 const [isAdmin, setIsAdmin] = useState(false);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [settings, setSettings] = useState<Settings>(DEFAULTS);
 const [savedSnapshot, setSavedSnapshot] = useState("");

 const fonts: FontSet = {
 h1Font: settings.h1Font,
 h2Font: settings.h2Font,
 h3Font: settings.h3Font,
 bodyFont: settings.bodyFont,
 };
 const isLocked = settings.locked;
 const preset2 = parsePreset(settings.preset2);
 const preset3 = parsePreset(settings.preset3);

 const savedFonts: FontSet | null = savedSnapshot
 ? (JSON.parse(savedSnapshot) as FontSet)
 : null;
 const activePreset: 1 | 2 | 3 | null = fontsMatch(savedFonts, PRESET1)
 ? 1
 : fontsMatch(savedFonts, preset2)
 ? 2
 : fontsMatch(savedFonts, preset3)
 ? 3
 : null;

 useEffect(() => {
 authClient
 .getSession()
 .then((result) => {
 setIsAdmin(
 (result.data?.user as { role?: string } | undefined)?.role ===
 "admin",
 );
 })
 .catch(() => {});
 }, []);

 function syncSettings(d: Settings) {
 setSettings(d);
 const snap: FontSet = {
 h1Font: d.h1Font,
 h2Font: d.h2Font,
 h3Font: d.h3Font,
 bodyFont: d.bodyFont,
 };
 setSavedSnapshot(JSON.stringify(snap));
 }

 useEffect(() => {
 fetch("/api/typography/settings")
 .then((r) => r.json() as Promise<Settings>)
 .then((d) => syncSettings({ ...DEFAULTS, ...d }))
 .catch(() => setError("Could not load typography settings."))
 .finally(() => setLoading(false));
 }, []);

 const isDirtyReal =
 savedSnapshot !== "" && JSON.stringify(fonts) !== savedSnapshot;

 async function apiPut(body: object) {
 setSaving(true);
 setError(null);
 try {
 const res = await fetch("/api/typography/settings", {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(body),
 });
 const data = (await res.json()) as Settings & { error?: string };
 if (!res.ok) {
 setError(data.error ?? "Something went wrong.");
 return;
 }
 syncSettings({ ...DEFAULTS, ...data });
 } finally {
 setSaving(false);
 }
 }

 const save = () => apiPut(fonts);
 const discard = () => {
 const snap = JSON.parse(savedSnapshot) as FontSet;
 setSettings((s) => ({ ...s, ...snap }));
 };
 const toggleLock = () => apiPut({ locked: !isLocked });
 const applyPreset = (n: 1 | 2 | 3) => apiPut({ applyPreset: n });
 const saveAsPreset = (n: 2 | 3) => apiPut({ saveAsPreset: n, ...fonts });

 const lockBar = (
 <div
 className={`flex items-center justify-between gap-4 border-b px-4 py-2.5 ${
 isLocked
 ? "border-amber-200 bg-amber-50"
 : "border-emerald-200 bg-emerald-50"
 }`}
 >
 <span
 className={`flex items-center gap-2.5 font-medium text-sm ${isLocked ? "text-amber-800" : "text-emerald-700"}`}
 >
 {isLocked ? (
 <Lock
 size={20}
 className="shrink-0 text-amber-500"
 strokeWidth={2.5}
 />
 ) : (
 <LockOpen
 size={20}
 className="shrink-0 text-emerald-500"
 strokeWidth={2.5}
 />
 )}
 {isLocked ? "Style templates are locked" : "Style templates are unlocked"}
 {isLocked && !isAdmin && (
 <span className="font-normal text-amber-700">
 — contact the school administrator to unlock
 </span>
 )}
 </span>
 {isAdmin && (
 <button
 onClick={toggleLock}
 disabled={saving}
 className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
 isLocked
 ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
 : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
 }`}
 >
 {isLocked ? (
 <>
 <LockOpen size={18} /> Unlock
 </>
 ) : (
 <>
 <Lock size={18} /> Lock
 </>
 )}
 </button>
 )}
 </div>
 );

 return (
 <div className="mx-auto max-w-7xl px-4 py-8">
 {/* All fonts are loaded here for live preview in the selector below — the public site only loads the actively selected ones (see src/app/layout.tsx). */}
 <StudioSaveBar
 isDirty={isDirtyReal && !isLocked}
 saving={saving}
 error={error}
 onSave={save}
 onDiscard={discard}
 >
 {lockBar}
 </StudioSaveBar>

 <h1 className="mt-6">Style Templates</h1>

 {loading ? (
 <p className="mt-8 text-sm text-gray-600">Loading...</p>
 ) : (
 <div className="mt-8 space-y-10">
 {/* ── Presets ── */}
 <section>
 <h2 className="uppercase tracking-widest text-gray-700 mb-4">
 Presets
 </h2>
 <div className="grid gap-3 sm:grid-cols-3">
 {/* Preset 1 — always Geist */}
 <div className={`rounded-xl border bg-white p-4 flex flex-col gap-3 ${activePreset === 1 ? "border-brand-green-dark ring-2 ring-brand-green-dark/40" : "border-gray-200"}`}>
 <div className="flex items-start justify-between gap-2">
 <div>
 <p className="text-sm font-semibold uppercase tracking-widest text-gray-600">
 Preset 1
 </p>
 <p className="mt-0.5 text-sm font-medium text-gray-800">
 Geist (default)
 </p>
 <p className="text-sm text-gray-600 mt-0.5">
 Original font
 </p>
 </div>
 {activePreset === 1 && (
 <span className="shrink-0 rounded-full bg-brand-green-dark px-2 py-0.5 text-sm font-semibold text-gray-800">
 Currently in use
 </span>
 )}
 </div>
 <button
 onClick={() => applyPreset(1)}
 disabled={saving || isLocked || activePreset === 1}
 className="mt-auto rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
 >
 Revert to preset 1
 </button>
 </div>

 {/* Preset 2 */}
 <div className={`rounded-xl border bg-white p-4 flex flex-col gap-3 ${activePreset === 2 ? "border-brand-green-dark ring-2 ring-brand-green-dark/40" : "border-gray-200"}`}>
 <div className="flex items-start justify-between gap-2">
 <div>
 <p className="text-sm font-semibold uppercase tracking-widest text-gray-600">
 Preset 2
 </p>
 <p className="mt-0.5 text-sm font-medium text-gray-800">
 {presetLabel(preset2)}
 </p>
 <p className="text-sm text-gray-600 mt-0.5">
 {preset2 ? "Saved preset" : "Not saved yet"}
 </p>
 </div>
 {activePreset === 2 && (
 <span className="shrink-0 rounded-full bg-brand-green-dark px-2 py-0.5 text-sm font-semibold text-gray-800">
 Currently in use
 </span>
 )}
 </div>
 <div className="mt-auto flex flex-col gap-1.5">
 <button
 onClick={() => applyPreset(2)}
 disabled={saving || isLocked || !preset2 || activePreset === 2}
 className="rounded-md bg-brand-green-dark/30 px-3 py-1.5 text-sm font-medium text-brand-green-dark hover:bg-brand-green-dark/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
 >
 Use preset 2
 </button>
 <button
 onClick={() => saveAsPreset(2)}
 disabled={saving || isLocked}
 className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
 >
 Save as preset 2
 </button>
 </div>
 </div>

 {/* Preset 3 */}
 <div className={`rounded-xl border bg-white p-4 flex flex-col gap-3 ${activePreset === 3 ? "border-brand-green-dark ring-2 ring-brand-green-dark/40" : "border-gray-200"}`}>
 <div className="flex items-start justify-between gap-2">
 <div>
 <p className="text-sm font-semibold uppercase tracking-widest text-gray-600">
 Preset 3
 </p>
 <p className="mt-0.5 text-sm font-medium text-gray-800">
 {presetLabel(preset3)}
 </p>
 <p className="text-sm text-gray-600 mt-0.5">
 {preset3 ? "Saved preset" : "Not saved yet"}
 </p>
 </div>
 {activePreset === 3 && (
 <span className="shrink-0 rounded-full bg-brand-green-dark px-2 py-0.5 text-sm font-semibold text-gray-800">
 Currently in use
 </span>
 )}
 </div>
 <div className="mt-auto flex flex-col gap-1.5">
 <button
 onClick={() => applyPreset(3)}
 disabled={saving || isLocked || !preset3 || activePreset === 3}
 className="rounded-md bg-brand-pink/40 px-3 py-1.5 text-sm font-medium text-brand-pink-dark hover:bg-brand-pink/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
 >
 Use preset 3
 </button>
 <button
 onClick={() => saveAsPreset(3)}
 disabled={saving || isLocked}
 className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
 >
 Save as preset 3
 </button>
 </div>
 </div>
 </div>
 </section>

 {/* ── Font pickers ── */}
 <section>
 <h2 className="uppercase tracking-widest text-gray-600 mb-4">
 Active Fonts
 </h2>
 <div className="grid gap-8 sm:grid-cols-2">
 {(
 [
 {
 key: "h1Font",
 label: "H1 — Main Heading",
 sample: "Welcome to our school",
 size: "text-3xl",
 },
 {
 key: "h2Font",
 label: "H2 — Subheading",
 sample: "About the program",
 size: "text-2xl",
 },
 {
 key: "h3Font",
 label: "H3 — Section Title",
 sample: "Practical information",
 size: "text-xl",
 },
 {
 key: "bodyFont",
 label: "Body Text",
 sample:
 "Popular education for the future — connections and opportunities together. We offer programs for everyone.",
 size: "text-base",
 },
 ] as const
 ).map(({ key, label, sample, size }) => (
 <div key={key} className="flex flex-col gap-2">
 <label className="text-sm font-medium text-gray-700">
 {label}
 </label>
 <FontSelect
 value={settings[key]}
 onChange={(v) =>
 setSettings((prev) => ({ ...prev, [key]: v }))
 }
 headingOnly={key !== "bodyFont"}
 disabled={isLocked}
 />
 <div
 className={`mt-1 rounded-lg border border-gray-100 bg-white px-4 py-3 ${size} text-gray-800 leading-snug`}
 style={fontStyle(settings[key])}
 >
 {sample}
 </div>
 </div>
 ))}
 </div>
 </section>

 {/* ── Live preview ── */}
 <section>
 <h2 className="uppercase tracking-widest text-gray-600 mb-4">
 Combined Preview
 </h2>
 <div className="rounded-xl border border-gray-200 bg-white px-8 py-8 space-y-4">
 <h1
 className="text-4xl font-bold text-gray-900"
 style={fontStyle(settings.h1Font)}
 >
 Welcome to Demo Folk High School
 </h1>
 <h2
 className="text-2xl font-semibold text-gray-800"
 style={fontStyle(settings.h2Font)}
 >
 Programs for the future
 </h2>
 <h3
 className="text-xl font-medium text-gray-700"
 style={fontStyle(settings.h3Font)}
 >
 About applications and admissions
 </h3>
 <p
 className="text-base text-gray-600 leading-relaxed"
 style={fontStyle(settings.bodyFont)}
 >
 Popular education for the future — connections and opportunities
 together. Demo Folk High School offers a vibrant alternative to
 traditional adult education, with dedicated teachers and an
 inclusive environment where everyone can grow.
 </p>
 </div>
 </section>
 </div>
 )}
 </div>
 );
}
