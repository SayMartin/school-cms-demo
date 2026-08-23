import { NextResponse } from "next/server";
import { demoLockCheck } from "@/lib/auth/demo-lock";
import { getStorage } from "@/lib/r2/client";

export const dynamic = "force-dynamic";

// Upload endpoint for course application attachments (applicants aren't signed in).
// Disabled in the public demo along with the application itself — an
// unauthenticated write into R2 is the one public path that could store a
// stranger's files, so it is blocked at the API layer, not just in the UI.
// Outside the demo (DEMO_LOCKDOWN="false") a type allowlist + size limits apply,
// files land under "ansokningar/", and they are linked to the application only
// at POST /api/applications.
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB
const MAX_DOC_SIZE = 25 * 1024 * 1024; // 25 MB

const ALLOWED_TYPES: Record<string, string> = {
  // images
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  // video
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  // documents
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.oasis.opendocument.text": "odt",
  "text/plain": "txt",
  "application/rtf": "rtf",
};

function maxSizeFor(type: string): number {
  if (type.startsWith("video/")) return MAX_VIDEO_SIZE;
  if (type.startsWith("image/")) return MAX_IMAGE_SIZE;
  return MAX_DOC_SIZE;
}

export async function POST(req: Request) {
  const locked = demoLockCheck();
  if (locked) return locked;

  const storage = getStorage();
  if (!storage) {
    return NextResponse.json(
      { error: "Storage unavailable" },
      { status: 503 },
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file attached" }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "File type not supported" }, { status: 415 });
  }
  if (file.size > maxSizeFor(file.type)) {
    return NextResponse.json({ error: "File is too large" }, { status: 413 });
  }

  const key = `ansokningar/${crypto.randomUUID()}.${ext}`;
  const buffer = await file.arrayBuffer();
  await storage.put(key, buffer, { httpMetadata: { contentType: file.type } });

  return NextResponse.json(
    { key, name: file.name, type: file.type, size: file.size },
    { status: 201 },
  );
}
