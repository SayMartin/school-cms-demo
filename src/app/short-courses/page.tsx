import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { navHubContent } from "@/lib/db/schema";
import { HubBlocksView } from "@/components/hub-blocks-view";
import { parseHubBlocks } from "@/lib/parse-blocks";

export const metadata: Metadata = { title: "Kortkurser" };
export const dynamic = "force-dynamic";

export default async function KortkurserPage() {
  const db = getDb();

  const row = await db.select().from(navHubContent).where(eq(navHubContent.id, "kortkurser")).limit(1).then((r) => r[0]);

  const heading = row?.heading || "Kortkurser";
  const headingVisible = row?.headingVisible ?? true;
  const headingColor = row?.headingColor;
  const ingress = row?.ingress || "";
  const blocks = parseHubBlocks(row?.blocks ?? "[]");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-8">
      <div className="text-center">
        {headingVisible && <h1 style={{ color: headingColor ?? "#111827" }}>{heading}</h1>}
        {ingress && <p className="mt-2 text-gray-600">{ingress}</p>}
      </div>

      <HubBlocksView blocks={blocks} />
    </div>
  );
}
