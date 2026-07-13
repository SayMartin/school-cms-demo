import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { news } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const db = getDb();
    const [item] = await db.select().from(news).where(eq(news.slug, slug)).limit(1);
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
      title?: string;
      slug?: string;
      excerpt?: string;
      content?: string;
      author?: string;
      imageKey?: string | null;
      links?: Array<{ label: string; url: string }>;
      publishedAt?: string;
      isPublished?: boolean;
      headingColor?: string | null;
    };

    const patch: Partial<typeof news.$inferInsert> = { updatedAt: new Date() };
    if (body.title !== undefined) patch.title = body.title;
    if (body.slug !== undefined) patch.slug = body.slug;
    if (body.excerpt !== undefined) patch.excerpt = body.excerpt;
    if (body.content !== undefined) patch.content = body.content;
    if (body.author !== undefined) patch.author = body.author || null;
    if (body.imageKey !== undefined) patch.imageKey = body.imageKey;
    if (body.links !== undefined) patch.links = JSON.stringify(body.links);
    if (body.publishedAt !== undefined) patch.publishedAt = new Date(body.publishedAt);
    if (body.isPublished !== undefined) patch.isPublished = body.isPublished;
    if (body.headingColor !== undefined) patch.headingColor = body.headingColor ?? null;

    const db = getDb();
    const [item] = await db.update(news).set(patch).where(eq(news.slug, slug)).returning();
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidatePath("/news");
    revalidatePath("/news/[slug]");
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
    await db.delete(news).where(eq(news.slug, slug));
    revalidatePath("/news");
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
