import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireRestaurantAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { weeklyMenu, dayMenu, dayMenuItem } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    const db = getDb();
    const items = await db
      .select({
        id: weeklyMenu.id,
        week: weeklyMenu.week,
        year: weeklyMenu.year,
        notes: weeklyMenu.notes,
        published: weeklyMenu.published,
        createdAt: weeklyMenu.createdAt,
      })
      .from(weeklyMenu)
      .orderBy(desc(weeklyMenu.year), desc(weeklyMenu.week));
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
      week: number;
      year: number;
      notes?: string | null;
      footer?: string | null;
      published?: boolean;
      days?: DayInput[];
    };

    const db = getDb();
    const now = new Date();
    const menuId = crypto.randomUUID();

    const [item] = await db
      .insert(weeklyMenu)
      .values({ id: menuId, week: body.week, year: body.year, notes: body.notes ?? null, footer: body.footer ?? null, published: body.published ?? false, createdAt: now, updatedAt: now })
      .returning();

    if (body.days && body.days.length > 0) {
      await replaceDays(menuId, body.days);
    }

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
