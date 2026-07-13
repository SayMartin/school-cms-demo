import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireFacilitiesAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { errorReport } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/client";
import { isAssignee, recipientEmail } from "@/lib/felanmalan-recipients";

export const dynamic = "force-dynamic";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const access = await requireFacilitiesAccess(req);
    if (access.response) return access.response;

    const body = (await req.json()) as {
      status?: string;
      assignedTo?: string;
    };

    const patch: Partial<typeof errorReport.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (body.status !== undefined) {
      patch.status = body.status;
      if (body.status === "resolved") patch.resolvedAt = new Date();
    }
    if (body.assignedTo !== undefined) {
      if (!isAssignee(body.assignedTo)) {
        return NextResponse.json(
          { error: "Invalid assignedTo" },
          { status: 400 },
        );
      }
      patch.assignedTo = body.assignedTo;
    }

    const db = getDb();
    const [item] = await db
      .update(errorReport)
      .set(patch)
      .where(eq(errorReport.id, id))
      .returning();

    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Notify the new mailbox when the case is forwarded.
    if (body.assignedTo !== undefined) {
      const { env, ctx } = getCloudflareContext();
      const recipient = recipientEmail(item.assignedTo, env);
      if (recipient) {
        ctx.waitUntil(
          sendEmail({
            to: recipient,
            subject: `Forwarded issue report: ${item.title}`,
            html: `
              <h2>Issue report forwarded to you</h2>
              <p>A case has been forwarded to this mailbox.</p>
              <p><strong>Title:</strong> ${esc(item.title)}</p>
              <p><strong>Category:</strong> ${esc(item.category)}</p>
              <p><strong>Building:</strong> ${esc(item.building)}</p>
              <p><strong>Room:</strong> ${esc(item.room)}</p>
              <p><strong>Description:</strong></p>
              <p>${esc(item.description).replace(/\n/g, "<br>")}</p>
              <hr>
              <p><a href="${env.NEXT_PUBLIC_APP_URL}/facilities/report-issue">Manage issue reports →</a></p>
            `,
          }).catch((err: unknown) => console.error("Email failed:", err)),
        );
      }
    }

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
