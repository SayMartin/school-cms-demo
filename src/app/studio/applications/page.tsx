"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Attachment = { key: string; name: string; type: string; size: number; fieldId?: string };
type ExtraField = { id: string; label: string; type: string };

type Kurs = { id: string; title: string };
type KursInstans = {
  id: string;
  kursId: string;
  year: number;
  periodType: string;
  week: number | null;
  extraFields: string;
};

type Application = {
  id: string;
  instanceId: string;
  registrationCode: string;
  courseTitle: string;
  schoolsoftId: string | null;
  firstName: string;
  lastName: string;
  personalNumber: string;
  email: string;
  phone: string;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  priorEducation: string | null;
  motivation: string | null;
  extraAnswers: string;
  attachments: string;
  status: string;
  createdAt: string;
};

const PERIOD_TYPE_LABELS: Record<string, string> = {
  spring: "Spring term",
  fall: "Fall term",
  full_year: "Academic year",
  summer: "Summer",
};

function periodLabel(inst: KursInstans): string {
  if (inst.periodType === "full_year") {
    return `Academic year ${inst.year}/${inst.year + 1}`;
  }
  const base = `${PERIOD_TYPE_LABELS[inst.periodType] ?? inst.periodType} ${inst.year}`;
  return inst.week ? `${base}, week ${inst.week}` : base;
}

const statusLabel: Record<string, string> = {
  new: "New",
  reviewing: "Reviewing",
  accepted: "Accepted",
  declined: "Declined",
};

