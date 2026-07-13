"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mediaUrl } from "@/lib/r2/client";
import { Button } from "@/components/button";

type Ticket = {
  id: string;
  title: string;
  description: string;
  building: string;
  room: string;
  allowEntry: boolean;
  category: string;
  priority: string;
  status: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  imageKey: string | null;
  reportedBy: string | null;
  assignedTo: string;
  resolvedAt: number | null;
  createdAt: number;
  updatedAt: number;
  comments: Comment[];
};

type Recipients = { incident: string; facilities: string };

type Comment = {
  id: string;
  reportId: string;
  body: string;
  createdAt: number;
};

type Tab = "open" | "in-progress" | "resolved";

const TAB_LABELS: Record<Tab, string> = {
  open: "Open",
  "in-progress": "In Progress",
  resolved: "Resolved",
};

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "bg-red-100 text-red-700" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
  low: { label: "Low", className: "bg-gray-100 text-gray-600" },
};

const CATEGORY_LABEL: Record<string, string> = {
  electrical: "Electrical",
  plumbing: "Plumbing",
  cleaning: "Cleaning",
  it: "IT",
  other: "Other",
};

function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CommentsSection({
  ticketId,
  initialComments,
}: {
  ticketId: string;
  initialComments: Comment[];
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function addComment() {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/report-issue/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const updated = await fetch(`/api/report-issue/${ticketId}/comments`).then(
        (r) => r.json() as Promise<Comment[]>,
      );
      setComments(updated);
      setBody("");
    } catch {
      // noop
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-600">
        Follow-up
      </p>

      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="rounded-md bg-gray-50 px-3 py-2">
              <p className="text-sm text-gray-800">{c.body}</p>
              <p className="mt-0.5 text-sm text-gray-600">
                {formatDateTime(c.createdAt)}
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
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
        />
        <Button
          variant="outline-green"
          size="sm"
          onClick={addComment}
          disabled={saving || !body.trim()}
          className="self-end"
        >
          {saving ? "…" : "Add"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminFelanmalanPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [recipients, setRecipients] = useState<Recipients | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("open");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/report-issue")
      .then((r) => {
        if (!r.ok) throw new Error("Not authorized");
        return r.json() as Promise<{ items: Ticket[]; recipients: Recipients }>;
      })
      .then((data) => {
        setTickets(data.items);
        setRecipients(data.recipients);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load tickets."),
      )
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/report-issue/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()) as Ticket;
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      // noop
    } finally {
      setUpdating(null);
    }
  }

  async function forward(id: string, assignedTo: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/report-issue/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo }),
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()) as Ticket;
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      // noop
    } finally {
      setUpdating(null);
    }
  }

  const filtered = tickets.filter((t) => t.status === tab);
  const counts: Record<Tab, number> = {
    open: tickets.filter((t) => t.status === "open").length,
    "in-progress": tickets.filter((t) => t.status === "in-progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  if (loading)
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-gray-600">Loading…</div>
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Link
        href="/facilities"
        className="font-semibold uppercase tracking-widest hover:text-brand-green-dark transition-colors"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-1 text-gray-900">Report an Issue</h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Status tabs */}
      <div className="mt-6 flex gap-2">
        {(["open", "in-progress", "resolved"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {TAB_LABELS[t]}
            <span
              className={`ml-1.5 rounded-full px-1.5 py-0.5 text-sm ${tab === t ? "bg-white/20" : "bg-gray-200"}`}
            >
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* Ticket list */}
      <div className="mt-4 space-y-3">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-600">
            No tickets under {TAB_LABELS[tab].toLowerCase()}.
          </p>
        )}
        {filtered.map((ticket) => {
          const priority =
            PRIORITY_BADGE[ticket.priority] ?? PRIORITY_BADGE["medium"];
          const isUpdating = updating === ticket.id;
          return (
            <div
              key={ticket.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${priority.className}`}
                >
                  {priority.label}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm text-gray-600">
                  {CATEGORY_LABEL[ticket.category] ?? ticket.category}
                </span>
                {ticket.allowEntry && (
                  <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-sm text-green-700">
                    OK to enter
                  </span>
                )}
                <span className="ml-auto text-sm text-gray-600">
                  {formatDateTime(ticket.createdAt)}
                </span>
              </div>

              <p className="mt-2 font-semibold text-gray-900">{ticket.title}</p>

              <p className="mt-0.5 text-sm text-gray-600">
                {ticket.building}
                {ticket.room ? ` · ${ticket.room}` : ""}
              </p>

              <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                {ticket.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-600">
                {ticket.senderName && <span>{ticket.senderName}</span>}
                {ticket.senderPhone && <span>{ticket.senderPhone}</span>}
                {ticket.senderEmail && (
                  <a
                    href={`mailto:${ticket.senderEmail}`}
                    className="text-brand-green-dark hover:underline"
                  >
                    {ticket.senderEmail}
                  </a>
                )}
              </div>

              {recipients && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span>
                    Sent to:{" "}
                    <span className="font-medium text-gray-800">
                      {recipients[
                        ticket.assignedTo === "incident"
                          ? "incident"
                          : "facilities"
                      ]}
                    </span>
                  </span>
                  {(() => {
                    const target =
                      ticket.assignedTo === "incident"
                        ? "facilities"
                        : "incident";
                    return (
                      <button
                        disabled={isUpdating}
                        onClick={() => forward(ticket.id, target)}
                        className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Forward to {recipients[target]}
                      </button>
                    );
                  })()}
                </div>
              )}

              {ticket.imageKey && (
                <a
                  href={mediaUrl(ticket.imageKey)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(ticket.imageKey)}
                    alt="Attached image"
                    className="h-24 w-auto rounded-md border border-gray-200 object-cover"
                  />
                </a>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {ticket.status === "open" && (
                  <button
                    disabled={isUpdating}
                    onClick={() => updateStatus(ticket.id, "in-progress")}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Mark in progress
                  </button>
                )}
                {ticket.status === "in-progress" && (
                  <>
                    <button
                      disabled={isUpdating}
                      onClick={() => updateStatus(ticket.id, "resolved")}
                      className="rounded-md bg-brand-green-dark px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-colors"
                    >
                      Mark resolved
                    </button>
                    <button
                      disabled={isUpdating}
                      onClick={() => updateStatus(ticket.id, "open")}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Reopen
                    </button>
                  </>
                )}
                {ticket.status === "resolved" && (
                  <button
                    disabled={isUpdating}
                    onClick={() => updateStatus(ticket.id, "open")}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Reopen
                  </button>
                )}
              </div>

              <CommentsSection ticketId={ticket.id} initialComments={ticket.comments} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
