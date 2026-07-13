import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { courseApplication, courseInstance, course } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/client";
import { TEXT_LIMITS } from "@/lib/text-limits";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { parseApplicationConfig } from "@/lib/application-methods";
import {
  formatPeriodLabel,
  formatRegistrationCode,
  type PeriodType,
} from "@/lib/course-instance";

export const dynamic = "force-dynamic";

type AttachmentInput = {
  key: string;
  name: string;
  type: string;
  size: number;
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

// GET — list applications for Studio admin. ?instanceId= filters.
export async function GET(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const { searchParams } = new URL(req.url);
    const instanceId = searchParams.get("instanceId");
    const db = getDb();

    const items = await db
      .select()
      .from(courseApplication)
      .where(
        instanceId ? eq(courseApplication.instanceId, instanceId) : undefined,
      )
      .orderBy(desc(courseApplication.createdAt));

    return NextResponse.json(items);
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

// POST — submit an application. Public.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      instanceId: string;
      firstName: string;
      lastName: string;
      personalNumber: string;
      email: string;
      phone: string;
      address?: string;
      postalCode?: string;
      city?: string;
      priorEducation?: string;
      motivation?: string;
      extraAnswers?: Record<string, string>;
      attachments?: AttachmentInput[];
      turnstileToken?: string;
    };

    const { env, ctx } = getCloudflareContext();
    // Turnstile verification is temporarily optional — enable it before go-live by
    // requiring a valid token (remove `&& body.turnstileToken`).
    if (env.TURNSTILE_SECRET_KEY && body.turnstileToken) {
      const ip = req.headers.get("CF-Connecting-IP");
      const valid = await verifyTurnstileToken(
        body.turnstileToken,
        env.TURNSTILE_SECRET_KEY,
        ip,
      );
      if (!valid) {
        return NextResponse.json(
          { error: "Verification failed" },
          { status: 400 },
        );
      }
    }

    if (
      !body.instanceId ||
      !body.firstName?.trim() ||
      !body.lastName?.trim() ||
      !body.personalNumber?.trim() ||
      !body.email?.trim() ||
      !body.phone?.trim()
    ) {
      return NextResponse.json(
        { error: "First name, last name, personal ID number, email, and phone are required" },
        { status: 400 },
      );
    }
    if (!isValidEmail(body.email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }
    if (!/^\d{6,8}[-+]?\d{4}$/.test(body.personalNumber.replace(/\s/g, ""))) {
      return NextResponse.json(
        { error: "Invalid personal ID number" },
        { status: 400 },
      );
    }
    if (
      body.firstName.length > TEXT_LIMITS.name ||
      body.lastName.length > TEXT_LIMITS.name ||
      body.personalNumber.length > TEXT_LIMITS.personalNumber ||
      body.email.length > TEXT_LIMITS.email ||
      body.phone.length > TEXT_LIMITS.phone ||
      (body.address?.length ?? 0) > TEXT_LIMITS.address ||
      (body.postalCode?.length ?? 0) > TEXT_LIMITS.postalCode ||
      (body.city?.length ?? 0) > TEXT_LIMITS.city ||
      (body.priorEducation?.length ?? 0) > TEXT_LIMITS.longNote ||
      (body.motivation?.length ?? 0) > TEXT_LIMITS.longNote
    ) {
      return NextResponse.json(
        { error: "One or more fields are too long" },
        { status: 400 },
      );
    }

    const db = getDb();
    const [instance] = await db
      .select({
        id: courseInstance.id,
        year: courseInstance.year,
        periodType: courseInstance.periodType,
        week: courseInstance.week,
        schoolsoftId: courseInstance.schoolsoftId,
        applicationMethods: courseInstance.applicationMethods,
        courseTitle: course.title,
      })
      .from(courseInstance)
      .innerJoin(course, eq(courseInstance.courseId, course.id))
      .where(eq(courseInstance.id, body.instanceId));

    if (!instance) {
      return NextResponse.json(
        { error: "Course instance not found" },
        { status: 400 },
      );
    }
    const config = parseApplicationConfig(instance.applicationMethods);
    if (!config.open || !config.methods.some((m) => m.type === "form")) {
      return NextResponse.json(
        { error: "Form applications are closed for this course" },
        { status: 400 },
      );
    }

    const period = {
      year: instance.year,
      periodType: instance.periodType as PeriodType,
      week: instance.week,
    };
    const registrationCode = formatRegistrationCode(period);
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];

    const [item] = await db
      .insert(courseApplication)
      .values({
        id: crypto.randomUUID(),
        instanceId: instance.id,
        registrationCode,
        courseTitle: instance.courseTitle,
        schoolsoftId: instance.schoolsoftId,
        firstName: body.firstName,
        lastName: body.lastName,
        personalNumber: body.personalNumber,
        email: body.email,
        phone: body.phone,
        address: body.address || null,
        postalCode: body.postalCode || null,
        city: body.city || null,
        priorEducation: body.priorEducation || null,
        motivation: body.motivation || null,
        extraAnswers: JSON.stringify(body.extraAnswers ?? {}),
        attachments: JSON.stringify(attachments),
        status: "new",
        createdAt: new Date(),
      })
      .returning();

    const extraRows = Object.entries(body.extraAnswers ?? {})
      .filter(([, v]) => v?.trim?.())
      .map(
        ([k, v]) =>
          `<p><strong>${esc(k)}:</strong><br>${esc(v).replace(/\n/g, "<br>")}</p>`,
      )
      .join("");
    const attachmentRows = attachments.length
      ? `<p><strong>Attached files (${attachments.length}):</strong></p><ul>${attachments
          .map(
            (a) =>
              `<li><a href="${env.NEXT_PUBLIC_APP_URL}/api/media/${esc(a.key)}">${esc(a.name)}</a></li>`,
          )
          .join("")}</ul>`
      : "";

    const summaryRows = `
      <p><strong>Course:</strong> ${esc(instance.courseTitle)}</p>
      <p><strong>Registration code:</strong> ${esc(registrationCode)} (${esc(formatPeriodLabel(period))})</p>
      ${instance.schoolsoftId ? `<p><strong>SchoolSoft ID:</strong> ${esc(instance.schoolsoftId)}</p>` : ""}
      <hr>
      <p><strong>Name:</strong> ${esc(body.firstName)} ${esc(body.lastName)}</p>
      <p><strong>Personal ID number:</strong> ${esc(body.personalNumber)}</p>
      <p><strong>Email:</strong> <a href="mailto:${esc(body.email)}">${esc(body.email)}</a></p>
      <p><strong>Phone:</strong> ${esc(body.phone)}</p>
      ${body.address ? `<p><strong>Address:</strong> ${esc(body.address)}, ${esc(body.postalCode ?? "")} ${esc(body.city ?? "")}</p>` : ""}
      ${body.priorEducation ? `<p><strong>Prior education:</strong><br>${esc(body.priorEducation).replace(/\n/g, "<br>")}</p>` : ""}
      ${body.motivation ? `<p><strong>Motivation:</strong><br>${esc(body.motivation).replace(/\n/g, "<br>")}</p>` : ""}
      ${extraRows}
      ${attachmentRows}`;

    const recipient = env.ANSOKAN_EMAIL || env.ADMIN_EMAIL;
    if (recipient) {
      ctx.waitUntil(
        sendEmail({
          to: recipient,
          subject: `New application: ${instance.courseTitle} (${registrationCode})`,
          html: `
            <h2>New course application</h2>
            ${summaryRows}
            <hr>
            <p><a href="${env.NEXT_PUBLIC_APP_URL}/studio/applications">Manage applications in Studio →</a></p>
          `,
        }).catch((err: unknown) => console.error("Email failed:", err)),
      );
    }

    // Confirmation copy for the applicant.
    ctx.waitUntil(
      sendEmail({
        to: body.email,
        subject: `We've received your application – ${instance.courseTitle}`,
        html: `
          <h2>Thank you for your application!</h2>
          <p>Hi ${esc(body.firstName)},</p>
          <p>We've received your application for <strong>${esc(instance.courseTitle)}</strong> (${esc(registrationCode)}) and will get back to you. <strong>You are not admitted until you've received confirmation from us.</strong></p>
          <hr>
          <h3>Your application</h3>
          ${summaryRows}
          <hr>
          <p>Have questions? Email us at <a href="mailto:${recipient}">${recipient}</a> and we'll help you out.</p>
          <p>Kind regards,<br>Demo Folk High School</p>
        `,
      }).catch((err: unknown) => console.error("Email failed:", err)),
    );

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
