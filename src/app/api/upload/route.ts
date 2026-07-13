import { NextResponse } from "next/server";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getStorage } from "@/lib/r2/client";

export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogg",
  "video/quicktime": "mov",
};

export async function POST(req: Request) {
  const access = await requireStudioAccess(req);
  if (access.response) return access.response;

  const storage = getStorage();
  if (!storage) {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const prefix = (formData.get("prefix") as string | null) ?? "uploads";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isVideo = file.type.startsWith("video/");
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: isVideo ? "File too large (max 200 MB)" : "File too large (max 10 MB)" },
      { status: 413 },
    );
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const key = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const buffer = await file.arrayBuffer();

  await storage.put(key, buffer, {
    httpMetadata: { contentType: file.type },
  });

  return NextResponse.json({ key }, { status: 201 });
}
