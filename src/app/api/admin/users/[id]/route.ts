import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { requireAdminAccess } from "@/lib/auth/guards";
import { demoLockCheck } from "@/lib/auth/demo-lock";
import { getDb } from "@/lib/db/client";
import { user, session } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/client";
import { USER_ROLES } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

type Action = "approve" | "reject" | "archive" | "restore" | "change-role";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAdminAccess(request);
  if (access.response) return access.response;
  const locked = demoLockCheck();
  if (locked) return locked;

  const { id } = await params;

  try {
    const body = (await request.json()) as { action: Action; role?: string };
    const { action, role } = body;

    const db = getDb();
    const [target] = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();

    switch (action) {
      case "approve": {
        const newRole = (USER_ROLES.includes(role as UserRole) ? role : "staff") as UserRole;
        await db
          .update(user)
          .set({ status: "active", emailVerified: true, role: newRole, updatedAt: now })
          .where(eq(user.id, id));
        await sendEmail({
          to: target.email,
          subject: "Your account has been approved — Demo Folk High School",
          html: `<p>Hi ${target.name},</p><p>Your account application has been approved. You can now sign in at <a href="/sign-in">Demo Folk High School</a>.</p>`,
        });
        break;
      }

      case "reject": {
        await db
          .update(user)
          .set({ status: "rejected", updatedAt: now })
          .where(eq(user.id, id));
        await sendEmail({
          to: target.email,
          subject: "Regarding your account application — Demo Folk High School",
          html: `<p>Hi ${target.name},</p><p>Unfortunately, your account application has been declined. Contact the school if you have any questions.</p>`,
        });
        break;
      }

      case "archive": {
        if (target.role === "admin") {
          const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(user)
            .where(and(eq(user.role, "admin"), eq(user.status, "active")));
          if (count <= 1) {
            return NextResponse.json(
              { error: "At least one admin account must exist — don't archive the last one." },
              { status: 400 }
            );
          }
        }
        await db
          .update(user)
          .set({ status: "archived", updatedAt: now })
          .where(eq(user.id, id));
        await db.delete(session).where(eq(session.userId, id));
        break;
      }

      case "restore": {
        await db
          .update(user)
          .set({ status: "active", updatedAt: now })
          .where(eq(user.id, id));
        break;
      }

      case "change-role": {
        if (!USER_ROLES.includes(role as UserRole)) {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }
        await db
          .update(user)
          .set({ role: role as UserRole, updatedAt: now })
          .where(eq(user.id, id));
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const [updated] = await db
      .select({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, emailVerified: user.emailVerified, createdAt: user.createdAt })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAdminAccess(request);
  if (access.response) return access.response;
  const locked = demoLockCheck();
  if (locked) return locked;

  const { id } = await params;

  // Prevent self-deletion
  if (id === access.session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  try {
    const db = getDb();
    await db.delete(user).where(eq(user.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
