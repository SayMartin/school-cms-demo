# ROADMAP - School CMS Demo

Rebuilding a fictional school's website from scratch on a modern, edge-deployed
stack, as a portfolio demo of a generic, headless school CMS.

> The detailed historical build log (dated changelog entries describing the
> real production project's infrastructure, real domains, and pre-rebrand
> Swedish identifiers) lives in `docs/internal/ROADMAP-CHANGELOG.md`, which is
> gitignored and not part of this public repo. This file is the current,
> English architecture/backlog skeleton for the demo.

---

## Current Status

The project has a complete, working Next.js 16 App Router application with:

- Cloudflare Workers (OpenNext) hosting, Cloudflare D1 (Drizzle ORM), Cloudflare R2 for media
- Better Auth email/password auth with five roles (`admin`, `staff`, `developer`, `restaurant`, `facilities`) and environment-aware Studio access
- Complete content workflows for News, Courses (unified model + instances + applications), the Restaurant weekly menu, Venues, Profiles/Departments, maintenance reports, participant stories, and all singleton CMS pages
- A block-based page-layout system used by every public content page — no hardcoded content, no fallback rendering
- English route segments, DB table/column names, role names, and all user-facing UI copy throughout the codebase (see `AGENTS.md` for the full structural map); only the fictional example school's own in-world identity (its name, staff names, setting) stays Swedish

This repository is a sanitized demo clone: its own Cloudflare account, D1
database, and R2 bucket, fully invented content, mocked outbound email, and no
`production` environment or CI/CD pipeline.

---

## Tech Stack

| Layer     | Technology                             |
| --------- | --------------------------------------- |
| Framework | Next.js 16 (App Router) + TypeScript    |
| Styling   | Tailwind CSS v4                         |
| Database  | Cloudflare D1 (SQLite) via Drizzle ORM  |
| Storage   | Cloudflare R2                           |
| Auth      | Better Auth — email + password          |
| Email     | Gmail API via Google Workspace — mocked in this demo |
| Hosting   | Cloudflare Workers (OpenNext)           |

---

## Key Commands

```bash
npm run dev              # Local dev server (Turbopack) at http://localhost:3000
npm run build:cloudflare # Build for Cloudflare Workers (wraps next build via OpenNext)
npm run deploy           # Deploy the demo Worker (minified)
npm run preview          # Preview Worker locally at http://localhost:8787
npm run lint             # Run ESLint
npx tsc --noEmit         # Type-check without building
npm run db:migrate:local / :remote        # Apply pending migrations to the demo D1
npm run db:seed:demo:local / :remote      # Seed invented demo content
npm run db:seed:instances:local / :remote # Seed invented demo course instances
npm run seed:demo-users:local / :remote   # Create the demo login accounts
```

> Do not use `npm run build` alone to deploy — it fails outside the Workers runtime. Always use `build:cloudflare`.

See `AGENTS.md` for the full project structure, block system, design system, and conventions.

---

## Current Product Surface

All major public routes, Studio (admin) routes, and API routes are implemented
and working — see the `src/app/` and `src/app/api/` directory trees in
`AGENTS.md → Project Structure` for the current, accurate route map. Highlights:

- Public: homepage, `/education-programs` (+ `[slug]`), `/short-courses`, `/summer-courses` (+ `/course/[slug]`), `/evening-courses` (+ `/course/[slug]`), `/mental-health-first-aid`, `/study-motivation-course`, `/distance-education` (+ `[slug]`), `/about` (+ sub-pages), `/news` (+ `[slug]`), `/participant-stories`, `/restaurant`, `/venues` (+ `[slug]`), `/boarding`, `/contact`, `/apply/[code]` (course applications), `/sign-in`, `/create-account`, `/forgot-password` / `/reset-password`, `/403`
- Studio (`/studio/*`): one editor per content type — course CRUD (`manage-courses`, `manage-course-instances`, `applications`), news, participant stories, venues + inquiries, profiles, departments, typography (`style-templates`), and a block editor per singleton content page
- Portals: `/restaurant-admin` (admin + restaurant), `/facilities` (admin + facilities), `/admin` (admin only, incl. user management and an IT handbook at `/admin/handbook`)
- API: REST-ish routes under `/api/*` mirroring the Studio structure — one `GET` (public)/`PUT` (studio-gated) content endpoint per singleton page, plus CRUD endpoints for courses, news, venues, profiles, departments, and maintenance reports; `/api/upload` + `/api/media/[...key]` for R2-backed file storage

---

## Deployment

Manual deploy only — `npm run build:cloudflare && npm run deploy`. There is no
CI/CD pipeline and no `production` environment in `wrangler.jsonc`: the config
only ever targets this demo's own Cloudflare account, D1 database
(`school-cms-demo-db`), and R2 bucket (`school-cms-demo-bucket`).

---

## Backlog

Remaining gaps and possible next steps for the demo:

- Fill in any remaining placeholder-only content sections via Studio (e.g. careers listings, folk-education intro).
- Expand seeded participant stories/course instances if a richer demo dataset is wanted.
- Add an Instagram access token to demonstrate the `instagram` block live (currently gated behind `INSTAGRAM_ACCESS_TOKEN`, not required for the demo to function).
- Accessibility pass for WCAG 2.1 AA across all public pages.
- Optional: wire up Cloudflare Web Analytics for the demo Worker.
- Optional: automate deploys from GitHub Actions (not currently set up — manual deploy only, by design for a portfolio demo).

---

## Reference Docs

- `AGENTS.md` - agent rules, architecture, conventions, full route/table map.
- `DESIGN.md` - visual design system.
- `COURSES.md` - unified Course data model.
- `FONTS.md` - typography catalogue and Style Templates notes.
- `EMAIL.md` - email setup (Gmail API) and DNS/MX migration plan.
- `src/lib/auth/roles.ts` - role definitions (admin / developer / staff / restaurant / facilities).
- `docs/internal/ROADMAP-CHANGELOG.md` - archived historical build log (gitignored, not in the public repo).
