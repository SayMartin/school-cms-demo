import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireStudioAccess, requireAdminAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { typographySettings } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type FontSet = { h1Font: string; h2Font: string; h3Font: string; bodyFont: string };

const PRESET1: FontSet = { h1Font: "Geist", h2Font: "Geist", h3Font: "Geist", bodyFont: "Geist" };

const DEFAULT = { ...PRESET1, locked: false, preset2: null, preset3: null };

export async function GET() {
  try {
    const db = getDb();
    const [row] = await db.select().from(typographySettings).where(eq(typographySettings.id, "main")).limit(1);
    return NextResponse.json(row ?? { id: "main", ...DEFAULT });
  } catch {
    return NextResponse.json({ id: "main", ...DEFAULT });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json() as Partial<{
      h1Font: string; h2Font: string; h3Font: string; bodyFont: string;
      locked: boolean;
      saveAsPreset: 2 | 3;
      applyPreset: 1 | 2 | 3;
    }>;

    const isLockToggle  = "locked"        in body;
    const isSavePreset  = "saveAsPreset"  in body;
    const isApplyPreset = "applyPreset"   in body;

    // Lock/unlock always requires admin
    if (isLockToggle) {
      const access = await requireAdminAccess(req);
      if (access.response) return access.response;
    } else {
      const access = await requireStudioAccess(req);
      if (access.response) return access.response;
    }

    const db = getDb();
    const [existing] = await db.select().from(typographySettings).where(eq(typographySettings.id, "main")).limit(1);

    // Block changes when locked (except lock toggle)
    if (!isLockToggle && existing?.locked) {
      return NextResponse.json({ error: "Typography is locked. Unlock it first." }, { status: 403 });
    }

    const now = new Date();
    let patch: Partial<typeof typographySettings.$inferInsert> = {};

    if (isLockToggle) {
      patch = { locked: body.locked };
    } else if (isSavePreset) {
      const fonts: FontSet = {
        h1Font:   body.h1Font   ?? existing?.h1Font   ?? PRESET1.h1Font,
        h2Font:   body.h2Font   ?? existing?.h2Font   ?? PRESET1.h2Font,
        h3Font:   body.h3Font   ?? existing?.h3Font   ?? PRESET1.h3Font,
        bodyFont: body.bodyFont ?? existing?.bodyFont ?? PRESET1.bodyFont,
      };
      patch = body.saveAsPreset === 2
        ? { preset2: JSON.stringify(fonts) }
        : { preset3: JSON.stringify(fonts) };
    } else if (isApplyPreset) {
      if (body.applyPreset === 1) {
        patch = { ...PRESET1 };
      } else {
        const presetJson = body.applyPreset === 2 ? existing?.preset2 : existing?.preset3;
        if (!presetJson) return NextResponse.json({ error: "Preset is missing." }, { status: 400 });
        const fonts = JSON.parse(presetJson) as FontSet;
        patch = { ...fonts };
      }
    } else {
      patch = {
        h1Font:   body.h1Font,
        h2Font:   body.h2Font,
        h3Font:   body.h3Font,
        bodyFont: body.bodyFont,
      };
    }

    if (existing) {
      const [updated] = await db
        .update(typographySettings)
        .set({ ...patch, updatedAt: now })
        .where(eq(typographySettings.id, "main"))
        .returning();
      return NextResponse.json(updated);
    } else {
      const [created] = await db
        .insert(typographySettings)
        .values({ id: "main", ...DEFAULT, ...patch, updatedAt: now })
        .returning();
      return NextResponse.json(created);
    }
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
