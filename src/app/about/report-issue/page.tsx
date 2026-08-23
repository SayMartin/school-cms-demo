import type { Metadata } from "next";
import { FelanmalanClient } from "./report-issue-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Report an issue" };

export default function FelanmalanPage() {
  return <FelanmalanClient />;
}
