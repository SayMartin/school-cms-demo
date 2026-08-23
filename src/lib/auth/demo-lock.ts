import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * This deployment is the public demo by default (see wrangler.jsonc DEMO_LOCKDOWN var).
 * Demo account credentials are documented in the app itself, so anything
 * destructive — or anything that would write a stranger's personal data into D1
 * or R2 where those credentials could read it back — is blocked at the API layer,
 * not just hidden in the UI. Current callers:
 *
 *   /api/admin/users/[id]        account approve/reject/change-role/delete
 *   /api/applications            course applications (identity number, address)
 *   /api/applications/upload     public attachment upload into R2
 *   /api/venues/inquiries        venue booking inquiries
 *   /api/report-issue            maintenance reports
 *   /api/auth/sign-up/email      public registration
 *
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
