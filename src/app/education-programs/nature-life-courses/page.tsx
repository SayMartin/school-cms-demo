import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { natureLifeCoursesContent } from "@/lib/db/schema";
import { HubBlocksView } from "@/components/hub-blocks-view";
import { parseHubBlocks } from "@/lib/parse-blocks";
import { mediaUrl } from "@/lib/r2/client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Naturlivskurser" };

export default async function NaturlivskurserPage() {
  const db = getDb();
  const [contentRow] = await db
    .select()
    .from(natureLifeCoursesContent)
    .where(eq(natureLifeCoursesContent.id, "main"))
    .limit(1);

  const blocks = parseHubBlocks(contentRow?.blocks ?? "[]");

  return (
    <div>
      {contentRow?.imageKey && (
        <div
          className="w-full h-[70vh]"
          style={{
            backgroundImage: `url(${mediaUrl(contentRow.imageKey)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
      )}
      <div className="mt-10 mx-auto max-w-7xl px-4">
        <Link
          href={"/education-programs"}
          className="underline-offset-2 hover:underline hover:text-brand-green-dark transition-colors"
        >
          ← {"Utbildningar"}
        </Link>
      </div>

      <div className="mt-8 mx-auto max-w-7xl px-4 pt-6 pb-12 space-y-12 border-t-4 border-brand-green">
        {contentRow?.headingVisible && contentRow?.heading && (
          <h1 style={{ color: contentRow.headingColor ?? "#111827" }}>
            {contentRow.heading}
          </h1>
        )}
        <HubBlocksView blocks={blocks} />
      </div>
    </div>
  );
}
