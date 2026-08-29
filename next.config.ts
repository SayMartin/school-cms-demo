import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const isDev = process.env.NODE_ENV !== "production";

// Third parties the app actually reaches, and nothing else. Fonts are
// self-hosted, so no font origin appears here at all — youtube-nocookie and
// Google Maps are the two embeds, both click-to-load, and Turnstile is the bot
// check kept for a non-demo deployment. See /privacy, which lists the same set.
const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is unavoidable without per-request nonces, which need
  // middleware on every route — the middleware here runs a DB lookup and is
  // deliberately scoped to the four protected paths. 'unsafe-eval' is Turbopack's
  // dev-only HMR requirement and is dropped from production builds.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  // Self-hosted woff2 only. If this ever needs a remote origin again, something
  // has gone backwards — see FONTS.md.
  "font-src 'self' data:",
  // Instagram serves thumbnails from rotating CDN hostnames, so images cannot
  // be pinned to a fixed list. Images are an inert content type.
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://www.youtube-nocookie.com https://maps.google.com https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      {
        // Visitor-uploaded bytes get their own, far stricter policy. `sandbox`
        // puts anything opened directly from here into an opaque origin, so a
        // file that slipped past /api/upload's allowlist still cannot script
        // this site. Images and video embedded via <img>/<video> are unaffected —
        // a sandbox applies to documents, not to media subresources.
        source: "/api/media/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; sandbox; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
