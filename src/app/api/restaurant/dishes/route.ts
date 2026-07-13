import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { requireRestaurantAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { dish } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const items = await db.select().from(dish).orderBy(asc(dish.name));
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const access = await requireRestaurantAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as {
      name: string;
      description?: string | null;
      allergens?: string | null;
      imageKey?: string | null;
      price?: number | null;
      studentPrice?: number | null;
      vegetarian?: boolean;
      vegan?: boolean;
    };

    const db = getDb();
    const now = new Date();
    const [item] = await db
      .insert(dish)
      .values({
        id: crypto.randomUUID(),
        name: body.name,
        description: body.description ?? null,
        allergens: body.allergens ?? null,
        imageKey: body.imageKey ?? null,
        price: body.price ?? null,
        studentPrice: body.studentPrice ?? null,
        vegetarian: body.vegetarian ?? false,
        vegan: body.vegan ?? false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
