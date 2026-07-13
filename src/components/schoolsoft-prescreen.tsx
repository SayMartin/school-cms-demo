"use client";

import { useState } from "react";

export type PrescreenField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  required: true;
};

const inputClass =
  "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark text-sm";

export function SchoolSoftPrescreen({
  url,
  label,
  note,
  fields,
}: {
  url: string;
  label?: string;
  note?: string;
  fields: PrescreenField[];
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const allAnswered = fields.every((f) => answers[f.id]?.trim());

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.id}>
          <label className="block text-sm font-medium text-gray-700">
            {f.label} <span className="text-red-500">*</span>
          </label>
          {f.type === "textarea" ? (
            <textarea
              rows={3}
              value={answers[f.id] ?? ""}
              onChange={(e) =>
                setAnswers((p) => ({ ...p, [f.id]: e.target.value }))
              }
              className={inputClass}
            />
          ) : f.type === "select" ? (
            <select
              value={answers[f.id] ?? ""}
              onChange={(e) =>
                setAnswers((p) => ({ ...p, [f.id]: e.target.value }))
              }
              className={`bg-white ${inputClass}`}
            >
              <option value="">Select…</option>
              {(f.options ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={answers[f.id] ?? ""}
              onChange={(e) =>
                setAnswers((p) => ({ ...p, [f.id]: e.target.value }))
              }
              className={inputClass}
            />
          )}
        </div>
      ))}

      <div>
        {allAnswered ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-brand-green-dark bg-brand-green px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-green-dark hover:text-white transition-colors"
          >
            {label ?? "Apply via SchoolSoft"} →
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed"
          >
            {label ?? "Apply via SchoolSoft"} →
          </button>
        )}
        {!allAnswered && (
          <p className="mt-1 text-sm text-gray-600">
            Answer the questions above to continue.
          </p>
        )}
        {note && <p className="mt-1 text-sm text-gray-600">{note}</p>}
      </div>
    </div>
  );
}
