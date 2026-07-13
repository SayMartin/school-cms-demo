import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { news } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const items = await db
      .select({
        id: news.id,
        title: news.title,
        slug: news.slug,
        excerpt: news.excerpt,
        author: news.author,
        isPublished: news.isPublished,
        publishedAt: news.publishedAt,
      })
      .from(news)
      .orderBy(desc(news.publishedAt));
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
      title: string;
      slug: string;
      excerpt: string;
      content: string;
      author?: string;
      imageKey?: string | null;
      links?: Array<{ label: string; url: string }>;
      publishedAt?: string;
      isPublished?: boolean;
    };

    const db = getDb();
    const now = new Date();
    const isPublished = body.isPublished ?? true;
    const [item] = await db
      .insert(news)
      .values({
        id: crypto.randomUUID(),
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: body.content,
        author: body.author ?? null,
        imageKey: body.imageKey ?? null,
        links: JSON.stringify(body.links ?? []),
        isPublished,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : (isPublished ? now : null),
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    revalidatePath("/news");
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
