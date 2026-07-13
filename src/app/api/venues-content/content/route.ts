import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { venuesContent } from "@/lib/db/schema";
import { requireStudioAccess } from "@/lib/auth/guards";

export async function GET() {
  const db = getDb();
  const [row] = await db
    .select()
    .from(venuesContent)
    .where(eq(venuesContent.id, "main"))
    .limit(1);

  if (!row) return Response.json({ id: "main", blocks: "[]", heading: "", headingVisible: true, headingColor: undefined });
  return Response.json(row);
}

export async function PUT(req: Request) {
  const access = await requireStudioAccess(req);
  if (access.response) return access.response;

  const body = await req.json() as { blocks?: unknown[]; heading: string; headingVisible: boolean; headingColor?: string };

  const db = getDb();
  await db
    .update(venuesContent)
    .set({ blocks: JSON.stringify(Array.isArray(body.blocks) ? body.blocks : []), heading: body.heading, headingVisible: body.headingVisible, headingColor: body.headingColor ?? null })
    .where(eq(venuesContent.id, "main"));

  revalidatePath("/about");
  return Response.json({ ok: true });
}
