"use client";

import { useState } from "react";
import { DemoBlockedModal } from "@/components/demo-blocked-modal";
import { DemoEmailNotice } from "@/components/demo-email-notice";
import { Button } from "@/components/button";
import { CharCounter } from "@/components/char-counter";
import { TEXT_LIMITS } from "@/lib/text-limits";

type VenueOption = { slug: string; name: string };
type TextFormErrors = Partial<
  Record<
    | "name"
    | "organization"
    | "email"
    | "phone"
    | "eventType"
    | "startDatetime"
    | "endDatetime"
    | "numberOfPeople"
    | "venues"
    | "equipmentNeeded"
    | "meals"
    | "notes",
    string
  >
>;

const inputClass =
  "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark text-sm";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validateForm(
  form: {
    name: string;
    organization: string;
    email: string;
    phone: string;
    eventType: string;
    startDatetime: string;
    endDatetime: string;
    numberOfPeople: string;
    equipmentNeeded: string;
    meals: string;
    notes: string;
  },
  selectedVenues: string[],
): TextFormErrors {
  const errors: TextFormErrors = {};
  if (!form.name.trim())                                    errors.name = "Enter your name.";
  else if (form.name.length > TEXT_LIMITS.name)              errors.name = `Max ${TEXT_LIMITS.name} characters.`;
  if (!form.organization.trim())                             errors.organization = "Enter a company or organization.";
  else if (form.organization.length > TEXT_LIMITS.organization) errors.organization = `Max ${TEXT_LIMITS.organization} characters.`;
  if (!form.email.trim())                                    errors.email = "Enter your email address.";
  else if (!isValidEmail(form.email))                        errors.email = "Enter a valid email address.";
  else if (form.email.length > TEXT_LIMITS.email)            errors.email = `Max ${TEXT_LIMITS.email} characters.`;
  if (!form.phone.trim())                                    errors.phone = "Enter your phone number.";
  else if (form.phone.length > TEXT_LIMITS.phone)            errors.phone = `Max ${TEXT_LIMITS.phone} characters.`;
  if (!form.eventType)                                       errors.eventType = "Select an event type.";
  if (!form.startDatetime)                                   errors.startDatetime = "Enter a start time.";
  if (!form.endDatetime)                                     errors.endDatetime = "Enter an end time.";
  else if (form.startDatetime && new Date(form.endDatetime) <= new Date(form.startDatetime))
                                                             errors.endDatetime = "The end time must be after the start time.";
  const people = parseInt(form.numberOfPeople, 10);
  if (!form.numberOfPeople.trim())                           errors.numberOfPeople = "Enter the number of people.";
  else if (Number.isNaN(people) || people < 1)              errors.numberOfPeople = "Enter at least 1 person.";
  if (selectedVenues.length === 0)                           errors.venues = "Select at least one venue.";
  if (form.equipmentNeeded.length > TEXT_LIMITS.longNote)    errors.equipmentNeeded = `Max ${TEXT_LIMITS.longNote} characters.`;
  if (form.meals.length > TEXT_LIMITS.shortNote)             errors.meals = `Max ${TEXT_LIMITS.shortNote} characters.`;
  if (form.notes.length > TEXT_LIMITS.longNote)              errors.notes = `Max ${TEXT_LIMITS.longNote} characters.`;
  return errors;
}

const EVENT_TYPE_OPTIONS = [
  { value: "meeting", label: "Meeting" },
  { value: "conference", label: "Conference" },
  { value: "event", label: "Event" },
  { value: "course", label: "Course" },
  { value: "other", label: "Other" },
] as const;

