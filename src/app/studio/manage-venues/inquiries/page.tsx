"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Inquiry = {
  id: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  eventType: string;
  requestedDate: string;
  alternativeDate: string | null;
  numberOfPeople: number;
  venues: string;
  equipmentNeeded: string | null;
  meals: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
};

type Comment = {
  id: string;
  inquiryId: string;
  body: string;
  createdAt: number;
};

function CommentsSection({ inquiryId }: { inquiryId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/venues/inquiries/${inquiryId}/comments`)
      .then((r) => r.json() as Promise<Comment[]>)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [inquiryId]);

  async function addComment() {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/venues/inquiries/${inquiryId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const updated = await fetch(
        `/api/venues/inquiries/${inquiryId}/comments`,
      ).then((r) => r.json() as Promise<Comment[]>);
      setComments(updated);
      setBody("");
    } catch {
      // noop
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-gray-100 pt-4">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-600">
        Follow-up
      </p>

      {loading ? (
        <p className="text-sm text-gray-600">Loading…</p>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="rounded-md bg-white px-3 py-2 border border-gray-200">
              <p className="text-sm text-gray-800">{c.body}</p>
              <p className="mt-0.5 text-sm text-gray-600">
                {new Date(c.createdAt).toLocaleString("en-US", {
                  timeZone: "Europe/Stockholm",
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Add a follow-up note…"
          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
        />
        <button
          type="button"
          onClick={addComment}
          disabled={saving || !body.trim()}
          className="self-end rounded-md border border-brand-green-dark bg-white px-3 py-2 text-sm font-semibold text-brand-green-dark hover:bg-brand-green-light disabled:opacity-40 transition-colors"
        >
          {saving ? "…" : "Add"}
        </button>
      </div>
    </div>
  );
}

const statusLabel: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  confirmed: "Confirmed",
  declined: "Declined",
};

const statusColor: Record<string, string> = {
  new: "bg-amber-100 text-amber-700",
  contacted: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  declined: "bg-gray-100 text-gray-600",
};

export default function StudioMotesplatsInquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/venues/inquiries")
      .then((r) => r.json())
      .then((data) => setItems(data as Inquiry[]))
      .catch(() => setError("Could not load inquiries."))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/venues/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <Link
          href="/studio/manage-venues"
          className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors"
        >
          ← Venues
        </Link>
        <h1 className="mt-1">Inquiries</h1>
      </div>

      {error && (
        <p className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-600">No inquiries yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const venues = JSON.parse(item.venues) as string[];
            const isOpen = expanded === item.id;
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
                      {item.name} — {item.organization}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-600 truncate">
                      {item.requestedDate} · {item.numberOfPeople} pers ·{" "}
                      {venues.join(", ")}
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
                        <dt className="font-medium text-gray-700">Email</dt>
                        <dd className="text-gray-600">{item.email}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Phone</dt>
                        <dd className="text-gray-600">{item.phone}</dd>
                      </div>
                      {item.eventType && (
                        <div>
                          <dt className="font-medium text-gray-700">Type</dt>
                          <dd className="text-gray-600">{item.eventType}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="font-medium text-gray-700">Date/time</dt>
                        <dd className="text-gray-600">{item.requestedDate}</dd>
                      </div>
                      {item.alternativeDate && (
                        <div>
                          <dt className="font-medium text-gray-700">
                            Alternative date
                          </dt>
                          <dd className="text-gray-600">
                            {item.alternativeDate}
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="font-medium text-gray-700">Number</dt>
                        <dd className="text-gray-600">
                          {item.numberOfPeople} people
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Venue</dt>
                        <dd className="text-gray-600">{venues.join(", ")}</dd>
                      </div>
                      {item.equipmentNeeded && (
                        <div className="sm:col-span-2">
                          <dt className="font-medium text-gray-700">
                            Equipment needed
                          </dt>
                          <dd className="text-gray-600">
                            {item.equipmentNeeded}
                          </dd>
                        </div>
                      )}
                      {item.meals && (
                        <div>
                          <dt className="font-medium text-gray-700">
                            Meals
                          </dt>
                          <dd className="text-gray-600">{item.meals}</dd>
                        </div>
                      )}
                      {item.notes && (
                        <div className="sm:col-span-2">
                          <dt className="font-medium text-gray-700">Other</dt>
                          <dd className="text-gray-600">{item.notes}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="font-medium text-gray-700">Received</dt>
                        <dd className="text-gray-600">
                          {new Date(item.createdAt).toLocaleString("en-US", {
                            timeZone: "Europe/Stockholm",
                          })}
                        </dd>
                      </div>
                    </dl>

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

                    <CommentsSection inquiryId={item.id} />
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
