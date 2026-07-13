import { createAuth } from "@/lib/auth/auth";
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
  // Portfolio demo: public registration is disabled. The UI already hides
  // the sign-up form behind an info overlay, but block it server-side too
  // so the endpoint can't be used directly.
  const url = new URL(request.url);
  if (request.method === "POST" && url.pathname.endsWith("/sign-up/email")) {
    return new Response(
      JSON.stringify({ message: "Account registration is disabled in this demo." }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  const db = getDb();
  const auth = createAuth(db);
  return auth.handler(request);
}

export { handler as GET, handler as POST };
