"use client";

import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/image-upload";
import { RichTextContent } from "@/components/rich-text-content";
import { AccordionBlock } from "@/components/accordion-block";
import { Slideshow } from "@/components/slideshow";
import { DemoEmailNotice } from "@/components/demo-email-notice";
import { DemoBlockedModal } from "@/components/demo-blocked-modal";
import { Button } from "@/components/button";
import { CharCounter } from "@/components/char-counter";
import { YoutubeBlockView } from "@/components/youtube-block-view";
import { VideoBlockView } from "@/components/video-block-view";
import type { ContentBlock } from "@/lib/blocks";
import { parseContentBlocks } from "@/lib/parse-blocks";
import { TEXT_LIMITS } from "@/lib/text-limits";

const BUILDINGS = [
  "Skälderhus",
  "Bender",
  "Bibliotek",
  "Össjö",
  "Axtorp",
  "Tåssjö",
  "Vaktmästarhus",
  "Ryggåsstugan",
  "Other",
];

const categories = [
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing/HVAC (water, heating, ventilation)" },
  { value: "cleaning", label: "Cleaning" },
  { value: "it", label: "IT and technology" },
  { value: "other", label: "Other" },
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

type FormState = {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  title: string;
  description: string;
  building: string;
  room: string;
  allowEntry: boolean;
  category: string;
  priority: string;
  imageKey: string | null;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  senderName: "",
  senderEmail: "",
  senderPhone: "",
  title: "",
  description: "",
  building: "",
  room: "",
  allowEntry: false,
  category: "other",
  priority: "",
  imageKey: null,
};

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.senderName.trim()) errors.senderName = "Enter your name.";
  else if (form.senderName.length > TEXT_LIMITS.name)
    errors.senderName = `Max ${TEXT_LIMITS.name} characters.`;
  if (!form.senderEmail.trim()) errors.senderEmail = "Enter your email address.";
  else if (!isValidEmail(form.senderEmail))
    errors.senderEmail = "Enter a valid email address.";
  else if (form.senderEmail.length > TEXT_LIMITS.email)
    errors.senderEmail = `Max ${TEXT_LIMITS.email} characters.`;
  if (!form.senderPhone.trim()) errors.senderPhone = "Enter your phone number.";
  else if (form.senderPhone.length > TEXT_LIMITS.phone)
    errors.senderPhone = `Max ${TEXT_LIMITS.phone} characters.`;
  if (!form.title.trim()) errors.title = "Enter a title.";
  else if (form.title.length > TEXT_LIMITS.title)
    errors.title = `Max ${TEXT_LIMITS.title} characters.`;
  if (!form.description.trim()) errors.description = "Enter a description.";
  else if (form.description.length > TEXT_LIMITS.description)
    errors.description = `Max ${TEXT_LIMITS.description} characters.`;
  if (!form.building) errors.building = "Select which building this concerns.";
  if (!form.room.trim()) errors.room = "Enter which room this concerns.";
  else if (form.room.length > TEXT_LIMITS.room)
    errors.room = `Max ${TEXT_LIMITS.room} characters.`;
  if (!form.priority) errors.priority = "Select a priority.";
  return errors;
}

function inputCls(hasError: boolean) {
  return `mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-1 ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-300"
      : "border-gray-300 bg-white focus:border-brand-green-dark focus:ring-brand-green-dark"
  }`;
}

function Required() {
  return <span className="ml-0.5 text-red-500">*</span>;
}

