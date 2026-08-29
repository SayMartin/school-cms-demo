import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// ---------------------------------------------------------------------------
// Rate limiting via Cloudflare's Rate Limiting bindings (wrangler.jsonc
// "ratelimits"). The demo Studio password is printed on /sign-in, so every
// privileged write path is in practice a public one: without a limit, a
// stranger can fill D1 with rows and R2 with 200 MB videos on someone else's
// Cloudflare bill.
//
// The binding is the right tool here specifically because it stores nothing we
// could be asked to hand over. It counts against a key inside Cloudflare's
// infrastructure and forgets it when the window closes — there is no table to
// read back, which is what lets /privacy keep saying no visitor data is kept.
//
// Two known limits, both acceptable for a demo: counting is per-colo rather
// than global, and the period can only be 10 or 60 seconds.
// ---------------------------------------------------------------------------

export type LimiterName = "AUTH_LIMITER" | "UPLOAD_LIMITER" | "WRITE_LIMITER";

// Salt for the key hash below. Not a secret — it exists so the value handed to
// the binding is not itself an IP address.
const KEY_SALT = "school-cms-demo:rate-limit:v1";

/**
 * A stable per-client key that is not an IP address.
 *
 * Cloudflare gives us the client IP on every request. We need to tell clients
 * apart, but we do not need to know who they are, so the address is hashed and
 * only the digest leaves this function. Nothing is written to D1 either way —
 * see `advanced.ipAddress.disableIpTracking` in src/lib/auth/auth.ts.
 *
 * With no address available (local `wrangler dev`), every caller collapses onto
 * one shared bucket. That is wrong for production and fine for a laptop.
 */
async function clientKey(request: Request, scope: string): Promise<string> {
  const ip = request.headers.get("cf-connecting-ip");
  if (!ip) return `${scope}:local`;

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${KEY_SALT}:${ip}`),
  );
  const hex = Array.from(new Uint8Array(digest).slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${scope}:${hex}`;
}

/**
 * Consumes one token for `request` against the named limiter.
 *
 * Returns a 429 response when the caller is over the limit, or null to let the
 * request through.
 *
 * Fails **open**, unlike demoLockCheck(). A missing binding or an error inside
 * the limiter must not take the site down: this protects availability and
 * spend, it is not an authorization control, and the real guards
 * (requireStudioAccess, demoLockCheck) still stand behind it.
 */
export async function rateLimit(
  request: Request,
  limiter: LimiterName,
): Promise<NextResponse | null> {
  let binding: RateLimit | undefined;
  try {
    binding = getCloudflareContext().env[limiter];
  } catch {
    return null;
  }
  if (!binding) return null;

  try {
    const key = await clientKey(request, limiter);
    const { success } = await binding.limit({ key });
    if (success) return null;
  } catch {
    return null;
  }

  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": "60" } },
  );
}

/** Methods that change state, and so are worth spending a token on. */
export function isMutation(method: string): boolean {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}
