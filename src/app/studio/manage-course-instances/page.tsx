"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { type ContentBlock, createBlock } from "@/lib/blocks";
import { parseContentBlocks } from "@/lib/parse-blocks";
import { BlockToolbar } from "@/components/block-toolbar";
import { SectionBlockEditor } from "@/components/section-block-editor";
import { AccordionBlockEditor } from "@/components/accordion-block-editor";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import type { ApplicationMethod, ApplicationConfig } from "@/lib/application-methods";
import { parseApplicationConfig, buildSchoolSoftUrl } from "@/lib/application-methods";
import { formatRegistrationCode } from "@/lib/course-instance";
import type { PeriodType } from "@/lib/course-instance";

type Kurs = { id: string; title: string; courseType: string; isArchived: boolean };

type ExtraField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "files";
  options?: string[];
  required?: boolean;
  maxFiles?: number;
};

type Instance = {
  id: string;
  kursId: string;
  slug: string;
  year: number;
  periodType: string;
  week: number | null;
  schoolsoftId: string | null;
  extraFields: string;
  sortOrder: number;
  startDate: Date | null;
  endDate: Date | null;
  spots: number | null;
  applicationMethods: string;
  applicationText: string | null;
  applicationBlocks: string;
  kursTitle: string;
};

const PERIOD_OPTIONS = [
  { value: "spring", label: "Spring term" },
  { value: "fall", label: "Fall term" },
  { value: "full_year", label: "Full year" },
  { value: "summer", label: "Summer" },
] as const;

const METHOD_LABELS: Record<ApplicationMethod["type"], string> = {
  form: "Application Form",
  url: "External Link",
  email: "Email",
  schoolsoft: "SchoolSoft",
  physical: "Paper Application",
};

const FIXED_FORM_FIELDS = [
  "First name *", "Last name *", "National ID *", "Email *", "Phone *",
  "Address", "Postal code", "City", "Previous education / background",
  "Motivation – why are you applying for this course?",
];

function methodSummary(methods: ApplicationMethod[]): string {
  if (methods.length === 0) return "Closed";
  return methods.map((m) => METHOD_LABELS[m.type]).join(" · ");
}

const inputClass =
  "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark text-sm";

type Draft = {
  id: string | null;
  kursId: string;
  year: number;
  periodType: string;
  week: string;
  schoolsoftId: string;
  extraFields: ExtraField[];
  sortOrder: number;
  startDate: string;
  endDate: string;
  spots: string;
  applicationConfig: ApplicationConfig;
  applicationText: string;
  applicationBlocks: ContentBlock[];
};

const emptyDraft = (): Draft => ({
  id: null,
  kursId: "",
  year: new Date().getFullYear(),
  periodType: "spring",
  week: "",
  schoolsoftId: "",
  extraFields: [],
  sortOrder: 0,
  startDate: "",
  endDate: "",
  spots: "",
  applicationConfig: { open: false, mode: "any", methods: [] },
  applicationText: "",
  applicationBlocks: [],
});

function emptyMethod(type: ApplicationMethod["type"]): ApplicationMethod {
  switch (type) {
    case "form": return { type: "form" };
    case "url": return { type: "url", url: "", label: "Apply here" };
    case "email": return { type: "email", email: "", subject: "", label: "Apply by email" };
    case "schoolsoft": return { type: "schoolsoft", url: "" };
    case "physical": return { type: "physical", info: "" };
  }
}

