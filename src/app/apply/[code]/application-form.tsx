"use client";

import { useState } from "react";
import { DemoEmailNotice } from "@/components/demo-email-notice";
import { DemoBlockedModal } from "@/components/demo-blocked-modal";
import { Button } from "@/components/button";
import { CharCounter } from "@/components/char-counter";
import {
  AttachmentUpload,
  type Attachment,
} from "@/components/attachment-upload";
import { TEXT_LIMITS } from "@/lib/text-limits";
import type { ApplicationMethod } from "@/lib/application-methods";

export type ExtraField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "files";
  options?: string[];
  required?: boolean;
  maxFiles?: number;
};

const inputClass =
  "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark text-sm";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

type Errors = Record<string, string>;

export function ApplicationForm({
  extraFields,
  nextStep = null,
}: {
  extraFields: ExtraField[];
  nextStep?: ApplicationMethod | null;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    personalNumber: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
    priorEducation: "",
    motivation: "",
  });
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [filesByField, setFilesByField] = useState<Record<string, Attachment[]>>({});
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Errors>({});
  const [showDemoBlocked, setShowDemoBlocked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((p) => ({ ...p, [field]: "" }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!form.firstName.trim()) e.firstName = "Enter your first name.";
    else if (form.firstName.length > TEXT_LIMITS.name)
      e.firstName = `Max ${TEXT_LIMITS.name} characters.`;
    if (!form.lastName.trim()) e.lastName = "Enter your last name.";
    else if (form.lastName.length > TEXT_LIMITS.name)
      e.lastName = `Max ${TEXT_LIMITS.name} characters.`;
    if (!form.personalNumber.trim())
      e.personalNumber = "Enter your personal ID number.";
    else if (
      !/^\d{6,8}[-+]?\d{4}$/.test(form.personalNumber.replace(/\s/g, ""))
    )
      e.personalNumber = "Enter a valid personal ID number (YYYYMMDD-XXXX).";
    if (!form.email.trim()) e.email = "Enter your email address.";
    else if (!isValidEmail(form.email))
      e.email = "Enter a valid email address.";
    if (!form.phone.trim()) e.phone = "Enter your phone number.";
    else if (form.phone.length > TEXT_LIMITS.phone)
      e.phone = `Max ${TEXT_LIMITS.phone} characters.`;
    for (const f of extraFields) {
      if (f.required) {
        if (f.type === "files") {
          if ((filesByField[f.id] ?? []).length === 0)
            e[`extra_${f.id}`] = "At least one file is required.";
        } else if (!extra[f.id]?.trim()) {
          e[`extra_${f.id}`] = "This field is required.";
        }
      }
    }
    return e;
  }

  function handleSubmit(ev: React.SyntheticEvent<HTMLFormElement>) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(
        `The form isn't complete – ${Object.keys(errs).length} field(s) need attention.`,
      );
      return;
    }
    setFieldErrors({});

    // Portfolio demo: the application is never submitted or stored. The form
    // above still validates so the feature can be demonstrated, but POST
    // /api/applications is blocked by demoLockCheck() regardless of this.
    setShowDemoBlocked(true);
  }

  if (submitted) {
    const nextStepHref = nextStep
      ? nextStep.type === "url" ? nextStep.url
      : nextStep.type === "schoolsoft" ? nextStep.url
      : nextStep.type === "email"
        ? `mailto:${nextStep.email}${nextStep.subject ? `?subject=${encodeURIComponent(nextStep.subject)}` : ""}`
      : null
      : null;
    const nextStepLabel = nextStep
      ? nextStep.type === "url" ? nextStep.label
      : nextStep.type === "schoolsoft" ? (nextStep.label ?? "Register in SchoolSoft")
      : nextStep.type === "email" ? (nextStep.label ?? "Send email")
      : null
      : null;

    return (
      <div className="rounded-lg border border-brand-green-dark/40 bg-brand-green-dark/10 p-6 text-center space-y-4">
        <p className="text-lg font-semibold text-gray-900">Thanks for your application!</p>
        <p className="text-sm text-gray-600">
          On a live site this is where the confirmation would appear, and a copy
          would be emailed to you. In this demo nothing was sent or stored.
        </p>
        {nextStep && nextStepHref && nextStepLabel && (
          <div className="mt-4 rounded-lg border border-brand-green-dark/30 bg-white p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">Next step:</p>
            <a
              href={nextStepHref}
              target={nextStep.type !== "email" ? "_blank" : undefined}
              rel={nextStep.type !== "email" ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 rounded-md border border-brand-green-dark bg-brand-green px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-green-dark hover:text-white transition-colors"
            >
              {nextStepLabel} →
            </a>
            {nextStep.note && <p className="mt-2 text-xs text-gray-500">{nextStep.note}</p>}
          </div>
        )}
        {nextStep?.type === "physical" && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
            <p className="font-medium mb-1">Next step: Paper application</p>
            <p>{nextStep.info}</p>
            {nextStep.note && <p className="mt-1 text-xs text-gray-500">{nextStep.note}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            First name <span className="text-red-500">*</span>
          </label>
          <input
            required
            maxLength={TEXT_LIMITS.name}
            value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            className={`${inputClass} ${fieldErrors.firstName ? "border-red-400" : ""}`}
          />
          {fieldErrors.firstName && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.firstName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Last name <span className="text-red-500">*</span>
          </label>
          <input
            required
            maxLength={TEXT_LIMITS.name}
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            className={`${inputClass} ${fieldErrors.lastName ? "border-red-400" : ""}`}
          />
          {fieldErrors.lastName && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.lastName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Personal ID number <span className="text-red-500">*</span>
          </label>
          <input
            required
            placeholder="YYYYMMDD-XXXX"
            maxLength={TEXT_LIMITS.personalNumber}
            value={form.personalNumber}
            onChange={(e) => set("personalNumber", e.target.value)}
            className={`${inputClass} ${fieldErrors.personalNumber ? "border-red-400" : ""}`}
          />
          {fieldErrors.personalNumber && (
            <p className="mt-1 text-sm text-red-600">
              {fieldErrors.personalNumber}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="email"
            maxLength={TEXT_LIMITS.email}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={`${inputClass} ${fieldErrors.email ? "border-red-400" : ""}`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="tel"
            maxLength={TEXT_LIMITS.phone}
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={`${inputClass} ${fieldErrors.phone ? "border-red-400" : ""}`}
          />
          {fieldErrors.phone && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            maxLength={TEXT_LIMITS.address}
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Postal code
          </label>
          <input
            maxLength={TEXT_LIMITS.postalCode}
            value={form.postalCode}
            onChange={(e) => set("postalCode", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input
            maxLength={TEXT_LIMITS.city}
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Previous education / background
        </label>
        <textarea
          rows={3}
          maxLength={TEXT_LIMITS.longNote}
          value={form.priorEducation}
          onChange={(e) => set("priorEducation", e.target.value)}
          className={inputClass}
        />
        <CharCounter value={form.priorEducation} max={TEXT_LIMITS.longNote} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Motivation – why are you applying for this course?
        </label>
        <textarea
          rows={4}
          maxLength={TEXT_LIMITS.longNote}
          value={form.motivation}
          onChange={(e) => set("motivation", e.target.value)}
          className={inputClass}
        />
        <CharCounter value={form.motivation} max={TEXT_LIMITS.longNote} />
      </div>

      {/* Course-specific extra fields */}
      {extraFields.map((f) => {
        const err = fieldErrors[`extra_${f.id}`];
        const setVal = (value: string) => {
          setExtra((p) => ({ ...p, [f.id]: value }));
          if (err) setFieldErrors((p) => ({ ...p, [`extra_${f.id}`]: "" }));
        };
        return (
          <div key={f.id}>
            <label className="block text-sm font-medium text-gray-700">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            {f.type === "files" ? (
              <AttachmentUpload
                value={filesByField[f.id] ?? []}
                onChange={(files) =>
                  setFilesByField((p) => ({ ...p, [f.id]: files }))
                }
                maxFiles={f.maxFiles ?? 10}
              />
            ) : f.type === "textarea" ? (
              <>
                <textarea
                  rows={3}
                  maxLength={TEXT_LIMITS.longNote}
                  value={extra[f.id] ?? ""}
                  onChange={(e) => setVal(e.target.value)}
                  className={`${inputClass} ${err ? "border-red-400" : ""}`}
                />
                <CharCounter
                  value={extra[f.id] ?? ""}
                  max={TEXT_LIMITS.longNote}
                />
              </>
            ) : f.type === "select" ? (
              <select
                value={extra[f.id] ?? ""}
                onChange={(e) => setVal(e.target.value)}
                className={`bg-white ${inputClass} ${err ? "border-red-400" : ""}`}
              >
                <option value="">Select…</option>
                {(f.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  maxLength={TEXT_LIMITS.shortNote}
                  value={extra[f.id] ?? ""}
                  onChange={(e) => setVal(e.target.value)}
                  className={`${inputClass} ${err ? "border-red-400" : ""}`}
                />
                <CharCounter
                  value={extra[f.id] ?? ""}
                  max={TEXT_LIMITS.shortNote}
                />
              </>
            )}
            {err && <p className="mt-1 text-sm text-red-600">{err}</p>}
          </div>
        );
      })}

      <AttachmentUpload value={attachments} onChange={setAttachments} />

      <p className="text-sm text-gray-600">
        You&apos;re not admitted until you&apos;ve heard back from us.
      </p>

      <DemoEmailNotice />

      <Button type="submit">Submit application</Button>

      {showDemoBlocked && (
        <DemoBlockedModal
          title="Nothing was submitted"
          onClose={() => {
            setShowDemoBlocked(false);
            setSubmitted(true);
          }}
        >
          <p>
            This is a portfolio demo. Course applications are never sent or stored
            here — what you typed, including the identity number, was discarded
            rather than saved, and no email went anywhere. Attachments are refused
            by the server too, so nothing you picked was kept either.
          </p>
          <p>Close this to see what the confirmation would look like.</p>
        </DemoBlockedModal>
      )}
    </form>
  );
}
