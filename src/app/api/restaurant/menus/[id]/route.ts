import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { requireRestaurantAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { weeklyMenu, dayMenu, dayMenuItem, dish } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

type DayInput = {
  day: number;
  closed: boolean;
  items: { dishId: string; sortOrder: number }[];
};

async function replaceDays(menuId: string, days: DayInput[]) {
  const db = getDb();
  await db.delete(dayMenu).where(eq(dayMenu.weeklyMenuId, menuId));
  for (const d of days) {
    const dayId = crypto.randomUUID();
    await db.insert(dayMenu).values({ id: dayId, weeklyMenuId: menuId, day: d.day, closed: d.closed });
    for (const it of d.items) {
      await db.insert(dayMenuItem).values({ id: crypto.randomUUID(), dayMenuId: dayId, dishId: it.dishId, sortOrder: it.sortOrder });
    }
  }
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const db = getDb();
    const [menu] = await db.select().from(weeklyMenu).where(eq(weeklyMenu.id, id)).limit(1);
    if (!menu) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const days = await db
      .select({ id: dayMenu.id, day: dayMenu.day, closed: dayMenu.closed })
      .from(dayMenu)
      .where(eq(dayMenu.weeklyMenuId, id))
      .orderBy(asc(dayMenu.day));

    const daysWithItems = await Promise.all(
      days.map(async (d) => {
        const items = await db
          .select({
            id: dayMenuItem.id,
            sortOrder: dayMenuItem.sortOrder,
            dishId: dayMenuItem.dishId,
            dishName: dish.name,
            dishDescription: dish.description,
            allergens: dish.allergens,
            price: dish.price,
            studentPrice: dish.studentPrice,
            vegetarian: dish.vegetarian,
            vegan: dish.vegan,
            imageKey: dish.imageKey,
          })
          .from(dayMenuItem)
          .leftJoin(dish, eq(dayMenuItem.dishId, dish.id))
          .where(eq(dayMenuItem.dayMenuId, d.id))
          .orderBy(asc(dayMenuItem.sortOrder));
        return { ...d, items };
      })
    );

    return NextResponse.json({ ...menu, days: daysWithItems });
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
      week?: number;
      year?: number;
      notes?: string | null;
      footer?: string | null;
      published?: boolean;
      days?: DayInput[];
    };

    const patch: Partial<typeof weeklyMenu.$inferInsert> = { updatedAt: new Date() };
    if (body.week !== undefined) patch.week = body.week;
    if (body.year !== undefined) patch.year = body.year;
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.footer !== undefined) patch.footer = body.footer;
    if (body.published !== undefined) patch.published = body.published;

    const db = getDb();
    const [item] = await db.update(weeklyMenu).set(patch).where(eq(weeklyMenu.id, id)).returning();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.days !== undefined) {
      await replaceDays(id, body.days);
    }

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
    await db.delete(weeklyMenu).where(eq(weeklyMenu.id, id));
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
