// Type declarations for Cloudflare Workers environment bindings.
// These must match the binding names defined in wrangler.jsonc exactly.
//
// When you add a new binding (D1, R2, KV, etc.) in wrangler.jsonc,
// add the corresponding type here so TypeScript knows about it.

interface CloudflareEnv {
  // D1 database — binding name "DB" (see wrangler.jsonc)
  // TODO: This becomes live once wrangler.jsonc has the real database_id filled in
  DB: D1Database;

  // R2 storage bucket — binding name "STORAGE" (see wrangler.jsonc)
  STORAGE: R2Bucket;

  // Rate limiting — see src/lib/rate-limit.ts and the "ratelimits" array in
  // wrangler.jsonc. Absent outside the Workers runtime, so callers fail open.
  AUTH_LIMITER: RateLimit;
  UPLOAD_LIMITER: RateLimit;
  WRITE_LIMITER: RateLimit;

  // Environment identifier — "dev" | "prod" (set in wrangler.jsonc per env)
  APP_ENV: string | undefined;

  // Blocks destructive admin actions, public sign-up, and course-application
  // submission/upload at the API layer. "true" (default) | "false".
  // See src/lib/auth/demo-lock.ts for the full list of guarded endpoints.
  DEMO_LOCKDOWN: string | undefined;

  // Better Auth runtime configuration
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  NEXT_PUBLIC_APP_URL: string;

  // Transactional email (Gmail API via Google Workspace)
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  GOOGLE_SENDER_EMAIL: string;
  // Maintenance report recipients: IT issues -> INCIDENT_EMAIL, other (facilities) -> FASTIGHET_EMAIL.
  // ADMIN_EMAIL is the fallback when the category-specific vars are unset.
  INCIDENT_EMAIL: string;
  FASTIGHET_EMAIL: string;
  ADMIN_EMAIL: string;
  // Venue inquiries: recipients for booking requests (comma-separated list).
  MOTESPLATS_EMAIL: string;
  // Course applications: recipients for new applications (falls back to ADMIN_EMAIL).
  ANSOKAN_EMAIL: string;

  // Cloudflare Turnstile bot protection
  TURNSTILE_SITE_KEY: string;
  TURNSTILE_SECRET_KEY: string;

  // Instagram Graph API — long-lived token (expires after 60 days, refresh manually)
  INSTAGRAM_ACCESS_TOKEN: string;
}
