import { NextResponse } from "next/server";
import { getStorage } from "@/lib/r2/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ key: string[] }> };

// Content types this endpoint is willing to render in the browser. /api/upload
// only accepts these, but R2 outlives the allowlist: an object stored before a
// type was dropped — an SVG, say — would still be served with whatever content
// type it was saved under, and an SVG rendered from this origin can script the
// site. Anything unrecognised is handed over as an opaque download instead.
const INLINE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);

function presentation(storedType: string | undefined): {
  contentType: string;
  disposition: string | null;
} {
  if (storedType && INLINE_TYPES.has(storedType)) {
    return { contentType: storedType, disposition: null };
  }
  return {
    contentType: "application/octet-stream",
    disposition: "attachment",
  };
}

function baseHeaders(contentType: string, disposition: string | null): Headers {
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  // Without nosniff a browser may ignore the content type above and sniff an
  // uploaded file back into something executable.
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("Accept-Ranges", "bytes");
  if (disposition) headers.set("Content-Disposition", disposition);
  return headers;
}

export async function GET(req: Request, { params }: Params) {
  const { key: segments } = await params;
  const key = segments.join("/");

  const storage = getStorage();
  if (!storage) {
    return new NextResponse(null, { status: 503 });
  }

  const head = await storage.head(key);
  if (!head) {
    return new NextResponse(null, { status: 404 });
  }

  const { contentType, disposition } = presentation(head.httpMetadata?.contentType);
  const rangeHeader = req.headers.get("range");

  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    if (match) {
      const size = head.size;
      const start = match[1] ? Number(match[1]) : size - Number(match[2]);
      const end = match[2] && match[1] ? Number(match[2]) : size - 1;
      const length = end - start + 1;

      if (start >= 0 && length > 0 && end < size) {
        const object = await storage.get(key, { range: { offset: start, length } });
        if (!object) {
          return new NextResponse(null, { status: 404 });
        }

        const headers = baseHeaders(contentType, disposition);
        headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
        headers.set("Content-Length", String(length));

        return new NextResponse(object.body, { status: 206, headers });
      }
    }
  }

  const object = await storage.get(key);
  if (!object) {
    return new NextResponse(null, { status: 404 });
  }

  const headers = baseHeaders(contentType, disposition);
  headers.set("Content-Length", String(head.size));

  return new NextResponse(object.body, { headers });
}
