import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { venue } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const items = await db
      .select({
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        description: venue.description,
        category: venue.category,
        capacity: venue.capacity,
        priceInfo: venue.priceInfo,
        availableTo: venue.availableTo,
        features: venue.features,
        imageKey: venue.imageKey,
        sortOrder: venue.sortOrder,
        published: venue.published,
      })
      .from(venue)
      .orderBy(asc(venue.sortOrder));
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as {
      name: string;
      slug: string;
      description: string;
      category?: string | null;
      capacity?: number | null;
      priceInfo?: string | null;
      availableTo?: string;
      features?: string[];
      imageKey?: string | null;
      sortOrder?: number;
      published?: boolean;
    };

    const db = getDb();
    const now = new Date();
    const [item] = await db
      .insert(venue)
      .values({
        id: crypto.randomUUID(),
        name: body.name,
        slug: body.slug,
        description: body.description,
        category: body.category ?? null,
        capacity: body.capacity ?? null,
        priceInfo: body.priceInfo ?? null,
        availableTo: body.availableTo ?? "organizations",
        features: JSON.stringify(body.features ?? []),
        imageKey: body.imageKey ?? null,
        blocks: "[]",
        sortOrder: body.sortOrder ?? 0,
        published: body.published ?? false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    revalidatePath("/venues");
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
