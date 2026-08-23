import { createAuth } from "@/lib/auth/auth";
import { demoLockCheck } from "@/lib/auth/demo-lock";
import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Better Auth API route
//
// All authentication endpoints live here:
//   POST /api/auth/sign-in/email
//   POST /api/auth/sign-out
//   GET  /api/auth/get-session
//   ... (handled automatically by Better Auth)
//
// Uses the per-request Cloudflare D1 binding through getDb().
// ---------------------------------------------------------------------------

async function handler(request: Request) {
  // Portfolio demo: public registration is disabled. The UI already hides the
  // sign-up form behind an info overlay; this blocks the endpoint itself so it
  // can't be called directly. Gated on DEMO_LOCKDOWN (which fails closed) rather
  // than hardcoded, because scripts/seed-demo-users.mjs creates the demo accounts
  // through this very endpoint — with the block unconditional, re-seeding needed
  // a code edit.
  const url = new URL(request.url);
  if (request.method === "POST" && url.pathname.endsWith("/sign-up/email")) {
    const locked = demoLockCheck();
    if (locked) return locked;
  }

  const db = getDb();
  const auth = createAuth(db);
  return auth.handler(request);
}

export { handler as GET, handler as POST };
