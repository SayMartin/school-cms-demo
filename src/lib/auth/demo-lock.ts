import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * This deployment is the public demo by default (see wrangler.jsonc DEMO_LOCKDOWN var).
 * Demo account credentials are documented in the app itself, so destructive/
 * account-approval actions are blocked at the API layer, not just hidden in the UI.
 * Fails closed (locked) if the var is unset or the Cloudflare context is unavailable.
 */
export function demoLockCheck(): NextResponse | null {
  let locked = true;
  try {
    locked = getCloudflareContext().env.DEMO_LOCKDOWN !== "false";
  } catch {}

  if (!locked) return null;
  return NextResponse.json(
    { error: "This action is disabled in the public demo." },
    { status: 403 },
  );
}
