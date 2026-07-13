import { NextResponse } from "next/server";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getStorage, mediaUrl } from "@/lib/r2/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const access = await requireStudioAccess(req);
  if (access.response) return access.response;

  const url = new URL(req.url);
  const prefix = url.searchParams.get("prefix") ?? "";
  const type = url.searchParams.get("type") ?? "image";

  const storage = getStorage();
  if (!storage) return NextResponse.json([]);

  const result = await storage.list({ prefix, limit: 300 });
  const ext = type === "video"
    ? /\.(mp4|webm|ogg|mov)$/i
    : /\.(jpe?g|png|gif|webp|avif|svg)$/i;
  const items = result.objects
    .filter((obj) => ext.test(obj.key))
    .map((obj) => ({ key: obj.key, url: mediaUrl(obj.key) }));

  return NextResponse.json(items);
}