export function VenueInquiryForm({
  venues,
  preselectedVenue,
}: {
  venues: VenueOption[];
  preselectedVenue?: string;
}) {
  const [form, setForm] = useState({
    name: "",
    organization: "",
    email: "",
    phone: "",
    eventType: "",
    startDatetime: "",
    endDatetime: "",
    alternativeDate: "",
    numberOfPeople: "",
    equipmentNeeded: "",
    meals: "",
    notes: "",
  });
  const [selectedVenues, setSelectedVenues] = useState<string[]>(
    preselectedVenue ? [preselectedVenue] : []
  );
  const [fieldErrors, setFieldErrors] = useState<TextFormErrors>({});
  const [showDemoBlocked, setShowDemoBlocked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleVenue(name: string) {
    setSelectedVenues((prev) =>
      prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
    );
    if (fieldErrors.venues) setFieldErrors((p) => ({ ...p, venues: undefined }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validateForm(form, selectedVenues);
    // Turnstile verification is temporarily optional (will be enabled before go-live).
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      const fieldCount = Object.keys(errs).length;
      setError(
        `The form isn't complete – ${fieldCount} field(s) need attention. See the red highlights below.`,
      );
      return;
    }
    setFieldErrors({});

    // Portfolio demo: the inquiry is never submitted or stored. The form above
    // still validates so the workflow can be demonstrated, but POST
    // /api/venues/inquiries is blocked by demoLockCheck() regardless of this.
    setShowDemoBlocked(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-brand-green-dark/40 bg-brand-green-dark/10 p-6 text-center">
        <p className="text-lg font-semibold text-gray-900">Thank you for your inquiry!</p>
        <p className="mt-2 text-sm text-gray-600">
          On a live site this is where the confirmation would appear, and the
          booking team would reply with a quote. In this demo nothing was sent or
          stored.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Contact details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
          <input
            required
            maxLength={TEXT_LIMITS.name}
            value={form.name}
            onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined })); }}
            className={`${inputClass} ${fieldErrors.name ? "border-red-400" : ""}`}
          />
          <CharCounter value={form.name} max={TEXT_LIMITS.name} />
          {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Company / Organization <span className="text-red-500">*</span></label>
          <input
            required
            maxLength={TEXT_LIMITS.organization}
            value={form.organization}
            onChange={(e) => { setForm((f) => ({ ...f, organization: e.target.value })); if (fieldErrors.organization) setFieldErrors((p) => ({ ...p, organization: undefined })); }}
            className={`${inputClass} ${fieldErrors.organization ? "border-red-400" : ""}`}
          />
          <CharCounter value={form.organization} max={TEXT_LIMITS.organization} />
          {fieldErrors.organization && <p className="mt-1 text-sm text-red-600">{fieldErrors.organization}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
          <input
            required
            type="email"
            maxLength={TEXT_LIMITS.email}
            value={form.email}
            onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined })); }}
            className={`${inputClass} ${fieldErrors.email ? "border-red-400" : ""}`}
          />
          <CharCounter value={form.email} max={TEXT_LIMITS.email} />
          {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone <span className="text-red-500">*</span></label>
          <input
            required
            type="tel"
            maxLength={TEXT_LIMITS.phone}
            value={form.phone}
            onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value })); if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: undefined })); }}
            className={`${inputClass} ${fieldErrors.phone ? "border-red-400" : ""}`}
          />
          <CharCounter value={form.phone} max={TEXT_LIMITS.phone} />
          {fieldErrors.phone && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>}
        </div>
      </div>

      {/* Event type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Event Type <span className="text-red-500">*</span></label>
        <select required value={form.eventType} onChange={(e) => { setForm((f) => ({ ...f, eventType: e.target.value })); if (fieldErrors.eventType) setFieldErrors((p) => ({ ...p, eventType: undefined })); }} className={`bg-white ${inputClass} ${fieldErrors.eventType ? "border-red-400" : ""}`}>
          <option value="" disabled>Select type…</option>
          {EVENT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {fieldErrors.eventType && <p className="mt-1 text-sm text-red-600">{fieldErrors.eventType}</p>}
      </div>

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Time <span className="text-red-500">*</span></label>
          <input required type="datetime-local" value={form.startDatetime} onChange={(e) => { setForm((f) => ({ ...f, startDatetime: e.target.value })); if (fieldErrors.startDatetime) setFieldErrors((p) => ({ ...p, startDatetime: undefined })); }} className={`${inputClass} ${fieldErrors.startDatetime ? "border-red-400" : ""}`} />
          {fieldErrors.startDatetime && <p className="mt-1 text-sm text-red-600">{fieldErrors.startDatetime}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Time <span className="text-red-500">*</span></label>
          <input required type="datetime-local" value={form.endDatetime} min={form.startDatetime || undefined} onChange={(e) => { setForm((f) => ({ ...f, endDatetime: e.target.value })); if (fieldErrors.endDatetime) setFieldErrors((p) => ({ ...p, endDatetime: undefined })); }} className={`${inputClass} ${fieldErrors.endDatetime ? "border-red-400" : ""}`} />
          {fieldErrors.endDatetime && <p className="mt-1 text-sm text-red-600">{fieldErrors.endDatetime}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Alternative Date</label>
          <input type="datetime-local" value={form.alternativeDate} onChange={(e) => setForm((f) => ({ ...f, alternativeDate: e.target.value }))} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Number of People <span className="text-red-500">*</span></label>
          <input required type="number" min="1" value={form.numberOfPeople} onChange={(e) => { setForm((f) => ({ ...f, numberOfPeople: e.target.value })); if (fieldErrors.numberOfPeople) setFieldErrors((p) => ({ ...p, numberOfPeople: undefined })); }} className={`${inputClass} ${fieldErrors.numberOfPeople ? "border-red-400" : ""}`} />
          {fieldErrors.numberOfPeople && <p className="mt-1 text-sm text-red-600">{fieldErrors.numberOfPeople}</p>}
        </div>
      </div>

      {/* Venue selection */}
      {venues.length > 0 && (
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Venue <span className="text-red-500">*</span>
          </legend>
          {fieldErrors.venues && <p className="mb-2 text-sm text-red-600">{fieldErrors.venues}</p>}
          <div className="flex flex-wrap gap-3">
            {venues.map((v) => (
              <label key={v.slug} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                selectedVenues.includes(v.name)
                  ? "border-brand-green-dark bg-brand-green-dark/10 font-medium text-gray-900"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedVenues.includes(v.name)}
                  onChange={() => toggleVenue(v.name)}
                />
                {v.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Equipment needs */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Equipment Needed</label>
        <textarea
          rows={2}
          placeholder="e.g. Projector, whiteboard, PA system…"
          maxLength={TEXT_LIMITS.longNote}
          value={form.equipmentNeeded}
          onChange={(e) => { setForm((f) => ({ ...f, equipmentNeeded: e.target.value })); if (fieldErrors.equipmentNeeded) setFieldErrors((p) => ({ ...p, equipmentNeeded: undefined })); }}
          className={`${inputClass} ${fieldErrors.equipmentNeeded ? "border-red-400" : ""}`}
        />
        <CharCounter value={form.equipmentNeeded} max={TEXT_LIMITS.longNote} />
        {fieldErrors.equipmentNeeded && <p className="mt-1 text-sm text-red-600">{fieldErrors.equipmentNeeded}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Would you like meals?</label>
        <input
          placeholder="e.g. Coffee/fika, lunch for 20 people"
          maxLength={TEXT_LIMITS.shortNote}
          value={form.meals}
          onChange={(e) => { setForm((f) => ({ ...f, meals: e.target.value })); if (fieldErrors.meals) setFieldErrors((p) => ({ ...p, meals: undefined })); }}
          className={`${inputClass} ${fieldErrors.meals ? "border-red-400" : ""}`}
        />
        <CharCounter value={form.meals} max={TEXT_LIMITS.shortNote} />
        {fieldErrors.meals && <p className="mt-1 text-sm text-red-600">{fieldErrors.meals}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Other</label>
        <textarea
          rows={3}
          maxLength={TEXT_LIMITS.longNote}
          value={form.notes}
          onChange={(e) => { setForm((f) => ({ ...f, notes: e.target.value })); if (fieldErrors.notes) setFieldErrors((p) => ({ ...p, notes: undefined })); }}
          className={`${inputClass} ${fieldErrors.notes ? "border-red-400" : ""}`}
        />
        <CharCounter value={form.notes} max={TEXT_LIMITS.longNote} />
        {fieldErrors.notes && <p className="mt-1 text-sm text-red-600">{fieldErrors.notes}</p>}
      </div>


      <p className="text-sm text-gray-600">
        Nothing is booked until you receive a confirmation from us.
      </p>

      <DemoEmailNotice />

      <Button type="submit">Send Inquiry</Button>

      {showDemoBlocked && (
        <DemoBlockedModal
          title="Nothing was submitted"
          onClose={() => {
            setShowDemoBlocked(false);
            setSubmitted(true);
          }}
        >
          <p>
            This is a portfolio demo. Venue inquiries are never sent or stored here
            — what you typed was discarded rather than saved, and no email went
            anywhere.
          </p>
          <p>Close this to see what the confirmation would look like.</p>
        </DemoBlockedModal>
      )}
    </form>
  );
}
