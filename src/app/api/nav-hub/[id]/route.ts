import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { navHubContent } from "@/lib/db/schema";
import { requireStudioAccess } from "@/lib/auth/guards";

const VALID_IDS = ["deltagarinfo", "om-skolan", "skolan", "utbildningar", "kortkurser"] as const;

const HUB_PUBLIC_PATH: Record<string, string> = {
  "deltagarinfo":  "/participant-info",
  "om-skolan":     "/about-redirect",
  "skolan":        "/about",
  "utbildningar":  "/education-programs",
  "kortkurser":    "/short-courses",
};
type HubId = (typeof VALID_IDS)[number];

function isValidId(id: string): id is HubId {
  return (VALID_IDS as readonly string[]).includes(id);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isValidId(id)) return Response.json({ error: "Not found" }, { status: 404 });

  const db = getDb();
  const [row] = await db
    .select()
    .from(navHubContent)
    .where(eq(navHubContent.id, id))
    .limit(1);

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireStudioAccess(req);
  if (access.response) return access.response;

  const { id } = await params;
  if (!isValidId(id)) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as { heading?: string; headingVisible?: boolean; headingColor?: string | null; ingress?: string; links?: unknown[]; blocks?: unknown[] };

  const db = getDb();
  await db
    .update(navHubContent)
    .set({
      heading: typeof body.heading === "string" ? body.heading : "",
      headingVisible: typeof body.headingVisible === "boolean" ? body.headingVisible : true,
      headingColor: body.headingColor ?? null,
      ingress: typeof body.ingress === "string" ? body.ingress : "",
      links: JSON.stringify(Array.isArray(body.links) ? body.links : []),
      blocks: JSON.stringify(Array.isArray(body.blocks) ? body.blocks : []),
    })
    .where(eq(navHubContent.id, id));

  const publicPath = HUB_PUBLIC_PATH[id];
  if (publicPath) revalidatePath(publicPath);

  return Response.json({ ok: true });
}
