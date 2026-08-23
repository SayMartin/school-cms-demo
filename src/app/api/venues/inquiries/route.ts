import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireStudioAccess } from "@/lib/auth/guards";
import { demoLockCheck } from "@/lib/auth/demo-lock";
import { getDb } from "@/lib/db/client";
import { venueInquiry } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/client";
import { TEXT_LIMITS } from "@/lib/text-limits";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const dynamic = "force-dynamic";

const EVENT_TYPE_LABELS: Record<string, string> = {
  meeting: "Meeting",
  conference: "Conference",
  event: "Event",
  course: "Course",
  other: "Other",
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function GET(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const db = getDb();
    const items = await db
      .select()
      .from(venueInquiry)
      .orderBy(desc(venueInquiry.createdAt));
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

// POST — submit a venue inquiry. Disabled in the public demo: the demo Studio
// password is published on /sign-in, so a name, email and phone stored here
// would be readable by any visitor. The form still renders and validates.
export async function POST(req: Request) {
  const locked = demoLockCheck();
  if (locked) return locked;

  try {
    const body = await req.json() as {
      name: string;
      organization: string;
      email: string;
      phone: string;
      eventType?: string;
      requestedDate: string;
      alternativeDate?: string;
      numberOfPeople: number;
      venues: string[];
      equipmentNeeded?: string;
      meals?: string;
      notes?: string;
      turnstileToken?: string;
    };

    const { env, ctx } = getCloudflareContext();
    // Fails closed: a missing token is a failed verification, not a skipped one.
    // (Previously `&& body.turnstileToken` meant any client that simply omitted
    // the token skipped the check entirely, which protected nothing.)
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

    if (!body.name?.trim() || !body.organization?.trim() || !body.email?.trim() || !body.phone?.trim()) {
      return NextResponse.json({ error: "Name, organization, email, and phone are required" }, { status: 400 });
    }
    if (
      body.name.length > TEXT_LIMITS.name ||
      body.organization.length > TEXT_LIMITS.organization ||
      body.email.length > TEXT_LIMITS.email ||
      body.phone.length > TEXT_LIMITS.phone ||
      (body.equipmentNeeded?.length ?? 0) > TEXT_LIMITS.longNote ||
      (body.meals?.length ?? 0) > TEXT_LIMITS.shortNote ||
      (body.notes?.length ?? 0) > TEXT_LIMITS.longNote
    ) {
      return NextResponse.json({ error: "One or more fields are too long" }, { status: 400 });
    }

    const db = getDb();
    const [item] = await db
      .insert(venueInquiry)
      .values({
        id: crypto.randomUUID(),
        name: body.name,
        organization: body.organization,
        email: body.email,
        phone: body.phone,
        eventType: body.eventType ?? "",
        requestedDate: body.requestedDate,
        alternativeDate: body.alternativeDate || null,
        numberOfPeople: body.numberOfPeople,
        venues: JSON.stringify(body.venues ?? []),
        equipmentNeeded: body.equipmentNeeded || null,
        meals: body.meals || null,
        notes: body.notes || null,
        status: "new",
        createdAt: new Date(),
      })
      .returning();

    const venuesList = (body.venues ?? []).map(esc).join(", ");
    const eventTypeLabel = body.eventType
      ? (EVENT_TYPE_LABELS[body.eventType] ?? body.eventType)
      : "—";

    // Summary of the inquiry — reused in both the internal notice and the confirmation copy.
    const summaryRows = `
      <p><strong>Venues:</strong> ${venuesList || "—"}</p>
      <p><strong>Event type:</strong> ${esc(eventTypeLabel)}</p>
      <p><strong>Requested date/time:</strong> ${esc(body.requestedDate)}</p>
      ${body.alternativeDate ? `<p><strong>Alternative date:</strong> ${esc(body.alternativeDate)}</p>` : ""}
      <p><strong>Number of people:</strong> ${body.numberOfPeople}</p>
      ${body.equipmentNeeded ? `<p><strong>Equipment needed:</strong><br>${esc(body.equipmentNeeded).replace(/\n/g, "<br>")}</p>` : ""}
      ${body.meals ? `<p><strong>Catering:</strong> ${esc(body.meals)}</p>` : ""}
      ${body.notes ? `<p><strong>Other:</strong><br>${esc(body.notes).replace(/\n/g, "<br>")}</p>` : ""}`;

    const recipient = env.MOTESPLATS_EMAIL || env.ADMIN_EMAIL;
    if (recipient) {
      ctx.waitUntil(
        sendEmail({
          to: recipient,
          subject: `New venue inquiry: ${body.organization}`,
          html: `
            <h2>New venue inquiry – Venues</h2>
            ${summaryRows}
            <hr>
            <h3>Contact details</h3>
            <p><strong>Name:</strong> ${esc(body.name)}</p>
            <p><strong>Company/organization:</strong> ${esc(body.organization)}</p>
            <p><strong>Email:</strong> <a href="mailto:${esc(body.email)}">${esc(body.email)}</a></p>
            <p><strong>Phone:</strong> ${esc(body.phone)}</p>
            <hr>
            <p><a href="${env.NEXT_PUBLIC_APP_URL}/studio/manage-venues/inquiries">Manage inquiries in Studio →</a></p>
          `,
        }).catch((err: unknown) => console.error("Email failed:", err)),
      );
    }

    // Confirmation copy to the person who sent the inquiry.
    if (isValidEmail(body.email)) {
      ctx.waitUntil(
        sendEmail({
          to: body.email,
          subject: "We've received your inquiry – Venues",
          html: `
            <h2>Thanks for your inquiry!</h2>
            <p>Hi ${esc(body.name)},</p>
            <p>We've received your inquiry about renting a venue with us and will follow up with a quote. <strong>Nothing is booked until you've received a confirmation from us.</strong></p>
            <hr>
            <h3>Your inquiry</h3>
            ${summaryRows}
            <hr>
            <p>Need to add anything or have questions? Email us at <a href="mailto:${recipient}">${recipient}</a> and we'll help you out.</p>
            <p>Best regards,<br>Demo Folk High School</p>
          `,
        }).catch((err: unknown) => console.error("Email failed:", err)),
      );
    }

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
