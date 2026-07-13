import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireRestaurantAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { restaurantContent } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const DEFAULT_CONTENT = {
  intro: "Welcome to the Demo Folk High School restaurant. We serve home-cooked food made from ingredients sourced from local producers.",
  pricesNote: "",
  defaultMenuFooter: "",
};

export async function GET() {
  try {
    const db = getDb();
    const [row] = await db.select().from(restaurantContent).where(eq(restaurantContent.id, "main")).limit(1);
    return NextResponse.json(row ?? { id: "main", ...DEFAULT_CONTENT });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const access = await requireRestaurantAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as { intro?: string; pricesNote?: string; defaultMenuFooter?: string };
    const db = getDb();
    const now = new Date();

    const [existing] = await db.select().from(restaurantContent).where(eq(restaurantContent.id, "main")).limit(1);

    if (existing) {
      const [updated] = await db
        .update(restaurantContent)
        .set({
          intro: body.intro ?? existing.intro,
          pricesNote: body.pricesNote ?? existing.pricesNote,
          defaultMenuFooter: body.defaultMenuFooter ?? existing.defaultMenuFooter,
          updatedAt: now,
        })
        .where(eq(restaurantContent.id, "main"))
        .returning();
      return NextResponse.json(updated);
    } else {
      const [created] = await db
        .insert(restaurantContent)
        .values({
          id: "main",
          intro: body.intro ?? DEFAULT_CONTENT.intro,
          pricesNote: body.pricesNote ?? DEFAULT_CONTENT.pricesNote,
          defaultMenuFooter: body.defaultMenuFooter ?? DEFAULT_CONTENT.defaultMenuFooter,
          updatedAt: now,
        })
        .returning();
      return NextResponse.json(created);
    }
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
