import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { navHubContent } from "@/lib/db/schema";
import { NavHubEditor } from "./nav-hub-editor";
import { parseHubBlocks } from "@/lib/parse-blocks";

const LABELS: Record<string, string> = {
  deltagarinfo: "Deltagarinfo — hubsida",
  "om-skolan": "Om skolan — hubsida",
  skolan: "Skolan — hubsida",
  utbildningar: "Utbildningar — hubsida",
  kortkurser: "Kortkurser — hubsida",
};

const VALID_IDS = ["deltagarinfo", "om-skolan", "skolan", "utbildningar", "kortkurser"];

export default async function NavHubStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!VALID_IDS.includes(id)) notFound();

  const db = getDb();
  const [row] = await db
    .select()
    .from(navHubContent)
    .where(eq(navHubContent.id, id))
    .limit(1);

  if (!row) notFound();

  const blocks = parseHubBlocks(row.blocks);

  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <Link
          href="/studio"
          className="text-sm font-semibold uppercase tracking-widest text-gray-600 hover:text-brand-green-dark transition-colors"
        >
          ← Studio
        </Link>
        <h1 className="mt-1">{LABELS[id] ?? id}</h1>
      </div>
      <NavHubEditor
        id={id}
        uploadPrefix={`hub-${id}`}
        initialHeading={row.heading}
        initialHeadingVisible={row.headingVisible}
        initialHeadingColor={row.headingColor ?? undefined}
        initialIngress={row.ingress}
        initialBlocks={blocks}
      />
    </div>
  );
}
