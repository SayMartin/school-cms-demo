import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireRestaurantAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { dish } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const db = getDb();
    const [item] = await db.select().from(dish).where(eq(dish.id, id)).limit(1);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const access = await requireRestaurantAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as {
      name?: string;
      description?: string | null;
      allergens?: string | null;
      imageKey?: string | null;
      price?: number | null;
      studentPrice?: number | null;
      vegetarian?: boolean;
      vegan?: boolean;
    };

    const patch: Partial<typeof dish.$inferInsert> = { updatedAt: new Date() };
    if (body.name !== undefined) patch.name = body.name;
    if (body.description !== undefined) patch.description = body.description;
    if (body.allergens !== undefined) patch.allergens = body.allergens;
    if (body.imageKey !== undefined) patch.imageKey = body.imageKey;
    if (body.price !== undefined) patch.price = body.price;
    if (body.studentPrice !== undefined) patch.studentPrice = body.studentPrice;
    if (body.vegetarian !== undefined) patch.vegetarian = body.vegetarian;
    if (body.vegan !== undefined) patch.vegan = body.vegan;

    const db = getDb();
    const [item] = await db.update(dish).set(patch).where(eq(dish.id, id)).returning();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const access = await requireRestaurantAccess(req);
    if (access.response) return access.response;

    const db = getDb();
    await db.delete(dish).where(eq(dish.id, id));
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
