# School CMS Demo

A headless, edge-deployed CMS for schools — built with Next.js on Cloudflare
Workers, D1 and R2. Every page, menu, course and staff profile on the public
site is edited through the CMS it ships with; nothing is hardcoded.

This repository is a **portfolio piece**. The product is a generic school CMS;
it is shown here through one worked example, a fictional Swedish folk high
school called *Demo Folk High School*. All content — staff, courses, news,
lunch menus, support tickets — is invented. No real person's data, and no
connection to any real school's infrastructure.

### ▶ [school-cms-demo.appfinningar.se](https://school-cms-demo.appfinningar.se)

---

## Try the CMS yourself

The demo is not a screenshot tour — you get the real editing interface. The
[`/sign-in`](https://school-cms-demo.appfinningar.se/sign-in) page lists four
accounts with their passwords printed on the page. Click one to autofill.

| Sign in as | Portal | What it shows |
|---|---|---|
| Admin | `/admin` | User management, role assignment, account approval |
| Editorial staff | `/studio` | The main CMS — page builder, courses, news, staff profiles, typography |
| Kitchen manager | `/restaurant-admin` | Weekly lunch menus built from a reusable dish library |
| Facilities | `/facilities` | Maintenance reports with an internal staff comment thread |

**Worth looking at first:** open `/studio`, pick any page, and add or reorder
blocks — the public page changes to match. Then try Studio → Style Templates
and change the heading font; every page on the site re-renders with it.

Everything is safe to click. Outbound email is mocked, so nothing reaches an
inbox, and the public forms are deliberately inert — see below for why.

---

## What this project demonstrates

### A CMS that is actually generic

Content pages are not templates with fixed fields. Each one stores an ordered
list of **blocks** as JSON — rich text, accordions, slideshows, video, staff
grids, course groups, navigation groups — that editors add, reorder and remove.
Pages render nothing until blocks exist; there is no fallback content pretending
the page is finished. Adapting the CMS to a different school means editing
content, not writing code.

### Designing for an environment that is hostile by construction

The demo's Studio password is published on the sign-in page. That single
decision drives the whole security model, because it means **anything written to
the database is world-readable**:

- Every public form — course applications, venue inquiries, maintenance reports
  — validates, shows its confirmation screen, and then discards what you typed.
  The write endpoints behind them are blocked server-side, not just hidden in
  the UI, and the block fails closed if its configuration is missing.
- No visitor IP is ever stored. Better Auth's IP tracking is off, which also
  disables its built-in brute-force cap — so sign-in is protected by a separate
  rate limiter instead.
- SVG uploads are rejected: an uploaded SVG would execute as this origin.
- Third parties (maps, YouTube, Instagram) are never embedded directly. They
  load only after an explicit click, are pinned in a Content-Security-Policy,
  and each one is named in the site's [privacy
  policy](https://school-cms-demo.appfinningar.se/privacy).
- Google Fonts are self-hosted — 18 families served from the site's own origin,
  so no visitor request reaches Google.

### Working inside a hard platform constraint

Cloudflare's free tier caps a Worker at 3 MiB compressed. The first builds came
in at ~3.2 MiB and would not deploy: Turbopack does not deduplicate server
chunks across route groups, so the same Drizzle ORM bundle was emitted about six
times. Pinning production builds to webpack, whose cross-chunk splitting
deduplicates it, brought the Worker down to **~1.9 MiB** — comfortably inside
the limit, with local development still on Turbopack for speed.

### Data modelling at real scale

47 tables. Courses are the interesting part: programs, program tracks, short
courses, summer courses and evening courses all live in **one** table with a
discriminator, rather than five near-duplicate ones. A separate
`CourseInstance` models a specific intake — its dates, capacity, application
method and custom form questions — so a course can be offered repeatedly
without duplicating its description.

### Documentation that cannot silently rot

Two maps in [`docs/`](docs/) are generated from the source rather than written
by hand, and a GitHub Actions workflow regenerates them on every push and fails
the build if the committed copies have drifted:

- **[docs/data-model.md](docs/data-model.md)** — an entity-relationship diagram
  of the 19 tables that carry foreign keys, the 28 standalone ones listed
  separately, and the columns that *look* like foreign keys but carry no
  constraint.
- **[docs/api-matrix.md](docs/api-matrix.md)** — all 115 API handlers mapped to
  their role guard, rate limiter, and the tables they read and write. It also
  audits three invariants on every run, including whether any public endpoint
  writes a table that holds personal data.

---

## Architecture

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Cloudflare D1 (SQLite) via Drizzle ORM |
| Storage | Cloudflare R2 |
| Auth | Better Auth — email + password |
| Email | Gmail API via Google Workspace — mocked in this demo |
| Hosting | Cloudflare Workers (OpenNext) |

Roughly 37,000 lines of TypeScript across 266 files: 102 pages, 59 API routes,
68 shared components. Server components read D1 directly; the Studio talks to
the API routes. Route protection runs in edge middleware, and every privileged
endpoint additionally funnels through a role guard, so access is never enforced
by the UI alone.

Typography is data, not CSS: an editor picks fonts per heading level in Studio,
and the values are read from D1 at request time into CSS variables. Desktop
navigation is a custom circular pie-menu component that collapses to a grouped
dropdown on mobile.

---

## Roles and access

| Role | Access |
|---|---|
| `admin` | Everything, including user management at `/admin` |
| `staff` | All editorial content via `/studio` |
| `developer` | Studio and restaurant portals; no `/admin` |
| `restaurant` | Weekly menus and dish library only |
| `facilities` | Maintenance-report portal only |

New accounts start as `pending` and cannot sign in until an admin activates
them. In the public demo, registration is disabled at the endpoint.

---

## Deployment

Manual deploy only. There is no deploy pipeline in this repository and no
`production` environment in the Cloudflare config: it targets this demo's own
account, database and bucket, so there is no path from this repository to any
real production infrastructure. The single GitHub Actions workflow only
verifies that the generated documentation is current — it holds no credentials
and cannot deploy.

---

## Further reading

For reviewers who want the depth. Build and database commands live in
`AGENTS.md`.

| File | What's in it |
|---|---|
| [AGENTS.md](AGENTS.md) | Architecture, conventions, the full privacy and rate-limiting rationale, and all commands |
| [DESIGN.md](DESIGN.md) | Visual design spec — colors, typography, components |
| [COURSES.md](COURSES.md) | The unified course model, field by field |
| [EMAIL.md](EMAIL.md) | Transactional email over the Gmail API from the edge |
| [FONTS.md](FONTS.md) | The 18 self-hosted font families and how they are wired |
| [ROADMAP.md](ROADMAP.md) | Project plan and progress |

---

## License

All rights reserved — see [LICENSE](LICENSE). This repository is published for
viewing and code review, not for reuse.
