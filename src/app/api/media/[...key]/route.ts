import { NextResponse } from "next/server";
import { getStorage } from "@/lib/r2/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ key: string[] }> };

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

  const contentType = head.httpMetadata?.contentType ?? "application/octet-stream";
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

        const headers = new Headers();
        headers.set("Content-Type", contentType);
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        headers.set("Accept-Ranges", "bytes");
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

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Length", String(head.size));

  return new NextResponse(object.body, { headers });
}