function MethodEditor({
  method,
  index,
  total,
  schoolsoftId,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  extraFields,
  onExtraFieldsChange,
}: {
  method: ApplicationMethod;
  index: number;
  total: number;
  schoolsoftId?: string | null;
  onChange: (m: ApplicationMethod) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  extraFields?: ExtraField[];
  onExtraFieldsChange?: (fields: ExtraField[]) => void;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-700">{METHOD_LABELS[method.type]}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onMoveUp} disabled={index === 0} className="px-1.5 py-0.5 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-30">▲</button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1} className="px-1.5 py-0.5 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-30">▼</button>
          <button type="button" onClick={onRemove} className="ml-1 text-sm text-red-600 hover:text-red-700">Remove</button>
        </div>
      </div>

      {method.type === "url" && (
        <>
          <div>
            <label className="block text-sm text-gray-700">URL</label>
            <input value={method.url} onChange={(e) => onChange({ ...method, url: e.target.value })} placeholder="https://..." className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Button text</label>
            <input value={method.label} onChange={(e) => onChange({ ...method, label: e.target.value })} placeholder="Apply via the municipality" className={inputClass} />
          </div>
        </>
      )}

      {method.type === "email" && (
        <>
          <div>
            <label className="block text-sm text-gray-700">Email address</label>
            <input type="email" value={method.email} onChange={(e) => onChange({ ...method, email: e.target.value })} placeholder="course@example.com" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Subject line (optional)</label>
            <input value={method.subject ?? ""} onChange={(e) => onChange({ ...method, subject: e.target.value })} placeholder="Application – Evening course in ceramics" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Button text (optional)</label>
            <input value={method.label ?? ""} onChange={(e) => onChange({ ...method, label: e.target.value })} placeholder="Apply by email" className={inputClass} />
          </div>
        </>
      )}

      {method.type === "schoolsoft" && (
        <div>
          <label className="block text-sm text-gray-700">SchoolSoft URL</label>
          <input
            value={method.url}
            onChange={(e) => onChange({ ...method, url: e.target.value })}
            placeholder={buildSchoolSoftUrl(schoolsoftId) || "https://sms.schoolsoft.se/fhsk/react/#/login/applicant?application_education_id=…"}
            className={inputClass}
          />
          {schoolsoftId && !method.url && (
            <button
              type="button"
              onClick={() => onChange({ ...method, url: buildSchoolSoftUrl(schoolsoftId) })}
              className="mt-1 text-sm text-brand-green-dark hover:underline"
            >
              ← Fill in from the SchoolSoft ID above ({schoolsoftId})
            </button>
          )}
          {schoolsoftId && method.url && method.url !== buildSchoolSoftUrl(schoolsoftId) && (
            <p className="mt-1 text-sm text-gray-600">
              Auto URL: <span className="font-mono">{buildSchoolSoftUrl(schoolsoftId)}</span>
            </p>
          )}
        </div>
      )}

      {method.type === "physical" && (
        <div>
          <label className="block text-sm text-gray-700">Information</label>
          <input value={method.info} onChange={(e) => onChange({ ...method, info: e.target.value })} placeholder="Pick up the form at the office, Mon–Fri 9–15" className={inputClass} />
        </div>
      )}

      {method.type === "form" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Enables the application form at /apply/{"{slug}"}</p>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Fixed fields (always included)</p>
            <p className="text-sm text-gray-500">{FIXED_FORM_FIELDS.join(" · ")}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Add extra fields</p>
            <div className="space-y-2">
              {(extraFields ?? []).map((f, idx) => (
                <div key={f.id} className="flex flex-wrap items-end gap-2 rounded-md border border-gray-200 bg-gray-50 p-2">
                  <div className="flex-1 min-w-40">
                    <label className="block text-sm text-gray-600">Question text</label>
                    <input value={f.label} onChange={(e) => onExtraFieldsChange?.((extraFields ?? []).map((fi, i) => i === idx ? { ...fi, label: e.target.value } : fi))} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Type</label>
                    <select value={f.type} onChange={(e) => onExtraFieldsChange?.((extraFields ?? []).map((fi, i) => i === idx ? { ...fi, type: e.target.value as ExtraField["type"] } : fi))} className={`bg-white ${inputClass}`}>
                      <option value="text">Short text</option>
                      <option value="textarea">Long text</option>
                      <option value="select">Multiple choice</option>
                      <option value="files">File upload</option>
                    </select>
                  </div>
                  {f.type === "select" && (
                    <div className="flex-1 min-w-40">
                      <label className="block text-sm text-gray-600">Options (comma-separated)</label>
                      <input value={(f.options ?? []).join(",")} onChange={(e) => onExtraFieldsChange?.((extraFields ?? []).map((fi, i) => i === idx ? { ...fi, options: e.target.value.split(",") } : fi))} className={inputClass} />
                    </div>
                  )}
                  {f.type === "files" && (
                    <div className="w-24">
                      <label className="block text-sm text-gray-600">Max number of files</label>
                      <input type="number" min={1} max={20} value={f.maxFiles ?? 10} onChange={(e) => onExtraFieldsChange?.((extraFields ?? []).map((fi, i) => i === idx ? { ...fi, maxFiles: Number(e.target.value) } : fi))} className={inputClass} />
                    </div>
                  )}
                  <label className="flex items-center gap-1 text-sm pb-2">
                    <input type="checkbox" checked={!!f.required} onChange={(e) => onExtraFieldsChange?.((extraFields ?? []).map((fi, i) => i === idx ? { ...fi, required: e.target.checked } : fi))} />
                    Required
                  </label>
                  <button type="button" onClick={() => onExtraFieldsChange?.((extraFields ?? []).filter((_, i) => i !== idx))} className="pb-2 text-sm text-red-600 hover:text-red-700">
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button type="button"
              onClick={() => onExtraFieldsChange?.([...(extraFields ?? []), { id: crypto.randomUUID(), label: "", type: "text" }])}
              className="mt-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors">
              + Add field
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-700">Note (shown under the button, optional)</label>
        <input value={method.note ?? ""} onChange={(e) => onChange({ ...method, note: e.target.value })} placeholder="e.g. Done after you receive confirmation from us — shown as informational text under the button" className={inputClass} />
      </div>
    </div>
  );
}

export default function HanteraKursinstanserPage() {
  const [kurser, setKurser] = useState<Kurs[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  useEffect(() => {
    if (draft?.id) {
      const timer = setTimeout(() => {
        editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [draft?.id]);

  function reload() {
    fetch("/api/course-instances")
      .then((r) => r.json())
      .then((d) => setInstances(d as Instance[]))
      .catch(() => setError("Could not load course instances."));
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/courses").then((r) => r.json()),
      fetch("/api/course-instances").then((r) => r.json()),
    ])
      .then(([k, i]) => {
        setKurser(k as Kurs[]);
        setInstances(i as Instance[]);
      })
      .catch(() => setError("Could not load data."))
      .finally(() => setLoading(false));
  }, []);

  function editInstance(inst: Instance) {
    let extraFields: ExtraField[] = [];
    try { extraFields = JSON.parse(inst.extraFields) as ExtraField[]; } catch { /* empty */ }
    const d: Draft = {
      id: inst.id,
      kursId: inst.kursId,
      year: inst.year,
      periodType: inst.periodType,
      week: inst.week ? String(inst.week) : "",
      schoolsoftId: inst.schoolsoftId ?? "",
      extraFields,
      sortOrder: inst.sortOrder,
      startDate: inst.startDate ? new Date(inst.startDate).toISOString().slice(0, 10) : "",
      endDate: inst.endDate ? new Date(inst.endDate).toISOString().slice(0, 10) : "",
      spots: inst.spots != null ? String(inst.spots) : "",
      applicationConfig: parseApplicationConfig(inst.applicationMethods),
      applicationText: inst.applicationText ?? "",
      applicationBlocks: parseContentBlocks(inst.applicationBlocks),
    };
    setSavedSnapshot(JSON.stringify(d));
    setDraft(d);
  }

  function updateMethod(idx: number, m: ApplicationMethod) {
    if (!draft) return;
    const methods = draft.applicationConfig.methods.map((x, i) => i === idx ? m : x);
    setDraft({ ...draft, applicationConfig: { ...draft.applicationConfig, methods } });
  }

  function removeMethod(idx: number) {
    if (!draft) return;
    const methods = draft.applicationConfig.methods.filter((_, i) => i !== idx);
    setDraft({ ...draft, applicationConfig: { ...draft.applicationConfig, methods } });
  }

  function moveMethod(idx: number, dir: -1 | 1) {
    if (!draft) return;
    const methods = [...draft.applicationConfig.methods];
    const swap = idx + dir;
    if (swap < 0 || swap >= methods.length) return;
    [methods[idx], methods[swap]] = [methods[swap], methods[idx]];
    setDraft({ ...draft, applicationConfig: { ...draft.applicationConfig, methods } });
  }


  async function save() {
    if (!draft) return;
    if (!draft.kursId) { setError("Select a course."); return; }
    setSaving(true);
    setError(null);
    const cleanedFields = draft.extraFields.map((f) =>
      f.type === "select" ? { ...f, options: (f.options ?? []).map((o) => o.trim()).filter(Boolean) } : f,
    );
    const payload = {
      kursId: draft.kursId,
      year: draft.year,
      periodType: draft.periodType,
      week: draft.week ? parseInt(draft.week, 10) : null,
      schoolsoftId: draft.schoolsoftId || null,
      extraFields: JSON.stringify(cleanedFields),
      sortOrder: draft.sortOrder,
      startDate: draft.startDate || null,
      endDate: draft.endDate || null,
      spots: draft.spots !== "" ? Number(draft.spots) : null,
      applicationMethods: JSON.stringify(draft.applicationConfig),
      applicationText: draft.applicationText || null,
      applicationBlocks: JSON.stringify(draft.applicationBlocks),
    };
    try {
      const res = draft.id
        ? await fetch(`/api/course-instances/${draft.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/course-instances", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      setDraft(null);
      reload();
    } catch {
      setError("Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/course-instances/${id}`, { method: "DELETE" });
    if (res.ok) reload();
  }


  function renderDraftForm(inline: boolean) {
    if (!draft) return null;
    return (
      <div
        ref={inline ? editFormRef : undefined}
        className={inline ? "bg-gray-50 p-6 space-y-4" : "mb-8 rounded-xl border border-gray-300 bg-gray-50 p-6 space-y-4"}
      >
        <h2 className="text-lg font-semibold">{draft.id ? "Edit Instance" : "New Instance"}</h2>

        {/* ── Application Methods ── */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-600">Application Methods</p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Order between methods, or free choice</label>
              <select
                value={draft.applicationConfig.mode}
                onChange={(e) => setDraft({ ...draft, applicationConfig: { ...draft.applicationConfig, mode: e.target.value as "any" | "sequence" } })}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
              >
                <option value="any">Applicants may choose freely between methods</option>
                <option value="sequence">Methods are completed in order — one at a time</option>
              </select>
            </div>
          </div>

          {(() => {
            const hasMethods = draft.applicationConfig.methods.length > 0;
            const isOpen = draft.applicationConfig.open;
            const isParentArchived = kurser.find((k) => k.id === draft.kursId)?.isArchived ?? false;
            const canOpen = hasMethods && !isParentArchived;
            return (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!canOpen}
                  onClick={() => {
                    if (!canOpen) return;
                    setDraft({ ...draft, applicationConfig: { ...draft.applicationConfig, open: !isOpen } });
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    isOpen && canOpen ? "bg-brand-green-dark" : "bg-gray-300"
                  } ${!canOpen ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      isOpen && canOpen ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${isOpen && canOpen ? "text-green-700" : "text-gray-600"}`}>
                  {isOpen && canOpen ? "Open for applications" : "Closed"}
                </span>
                {isParentArchived && (
                  <span className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">This course is archived — applications cannot be opened</span>
                )}
                {!isParentArchived && !hasMethods && (
                  <span className="text-sm text-gray-600">— add at least one application method to be able to open</span>
                )}
              </div>
            );
          })()}

          {draft.applicationConfig.mode === "sequence" && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Sequence mode: the applicant is prompted to start with the first method. Subsequent methods are shown greyed out until the previous one is completed.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {(Object.keys(METHOD_LABELS) as ApplicationMethod["type"][]).map((t) => {
              const count = draft.applicationConfig.methods.filter((m) => m.type === t).length;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    if (!draft) return;
                    const methods = [...draft.applicationConfig.methods, emptyMethod(t)];
                    setDraft({ ...draft, applicationConfig: { ...draft.applicationConfig, methods } });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
                >
                  + {METHOD_LABELS[t]}
                  {count > 0 && (
                    <span className="rounded-full bg-brand-green-dark text-white text-xs px-1.5 py-0.5 font-semibold leading-none">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            {draft.applicationConfig.methods.length === 0 && (
              <p className="text-sm text-gray-600 italic">No methods — the instance is shown as closed.</p>
            )}
            {draft.applicationConfig.methods.map((m, idx) => (
              <MethodEditor
                key={idx}
                method={m}
                index={idx}
                total={draft.applicationConfig.methods.length}
                schoolsoftId={draft.schoolsoftId || null}
                onChange={(updated) => updateMethod(idx, updated)}
                onRemove={() => removeMethod(idx)}
                onMoveUp={() => moveMethod(idx, -1)}
                onMoveDown={() => moveMethod(idx, 1)}
                extraFields={m.type === "form" ? draft.extraFields : undefined}
                onExtraFieldsChange={m.type === "form" ? (fields) => setDraft({ ...draft, extraFields: fields }) : undefined}
              />
            ))}
          </div>
        </div>

        {/* ── Application Description (blocks) ── */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-600">Application Description</p>
          <p className="text-sm text-gray-600">Describe how to apply — steps, requirements, selection criteria, contact person. Shown on the course page above the application buttons.</p>
          <div className="space-y-2">
            {draft.applicationBlocks.map((block, idx) => {
              const update = (patch: Partial<ContentBlock>) =>
                setDraft({ ...draft, applicationBlocks: draft.applicationBlocks.map((b, i) => i === idx ? { ...b, ...patch } as ContentBlock : b) });
              const remove = () =>
                setDraft({ ...draft, applicationBlocks: draft.applicationBlocks.filter((_, i) => i !== idx) });
              const move = (dir: -1 | 1) => {
                const next = [...draft.applicationBlocks];
                const swap = idx + dir;
                if (swap < 0 || swap >= next.length) return;
                [next[idx], next[swap]] = [next[swap], next[idx]];
                setDraft({ ...draft, applicationBlocks: next });
              };
              return (
                <div key={block.id} className="rounded-md border border-gray-200 bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {block.type === "section" ? "Section" : "Accordion"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => move(-1)} disabled={idx === 0} className="px-1.5 py-0.5 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-30">▲</button>
                      <button type="button" onClick={() => move(1)} disabled={idx === draft.applicationBlocks.length - 1} className="px-1.5 py-0.5 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-30">▼</button>
                      <button type="button" onClick={remove} className="ml-1 text-sm text-red-600 hover:text-red-700">Remove</button>
                    </div>
                  </div>
                  {block.type === "section" && (
                    <SectionBlockEditor block={block} onChange={update} />
                  )}
                  {block.type === "accordion-section" && (
                    <AccordionBlockEditor block={block} onChange={update} />
                  )}
                </div>
              );
            })}
          </div>
          <BlockToolbar
            types={["section", "accordion-section"] as ContentBlock["type"][]}
            onAdd={(type) => setDraft({ ...draft, applicationBlocks: [...draft.applicationBlocks, createBlock(type)] })}
          />
        </div>

        {/* ── Application Form ── */}
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-600">Default Information</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Course</label>
              <select value={draft.kursId} onChange={(e) => setDraft({ ...draft, kursId: e.target.value })} className={`bg-white ${inputClass}`}>
                <option value="">Select course…</option>
                {kurser.map((k) => <option key={k.id} value={k.id}>{k.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Intake Year</label>
              <input type="number" value={draft.year}
                onChange={(e) => setDraft({ ...draft, year: parseInt(e.target.value, 10) || draft.year })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Period</label>
              <select value={draft.periodType} onChange={(e) => setDraft({ ...draft, periodType: e.target.value })} className={`bg-white ${inputClass}`}>
                {PERIOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Week (optional)</label>
              <input type="number" value={draft.week} onChange={(e) => setDraft({ ...draft, week: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">SchoolSoft ID</label>
              <input value={draft.schoolsoftId} onChange={(e) => setDraft({ ...draft, schoolsoftId: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sort Order</label>
              <input type="number" value={draft.sortOrder}
                onChange={(e) => setDraft({ ...draft, sortOrder: parseInt(e.target.value, 10) || 0 })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Number of Spots</label>
              <input type="number" min="1" value={draft.spots} onChange={(e) => setDraft({ ...draft, spots: e.target.value })} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">General Info / Info When Closed</label>
              <input value={draft.applicationText}
                onChange={(e) => setDraft({ ...draft, applicationText: e.target.value })}
                placeholder="e.g. Next course start: fall 2026"
                className={inputClass} />
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Registration code: <strong>{formatRegistrationCode({ year: draft.year, periodType: draft.periodType as PeriodType, week: draft.week ? parseInt(draft.week, 10) : null })}</strong>
          </p>
        </div>

        <div className="flex gap-2 border-t border-gray-200 pt-4">
          <button type="button" onClick={save}
            disabled={saving || (savedSnapshot !== null && JSON.stringify(draft) === savedSnapshot)}
            className="rounded-md bg-brand-green-dark px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => setDraft(null)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/studio" className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors">
            ← Studio
          </Link>
          <h1 className="mt-1">Course Instances &amp; Applications</h1>
        </div>
        {!draft && (
          <button type="button" onClick={() => { setSavedSnapshot(null); setDraft(emptyDraft()); }}
            className="rounded-md bg-brand-green-dark px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
            + New Instance
          </button>
        )}
      </div>

      {error && <p className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* New instance form is shown at the top */}
      {draft && draft.id === null && renderDraftForm(false)}

      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : instances.length === 0 ? (
        <p className="text-gray-600">No course instances yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Course</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">SchoolSoft</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Application Method</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-green">
              {instances.map((inst) => {
                const config = parseApplicationConfig(inst.applicationMethods);
                return (
                  <Fragment key={inst.id}>
                    <tr className="bg-brand-pink-light hover:bg-brand-pink transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <span>{inst.kursTitle}</span>
                        {kurser.find((k) => k.id === inst.kursId)?.isArchived && (
                          <span className="ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700">Archived</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatRegistrationCode({ year: inst.year, periodType: inst.periodType as PeriodType, week: inst.week })}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {inst.schoolsoftId
                          ? <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-blue-700">{inst.schoolsoftId}</span>
                          : <span className="text-gray-400">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {config.methods.length > 0 ? methodSummary(config.methods) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-sm font-semibold ${
                          config.open && config.methods.length > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {config.open && config.methods.length > 0
                            ? (config.mode === "sequence" ? "Open · Sequence" : "Open")
                            : "Closed"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Link href={`/apply/${inst.slug}`} target="_blank" className="inline-flex items-center rounded px-3 py-1 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                            View Form
                          </Link>
                          <button type="button" onClick={() => editInstance(inst)} className="inline-flex items-center rounded px-3 py-1 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                            Edit
                          </button>
                          <ConfirmDeleteButton
                            onConfirm={() => remove(inst.id)}
                            label="Remove"
                            message="Remove this course instance and all its applications?"
                            locked={false}
                          />
                        </div>
                      </td>
                    </tr>
                    {draft?.id === inst.id && (
                      <tr>
                        <td colSpan={6} className="p-0 border-t border-gray-200">
                          {renderDraftForm(true)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
