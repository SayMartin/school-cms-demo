import { createAuthClient } from "better-auth/client";
import type { UserRole } from "@/lib/auth/roles";

// ---------------------------------------------------------------------------
// Client-side auth helper
//
// Import this in "use client" components to:
//   - Sign in:  authClient.signIn.email({ email, password })
//   - Sign out: authClient.signOut()
//   - Session:  authClient.useSession() (React hook)
//
// Uses the current origin's /api/auth route, so the same client bundle works
// locally, on workers.dev, and on the production domain.
// ---------------------------------------------------------------------------

export const authClient = createAuthClient();

// Re-export typed session helper so components get the correct role type
export type Session = typeof authClient.$Infer.Session & {
  user: { role: UserRole };
};
