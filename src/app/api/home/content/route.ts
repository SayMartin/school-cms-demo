import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { homeContent } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const DEFAULT: Omit<typeof homeContent.$inferInsert, "id" | "updatedAt"> = {
  heroIngress: "Folk education for the future — connections and opportunities together",
  whyUsText:
    "<p>Demo Folk High School offers an alternative to traditional adult education. With us, you'll meet dedicated teachers, an inclusive environment, and programs that prepare you for the job market of the future.</p>",
  whyUsHeading: "Why Us?",
  whyUsHeadingVisible: 1,
  blocks: "[]",
};

export async function GET() {
  try {
    const db = getDb();
    const [row] = await db.select().from(homeContent).where(eq(homeContent.id, "main")).limit(1);
    return NextResponse.json(row ?? { id: "main", ...DEFAULT });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as { blocks?: string; heading?: string; headingVisible?: number; headingColor?: string | null; heroIngress?: string; whyUsText?: string; whyUsHeading?: string; whyUsHeadingVisible?: number };
    const db = getDb();
    const now = new Date();

    const [existing] = await db.select().from(homeContent).where(eq(homeContent.id, "main")).limit(1);

    if (existing) {
      const [updated] = await db
        .update(homeContent)
        .set({ ...body, updatedAt: now })
        .where(eq(homeContent.id, "main"))
        .returning();
      revalidatePath("/");
      return NextResponse.json(updated);
    } else {
      const [created] = await db
        .insert(homeContent)
        .values({ id: "main", ...DEFAULT, ...body, updatedAt: now })
        .returning();
      revalidatePath("/");
      return NextResponse.json(created);
    }
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
