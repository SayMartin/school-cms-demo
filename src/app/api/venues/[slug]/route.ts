import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { venue } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const db = getDb();
    const [item] = await db.select().from(venue).where(eq(venue.slug, slug)).limit(1);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as {
      name?: string;
      slug?: string;
      description?: string;
      category?: string | null;
      capacity?: number | null;
      priceInfo?: string | null;
      availableTo?: string;
      features?: string[];
      imageKey?: string | null;
      blocks?: unknown[];
      sortOrder?: number;
      published?: boolean;
      headingColor?: string | null;
    };

    const patch: Partial<typeof venue.$inferInsert> = { updatedAt: new Date() };
    if (body.name !== undefined) patch.name = body.name;
    if (body.slug !== undefined) patch.slug = body.slug;
    if (body.description !== undefined) patch.description = body.description;
    if (body.category !== undefined) patch.category = body.category;
    if (body.capacity !== undefined) patch.capacity = body.capacity;
    if (body.priceInfo !== undefined) patch.priceInfo = body.priceInfo;
    if (body.availableTo !== undefined) patch.availableTo = body.availableTo;
    if (body.features !== undefined) patch.features = JSON.stringify(body.features);
    if (body.imageKey !== undefined) patch.imageKey = body.imageKey;
    if (body.blocks !== undefined) patch.blocks = JSON.stringify(body.blocks);
    if (body.sortOrder !== undefined) patch.sortOrder = body.sortOrder;
    if (body.published !== undefined) patch.published = body.published;
    if (body.headingColor !== undefined) patch.headingColor = body.headingColor ?? null;

    const db = getDb();
    const [item] = await db.update(venue).set(patch).where(eq(venue.slug, slug)).returning();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidatePath("/venues");
    revalidatePath("/venues/[slug]");
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const db = getDb();
    await db.delete(venue).where(eq(venue.slug, slug));
    revalidatePath("/venues");
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
