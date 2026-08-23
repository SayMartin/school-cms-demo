import { NextResponse } from "next/server";
import { asc, desc } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireFacilitiesAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { errorReport, errorReportComment } from "@/lib/db/schema";
import { demoLockCheck } from "@/lib/auth/demo-lock";
import { sendEmail } from "@/lib/email/client";
import { recipientEmail } from "@/lib/felanmalan-recipients";
import { TEXT_LIMITS } from "@/lib/text-limits";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const dynamic = "force-dynamic";

const VALID_PRIORITIES = ["low", "medium", "high"] as const;

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET(req: Request) {
  try {
    const access = await requireFacilitiesAccess(req);
    if (access.response) return access.response;

    const db = getDb();
    const reports = await db
      .select()
      .from(errorReport)
      .orderBy(desc(errorReport.createdAt));

    // Fetch all comments in one call and group them by case, so the
    // client doesn't have to fire an auth-protected call per case.
    const comments = await db
      .select()
      .from(errorReportComment)
      .orderBy(asc(errorReportComment.createdAt));
    const commentsByReport = new Map<string, typeof comments>();
    for (const c of comments) {
      const list = commentsByReport.get(c.reportId);
      if (list) list.push(c);
      else commentsByReport.set(c.reportId, [c]);
    }
    const items = reports.map((r) => ({
      ...r,
      comments: commentsByReport.get(r.id) ?? [],
    }));

    const { env } = getCloudflareContext();
    const recipients = {
      incident: recipientEmail("incident", env),
      facilities: recipientEmail("facilities", env),
    };
    return NextResponse.json({ items, recipients });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

// POST — submit a maintenance report. Disabled in the public demo for the same
// reason as venue inquiries: the reporter's name, email and phone would land in
// a database anyone can read with the published demo login.
export async function POST(req: Request) {
  const locked = demoLockCheck();
  if (locked) return locked;

  try {
    const body = (await req.json()) as {
      title: string;
      description: string;
      building?: string;
      room?: string;
      allowEntry?: boolean;
      category?: string;
      priority?: string;
      senderName?: string;
      senderEmail?: string;
      senderPhone?: string;
      imageKey?: string | null;
      userId?: string | null;
      turnstileToken?: string;
    };

    const { env, ctx } = getCloudflareContext();
    if (env.TURNSTILE_SECRET_KEY) {
      const ip = req.headers.get("CF-Connecting-IP");
      const valid = body.turnstileToken
        ? await verifyTurnstileToken(
            body.turnstileToken,
            env.TURNSTILE_SECRET_KEY,
            ip,
          )
        : false;
      if (!valid) {
        return NextResponse.json(
          { error: "Verification failed" },
          { status: 400 },
        );
      }
    }

    if (!body.title?.trim() || !body.description?.trim()) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 },
      );
    }
    if (!body.building?.trim()) {
      return NextResponse.json({ error: "Building is required" }, { status: 400 });
    }
    if (!body.room?.trim()) {
      return NextResponse.json({ error: "Room is required" }, { status: 400 });
    }
    if (!body.senderName?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.senderEmail?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!body.senderPhone?.trim()) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }
    if (
      body.title.length > TEXT_LIMITS.title ||
      body.description.length > TEXT_LIMITS.description ||
      body.room.length > TEXT_LIMITS.room ||
      body.senderName.length > TEXT_LIMITS.name ||
      body.senderEmail.length > TEXT_LIMITS.email ||
      body.senderPhone.length > TEXT_LIMITS.phone
    ) {
      return NextResponse.json(
        { error: "One or more fields are too long" },
        { status: 400 },
      );
    }

    const priority = VALID_PRIORITIES.includes(
      body.priority as (typeof VALID_PRIORITIES)[number],
    )
      ? (body.priority as string)
      : "medium";

    // IT cases → the incident mailbox; other categories (electrical, plumbing,
    // cleaning, other) are facilities cases → the facilities mailbox.
    const assignedTo = body.category === "it" ? "incident" : "facilities";

    const db = getDb();
    const now = new Date();
    const id = crypto.randomUUID();

    await db.insert(errorReport).values({
      id,
      title: body.title.trim(),
      description: body.description.trim(),
      building: body.building.trim(),
      room: body.room.trim(),
      allowEntry: body.allowEntry ?? false,
      category: body.category ?? "other",
      priority,
      senderName: body.senderName.trim(),
      senderEmail: body.senderEmail.trim(),
      senderPhone: body.senderPhone.trim(),
      imageKey: body.imageKey ?? null,
      reportedBy: body.userId ?? null,
      status: "open",
      assignedTo,
      createdAt: now,
      updatedAt: now,
    });

    // Trimmed, escaped values for the email.
    const title = esc(body.title.trim());
    const description = esc(body.description.trim()).replace(/\n/g, "<br>");
    const building = esc(body.building.trim());
    const room = esc(body.room.trim());
    const category = esc(body.category ?? "other");
    const senderName = esc(body.senderName.trim());
    const senderEmail = esc(body.senderEmail.trim());
    const senderPhone = esc(body.senderPhone.trim());
    const priorityLabel =
      priority === "high"
        ? "🔴 High"
        : priority === "medium"
          ? "🟡 Medium"
          : "⚪ Low";

    // Case details — reused in both the internal notice and the confirmation copy.
    const detailRows = `
      <p><strong>Title:</strong> ${title}</p>
      <p><strong>Priority:</strong> ${priorityLabel}</p>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>Building:</strong> ${building}</p>
      <p><strong>Room:</strong> ${room}</p>
      ${body.allowEntry ? `<p><strong>✅ OK to enter the apartment</strong></p>` : ""}
      <p><strong>Description:</strong></p>
      <p>${description}</p>`;

    // Resolve mailbox → email address. ADMIN_EMAIL as fallback if not set.
    const recipient = recipientEmail(assignedTo, env);

    if (recipient) {
      ctx.waitUntil(
        sendEmail({
          to: recipient,
          subject: `New issue report [${priority.toUpperCase()}]: ${body.title.trim()}`,
          html: `
            <h2>New issue report</h2>
            ${detailRows}
            <hr>
            <h3>Sender</h3>
            <p><strong>Name:</strong> ${senderName}</p>
            <p><strong>Email:</strong> <a href="mailto:${senderEmail}">${senderEmail}</a></p>
            <p><strong>Phone:</strong> ${senderPhone}</p>
            <hr>
            <p><a href="${env.NEXT_PUBLIC_APP_URL}/facilities/report-issue">Manage issue reports →</a></p>
          `,
        }).catch((err: unknown) => console.error("Email failed:", err)),
      );
    }

    // Confirmation copy to the person who submitted the report.
    if (isValidEmail(body.senderEmail.trim())) {
      ctx.waitUntil(
        sendEmail({
          to: body.senderEmail.trim(),
          subject: "We've received your issue report – Demo Folk High School",
          html: `
            <h2>Thanks for your report!</h2>
            <p>Hi ${senderName},</p>
            <p>We've received your issue report and will handle it as soon as we can.</p>
            <hr>
            <h3>Your report</h3>
            ${detailRows}
            <hr>
            <p>Have questions or want to add something? Email us at <a href="mailto:${recipient}">${recipient}</a>.</p>
            <p>Best regards,<br>Demo Folk High School</p>
          `,
        }).catch((err: unknown) => console.error("Email failed:", err)),
      );
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
