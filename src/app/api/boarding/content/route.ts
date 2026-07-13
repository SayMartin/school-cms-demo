import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { boardingContent } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

import type { ContentBlock } from "@/lib/blocks";
import { parseContentBlocks } from "@/lib/parse-blocks";

const DEFAULT_BLOCKS: ContentBlock[] = [
  {
    id: "default-gallery", type: "slideshow", heading: "Photo Gallery", headingVisible: false,
    images: [
      { src: "/internat/rum-1.jpg",      alt: "" },
      { src: "/internat/rum-2.jpg",      alt: "" },
      { src: "/internat/internat-4.jpg", alt: "" },
    ],
  },
];

export async function GET() {
  try {
    const db = getDb();
    const [row] = await db.select().from(boardingContent).where(eq(boardingContent.id, "main")).limit(1);
    const blocks = parseContentBlocks(row?.blocks ?? "[]");
    return NextResponse.json({ blocks: blocks.length ? row!.blocks : JSON.stringify(DEFAULT_BLOCKS), heading: row?.heading ?? "", headingVisible: row?.headingVisible ?? true, headingColor: row?.headingColor ?? undefined });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as { blocks: string; heading: string; headingVisible: boolean; headingColor?: string };
    const db = getDb();
    const now = new Date();

    const [existing] = await db.select().from(boardingContent).where(eq(boardingContent.id, "main")).limit(1);

    if (existing) {
      const [updated] = await db
        .update(boardingContent)
        .set({ blocks: body.blocks, heading: body.heading, headingVisible: body.headingVisible, headingColor: body.headingColor ?? null, updatedAt: now })
        .where(eq(boardingContent.id, "main"))
        .returning();
      revalidatePath("/boarding");
      return NextResponse.json(updated);
    } else {
      const [created] = await db
        .insert(boardingContent)
        .values({ id: "main", blocks: body.blocks ?? JSON.stringify(DEFAULT_BLOCKS), heading: body.heading ?? "", headingVisible: body.headingVisible ?? true, headingColor: body.headingColor ?? null, updatedAt: now })
        .returning();
      revalidatePath("/boarding");
      return NextResponse.json(created);
    }
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
