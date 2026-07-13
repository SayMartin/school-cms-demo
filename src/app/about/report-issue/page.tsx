import type { Metadata } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { FelanmalanClient } from "./report-issue-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Report an issue" };

export default function FelanmalanPage() {
  let siteKey = "";
  try {
    const { env } = getCloudflareContext();
    siteKey = env.TURNSTILE_SITE_KEY ?? "";
  } catch { /* next dev doesn't run Cloudflare runtime */ }
  return <FelanmalanClient siteKey={siteKey} />;
}