const statusColor: Record<string, string> = {
  new: "bg-amber-100 text-amber-700",
  reviewing: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-gray-100 text-gray-600",
};

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function StudioAnsokningarPage() {
  const [kurser, setKurser] = useState<Kurs[]>([]);
  const [selectedKursId, setSelectedKursId] = useState("");
  const [instanser, setInstanser] = useState<KursInstans[]>([]);
  const [selectedInstansId, setSelectedInstansId] = useState("");
  const [items, setItems] = useState<Application[]>([]);
  const extraFields = useMemo<ExtraField[]>(() => {
    const inst = instanser.find((i) => i.id === selectedInstansId);
    return inst ? safeParse<ExtraField[]>(inst.extraFields, []) : [];
  }, [instanser, selectedInstansId]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => setKurser(data as Kurs[]))
      .catch(() => setError("Could not load courses."));
  }, []);

  useEffect(() => {
    if (!selectedKursId) return;
    fetch(`/api/course-instances?kursId=${encodeURIComponent(selectedKursId)}`)
      .then((r) => r.json())
      .then((data) => setInstanser(data as KursInstans[]))
      .catch(() => setError("Could not load course instances."));
  }, [selectedKursId]);

  useEffect(() => {
    if (!selectedInstansId) return;
    fetch(`/api/applications?instanceId=${encodeURIComponent(selectedInstansId)}`)
      .then((r) => r.json())
      .then((data) => setItems(data as Application[]))
      .catch(() => setError("Could not load applications."))
      .finally(() => setLoading(false));
  }, [selectedInstansId]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    }
  }

  const fieldLabelMap = Object.fromEntries(
    extraFields.map((f) => [f.id, f.label]),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <Link
          href="/studio"
          className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors"
        >
          ← Studio
        </Link>
        <h1 className="mt-1">Received applications</h1>
      </div>

      <div className="mb-8 flex flex-wrap gap-4">
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course
          </label>
          <select
            value={selectedKursId}
            onChange={(e) => setSelectedKursId(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-green focus:outline-none"
          >
            <option value="">Select course…</option>
            {kurser.map((k) => (
              <option key={k.id} value={k.id}>
                {k.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Term
          </label>
          <select
            value={selectedInstansId}
            onChange={(e) => {
              setSelectedInstansId(e.target.value);
              setItems([]);
              setLoading(!!e.target.value);
              setError(null);
            }}
            disabled={instanser.length === 0}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-green focus:outline-none disabled:opacity-50"
          >
            <option value="">Select term…</option>
            {instanser.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {periodLabel(inst)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!selectedInstansId ? (
        <p className="text-gray-600">Select a course and term to see applications.</p>
      ) : loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-600">No applications for the selected term.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            {items.length} {items.length === 1 ? "application" : "applications"}
          </p>
          {items.map((item) => {
            const isOpen = expanded === item.id;
            const extra = safeParse<Record<string, string>>(
              item.extraAnswers,
              {},
            );
            const attachments = safeParse<Attachment[]>(item.attachments, []);
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border bg-gray-100 border-gray-300"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left bg-brand-green-light hover:bg-brand-green/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {item.firstName} {item.lastName}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-600 truncate">
                      {item.courseTitle} · {item.registrationCode}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${statusColor[item.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {statusLabel[item.status] ?? item.status}
                    </span>
                    <svg
                      className={`h-5 w-5 shrink-0 text-brand-green-dark transition-transform duration-300 ease-in-out ${isOpen ? "rotate-90" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50">
                    <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                      <div>
                        <dt className="font-medium text-gray-700">
                          Registration code
                        </dt>
                        <dd className="text-gray-600">
                          {item.registrationCode}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">
                          SchoolSoft-ID
                        </dt>
                        <dd className="text-gray-600">
                          {item.schoolsoftId || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">
                          Personal ID number
                        </dt>
                        <dd className="text-gray-600">{item.personalNumber}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Email</dt>
                        <dd className="text-gray-600">{item.email}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Phone</dt>
                        <dd className="text-gray-600">{item.phone}</dd>
                      </div>
                      {(item.address || item.city) && (
                        <div className="sm:col-span-2">
                          <dt className="font-medium text-gray-700">Address</dt>
                          <dd className="text-gray-600">
                            {[
                              item.address,
                              [item.postalCode, item.city]
                                .filter(Boolean)
                                .join(" "),
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </dd>
                        </div>
                      )}
                      {item.priorEducation && (
                        <div className="sm:col-span-2">
                          <dt className="font-medium text-gray-700">
                            Prior education
                          </dt>
                          <dd className="whitespace-pre-line text-gray-600">
                            {item.priorEducation}
                          </dd>
                        </div>
                      )}
                      {item.motivation && (
                        <div className="sm:col-span-2">
                          <dt className="font-medium text-gray-700">
                            Motivation
                          </dt>
                          <dd className="whitespace-pre-line text-gray-600">
                            {item.motivation}
                          </dd>
                        </div>
                      )}
                      {Object.entries(extra)
                        .filter(([, v]) => v?.trim())
                        .map(([k, v]) => (
                          <div key={k} className="sm:col-span-2">
                            <dt className="font-medium text-gray-700">
                              {fieldLabelMap[k] ?? k}
                            </dt>
                            <dd className="whitespace-pre-line text-gray-600">
                              {v}
                            </dd>
                          </div>
                        ))}
                      <div>
                        <dt className="font-medium text-gray-700">Received</dt>
                        <dd className="text-gray-600">
                          {new Date(item.createdAt).toLocaleString("en-US", {
                            timeZone: "Europe/Stockholm",
                          })}
                        </dd>
                      </div>
                    </dl>

                    {attachments.length > 0 && (() => {
                      const globalFiles = attachments.filter((a) => !a.fieldId);
                      const fieldFiles = attachments.filter((a) => !!a.fieldId);
                      const byField = fieldFiles.reduce<Record<string, Attachment[]>>((acc, a) => {
                        const id = a.fieldId!;
                        acc[id] = [...(acc[id] ?? []), a];
                        return acc;
                      }, {});
                      return (
                        <div className="space-y-3">
                          {Object.entries(byField).map(([fieldId, files]) => (
                            <div key={fieldId}>
                              <p className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-1">
                                {fieldLabelMap[fieldId] ?? fieldId}
                              </p>
                              <ul className="space-y-1 text-sm">
                                {files.map((a) => (
                                  <li key={a.key}>
                                    <a href={`/api/media/${a.key}`} target="_blank" rel="noopener noreferrer" className="text-brand-green-dark hover:underline">
                                      {a.name}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                          {globalFiles.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-1">
                                Attached files
                              </p>
                              <ul className="space-y-1 text-sm">
                                {globalFiles.map((a) => (
                                  <li key={a.key}>
                                    <a href={`/api/media/${a.key}`} target="_blank" rel="noopener noreferrer" className="text-brand-green-dark hover:underline">
                                      {a.name}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-2">
                        Update status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(statusLabel).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => updateStatus(item.id, value)}
                            className={`rounded px-3 py-1 text-sm font-medium border transition-colors ${
                              item.status === value
                                ? "border-brand-green-dark bg-brand-green-dark text-white"
                                : "border-gray-300 text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
