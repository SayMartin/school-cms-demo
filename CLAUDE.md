# CLAUDE.md — Instructions for Claude Code

This file is read automatically by Claude Code at the start of every session.

## Project

**School CMS Demo** — a generic, headless school CMS built with Next.js and
Cloudflare Workers/D1/R2, showcased through one example implementation:
**Demo Folk High School**, a fictional Swedish folk high school.
The example content models what replacing a legacy WordPress/SQLite site with
this CMS would look like — it has no connection to any real school.

## Agent Instructions

All architecture, conventions, rules, and tech stack details are in **[AGENTS.md](AGENTS.md)**.
Read that file before making any changes.

## Do Not

- Do not use the Pages Router — this project uses App Router exclusively.
- Do not use `any` in TypeScript — always type properly.
- Do not commit `.env` or `.env.local` files.
- Do not add unnecessary abstractions or helpers for one-off operations.
- **Do not let a public endpoint write personal data.** The demo Studio password
  is published on `/sign-in`, so anything in D1 is world-readable. Every public
  form is inert and every write endpoint behind one is guarded by
  `demoLockCheck()`. Don't remove a guard, and don't add a public form that
  persists what a visitor types. See *Privacy & Personal Data* in AGENTS.md.
- **Do not accept SVG uploads, and do not store a visitor's IP.** The same
  published-password reasoning applies: an uploaded SVG would run as this site,
  and `Session.ipAddress` is world-readable. See *Uploads and headers* in
  AGENTS.md.
- **Do not embed a third party directly in a page.** Use the click-to-load
  `MapEmbed` pattern, and list any new third party in `/privacy` and in the CSP
  in `next.config.ts` in the same change.
- **Do not remove the rate limiters, and do not use them as a security gate.**
  `AUTH_LIMITER` is the only brute-force cap on sign-in — Better Auth's own is
  inert while IP tracking is off. `rateLimit()` fails open by design. See
  *Rate limiting* in AGENTS.md.
