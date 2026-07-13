import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { historyContent } from "@/lib/db/schema";
import { parseTimeline } from "@/lib/historia-timeline";
import { HistoriaTimeline } from "@/components/historia-timeline";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Historia" };

export default async function HistoriaPage() {
  const db = getDb();
  const [row] = await db
    .select()
    .from(historyContent)
    .where(eq(historyContent.id, "main"))
    .limit(1);

  const entries = parseTimeline(row?.timeline ?? "[]");

  return (
    <HistoriaTimeline
      entries={entries}
      heading={row?.heading}
      headingVisible={row?.headingVisible}
      headingColor={row?.headingColor ?? undefined}
    />
  );
}