export function FelanmalanClient() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [heading, setHeading] = useState("");
  const [headingVisible, setHeadingVisible] = useState(true);
  const [headingColor, setHeadingColor] = useState<string | undefined>(
    undefined,
  );
  const [submitted, setSubmitted] = useState(false);
  const [showDemoBlocked, setShowDemoBlocked] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    fetch("/api/report-issue/content")
      .then(
        (r) =>
          r.json() as Promise<{
            blocks: string;
            heading: string;
            headingVisible: boolean;
            headingColor?: string;
          }>,
      )
      .then((d) => {
        setBlocks(parseContentBlocks(d.blocks ?? "[]"));
        setHeading(d.heading ?? "");
        setHeadingVisible(d.headingVisible ?? true);
        setHeadingColor(d.headingColor);
      })
      .catch(() => {
        /* keep empty */
      });
  }, []);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    // Portfolio demo: the report is never submitted or stored. The form above
    // still validates so the workflow can be demonstrated, but POST
    // /api/report-issue is blocked by demoLockCheck() regardless of this.
    setShowDemoBlocked(true);
  }

  function fieldProps(key: keyof FormState) {
    return {
      value: form[key] as string,
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
      },
    };
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {headingVisible && heading && (
        <h1 style={{ color: headingColor ?? "#111827" }}>{heading}</h1>
      )}

      {/* CMS blocks */}
      {blocks.map((block) => {
        if (block.type === "section")
          return (
            <section key={block.id} className="mt-6">
              {block.headingVisible && block.heading && (
                <h1 style={{ color: block.headingColor ?? "#111827" }}>
                  {block.heading}
                </h1>
              )}
              {block.body && (
                <div
                  className={`${block.headingVisible && block.heading ? "mt-3" : "mt-2"} text-gray-600 leading-relaxed`}
                >
                  <RichTextContent html={block.body} />
                </div>
              )}
            </section>
          );
        if (block.type === "accordion-section")
          return (
            <div key={block.id} className="mt-6">
              <AccordionBlock summary={block.summary}>
                {block.body && (
                  <RichTextContent
                    html={block.body}
                    className="text-gray-600"
                  />
                )}
              </AccordionBlock>
            </div>
          );
        if (block.type === "youtube")
          return (
            <div key={block.id} className="mt-6">
              <YoutubeBlockView block={block} />
            </div>
          );
        if (block.type === "video")
          return (
            <div key={block.id} className="mt-6">
              <VideoBlockView block={block} />
            </div>
          );
        if (block.type === "slideshow")
          return (
            <div key={block.id} className="mt-10">
              <Slideshow block={block} />
            </div>
          );
        return null;
      })}

      {/* Form */}
      {submitted ? (
        <div className="mt-8 rounded-lg border border-brand-green-dark/30 bg-brand-green-light px-6 py-8 text-center">
          <p className="text-xl font-semibold text-gray-900">Thank you!</p>
          <p className="mt-2 text-gray-700">
            On a live site this is where the confirmation would appear, and the
            report would reach the facilities team. In this demo nothing was sent
            or stored.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSubmitted(false)}
            className="mt-6"
          >
            Submit another
          </Button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
            {/* Sender */}
            <fieldset className="space-y-4 rounded-lg border border-gray-200">
              <legend className="px-1 text-sm font-semibold text-gray-700">
                Your details
              </legend>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                  <Required />
                </label>
                <input
                  type="text"
                  placeholder="First and last name"
                  maxLength={TEXT_LIMITS.name}
                  {...fieldProps("senderName")}
                  className={inputCls(!!errors.senderName)}
                />
                <CharCounter value={form.senderName} max={TEXT_LIMITS.name} />
                {errors.senderName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.senderName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                    <Required />
                  </label>
                  <input
                    type="tel"
                    placeholder="070-000 00 00"
                    maxLength={TEXT_LIMITS.phone}
                    {...fieldProps("senderPhone")}
                    className={inputCls(!!errors.senderPhone)}
                  />
                  <CharCounter
                    value={form.senderPhone}
                    max={TEXT_LIMITS.phone}
                  />
                  {errors.senderPhone && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.senderPhone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                    <Required />
                  </label>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    maxLength={TEXT_LIMITS.email}
                    {...fieldProps("senderEmail")}
                    className={inputCls(!!errors.senderEmail)}
                  />
                  <CharCounter
                    value={form.senderEmail}
                    max={TEXT_LIMITS.email}
                  />
                  {errors.senderEmail && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.senderEmail}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
                <Required />
              </label>
              <input
                type="text"
                placeholder="Briefly describe what's wrong"
                maxLength={TEXT_LIMITS.title}
                {...fieldProps("title")}
                className={inputCls(!!errors.title)}
              />
              <CharCounter value={form.title} max={TEXT_LIMITS.title} />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Issue description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Issue description
                <Required />
              </label>
              <textarea
                rows={4}
                placeholder="Describe the issue in more detail…"
                maxLength={TEXT_LIMITS.description}
                {...fieldProps("description")}
                className={inputCls(!!errors.description)}
              />
              <CharCounter
                value={form.description}
                max={TEXT_LIMITS.description}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Building
                  <Required />
                </label>
                <select
                  value={form.building}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, building: e.target.value }));
                    if (errors.building)
                      setErrors((p) => ({ ...p, building: undefined }));
                  }}
                  className={`bg-white ${inputCls(!!errors.building)}`}
                >
                  <option value="" disabled>
                    Select building…
                  </option>
                  {BUILDINGS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {errors.building && (
                  <p className="mt-1 text-sm text-red-600">{errors.building}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Room / area
                  <Required />
                </label>
                <input
                  type="text"
                  placeholder="e.g. room 12, the kitchen, the hallway…"
                  maxLength={TEXT_LIMITS.room}
                  {...fieldProps("room")}
                  className={inputCls(!!errors.room)}
                />
                <CharCounter value={form.room} max={TEXT_LIMITS.room} />
                {errors.room && (
                  <p className="mt-1 text-sm text-red-600">{errors.room}</p>
                )}
              </div>
            </div>

            {/* Access */}
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.allowEntry}
                onChange={(e) =>
                  setForm((f) => ({ ...f, allowEntry: e.target.checked }))
                }
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-green-dark focus:ring-brand-green-dark"
              />
              <span className="text-sm text-gray-700">
                It&apos;s OK to enter the apartment if I&apos;m not home
              </span>
            </label>

            {/* Category + Priority */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  {...fieldProps("category")}
                  className={`bg-white ${inputCls(false)}`}
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Priority
                  <Required />
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, priority: e.target.value }));
                    if (errors.priority)
                      setErrors((p) => ({ ...p, priority: undefined }));
                  }}
                  className={`bg-white ${inputCls(!!errors.priority)}`}
                >
                  <option value="" disabled>
                    Select priority…
                  </option>
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {errors.priority && (
                  <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
                )}
              </div>
            </div>

            <ImageUpload
              value={form.imageKey}
              onChange={(key) => setForm((f) => ({ ...f, imageKey: key }))}
              prefix="felanmalan"
              label="Image (optional)"
              showLibraryPicker={false}
            />

            <p className="text-sm text-gray-600">
              Fields marked with <span className="text-red-500">*</span> are
              required.
            </p>

            <DemoEmailNotice />

            <Button type="submit">Submit report</Button>

            {showDemoBlocked && (
              <DemoBlockedModal
                title="Nothing was submitted"
                onClose={() => {
                  setShowDemoBlocked(false);
                  setSubmitted(true);
                  setForm(EMPTY_FORM);
                }}
              >
                <p>
                  This is a portfolio demo. Maintenance reports are never sent or
                  stored here — what you typed was discarded rather than saved, and
                  no email went anywhere.
                </p>
                <p>Close this to see what the confirmation would look like.</p>
              </DemoBlockedModal>
            )}
          </form>
        </>
      )}
    </div>
  );
}
