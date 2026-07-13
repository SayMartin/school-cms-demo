# School CMS Demo

A headless, edge-deployed CMS for schools, built with Next.js and Cloudflare
Workers/D1/R2. This repository is a **portfolio artifact**: a generic school
CMS, showcased through one example implementation — a fictional Swedish folk
high school, "Demo Folk High School". The example content
(staff, courses, news, menus, support tickets) is entirely invented — no real
person's data, and no connection to any real school's infrastructure.

It runs on its own Cloudflare account, D1 database, and R2 bucket. Outbound
email is mocked (nothing is ever sent to a real inbox), so every public form
and the full CMS ("Studio") can be tried safely.

**Live demo:** [school-cms-demo.appfinningar.se](https://school-cms-demo.appfinningar.se)

**Try the CMS yourself:** the [`/sign-in`](/sign-in) page lists four
demo accounts (admin, editorial staff, kitchen-menu manager, facilities) with
their passwords shown directly on the page — click one to autofill the form
and explore the matching portal (`/studio`, `/restaurant-admin`,
`/facilities`, `/admin`).

---

## Tech Stack

| Layer     | Technology                             |
|-----------|------------------------------------------|
| Framework | Next.js 16 (App Router) + TypeScript   |
| Styling   | Tailwind CSS v4                        |
| Database  | Cloudflare D1 (SQLite) via Drizzle ORM |
| Storage   | Cloudflare R2                          |
| Auth      | Better Auth — email + password         |
| Email     | Gmail API via Google Workspace (transactional, edge-compatible) — mocked in this demo |
| Hosting   | Cloudflare Workers (OpenNext)          |

---

## Running It Locally

This repo is shared for viewing and code review — see the live demo above to
try the CMS without setting anything up. The steps below are for reviewers
who want to run it locally or read the code in an editor.

### Prerequisites

- Node.js 20+
- A Cloudflare account (for D1 and R2) — this demo uses its own separate
  account, isolated from the real school's production Cloudflare account

### 1. Clone and install

```bash
git clone https://github.com/SayMartin/school-cms-demo.git
cd school-cms-demo
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Add a `BETTER_AUTH_SECRET` (generate with `openssl rand -base64 32`) to
`.env.local` (Next dev server) or `.dev.vars` (Cloudflare preview/`wrangler`).
Outbound email is unconditionally mocked in this demo (see
[EMAIL.md](EMAIL.md)) — no Gmail/Google credentials are required to run it
locally.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server (Turbopack) at http://localhost:3000 |
| `npm run build:cloudflare` | Build for Cloudflare Workers via OpenNext |
| `npm run preview` | Preview Worker locally at http://localhost:8787 |
| `npm run deploy` | Deploy the demo Worker to Cloudflare (minified) |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check without building |
| `npm run db:migrate:local` / `:remote` | Apply pending migrations to the demo D1 (local / remote) |
| `npm run db:seed:demo:local` / `:remote` | Seed fully invented demo content (`scripts/seed-demo-data.sql`) |
| `npm run db:seed:instances:local` / `:remote` | Seed invented demo course instances |
| `npm run seed:demo-users:local` / `:remote` | Create the four demo login accounts via the real sign-up endpoint |

> **Note:** Do not use `npm run build` alone to deploy — it fails outside the Workers runtime. Always use `build:cloudflare` instead.

---

## Project Structure

```
src/
  app/                        # Pages (Next.js App Router)
    page.tsx                  # Homepage
    education-programs/       # Hub page — block-editor driven (NavGroup + CourseGroup); [slug] detail
    short-courses/            # Hub page — block-editor driven
    about/                    # Hub page + sub-pages (history, careers, apply, report-issue, …)
    distance-education/       # Distance program detail pages
    summer-courses/           # Summer courses list + course/[slug] detail
    evening-courses/          # Evening courses list + course/[slug] detail
    participant-stories/      # Participant stories page
    news/                     # News list + detail
    restaurant/                # Weekly menu (public)
    restaurant-admin/          # Chef portal (admin + restaurant roles)
    venues/                    # Venues NavHub + [slug] venue detail pages
    boarding/                  # Boarding school (block-based content)
    contact/                    # Contact + staff directory by department
    admin/                       # Admin dashboard — user management + IT handbook (admin only)
    sign-in/                     # Sign-in page
    create-account/               # Sign-up (new accounts pending admin approval)
    forgot-password/              # Password reset request (+ reset-password)
    403/                           # Permission denied
    api/auth/[...all]/             # Better Auth API endpoints
    api/admin/users/                # User management API (admin-gated)
    api/news/                        # News CRUD API
    api/courses/                      # Course CRUD API (unified — all course types)
    api/restaurant/                   # Chef portal API (dishes, menus, content)
    api/profiles/                      # Profile CRUD API
    api/departments/                    # Department CRUD API
    api/report-issue/                    # Maintenance report API + email notification
    api/.../content/                      # One content endpoint per singleton CMS page
    api/upload/                            # File upload to R2 (Studio-gated)
    api/media/[...key]/                     # File serving from R2
    studio/                       # Admin UI for staff/admin
      manage-courses/             # Course CRUD — list, create, edit, delete
      news/                       # News CRUD — list, create, edit, schedule/draft, delete
      manage-stories/             # Participant story CRUD
      manage-venues/               # Venue CRUD + booking inquiries
      profiles/                     # Staff profile CRUD
      departments/                  # Department CRUD (name, sort order, cover image)
      nav-hub/[id]/                  # Hub page editors
      style-templates/                 # Typography settings (fonts per H1/H2/H3/body)
      .../                              # One editor per content page (see AGENTS.md for full list)
  components/                 # Shared UI (Nav, RadialNav, Footer, Breadcrumbs, NewsCard, KursCard, NavHubCard, VenueView, ProfileCard, HeroVideo, ImageUpload, RichTextEditor, RichTextContent, AccordionButton, AccordionBlock, BlockCard, BlockToolbar, block editors/views, HubBlocksView, KursBlocksView, InstagramFeed, HistoriaTimeline, CourseDetailView, ParticipantStoryCard, StudioSaveBar, StudioSectionCard, StudioSectionGrid, TurnstileWidget)
  lib/
    blocks.ts                 # Block type definitions: SectionBlock, AccordionSectionBlock, SlideshowBlock, ProfilesBlock, YoutubeBlock, VideoBlock, InstagramBlock, NavGroupBlock, CourseGroupBlock
    auth/                     # Better Auth server + client config, roles, guards
    db/                       # Drizzle schema + D1 client
    email/                    # Gmail API client (edge-compatible, see EMAIL.md)
    r2/                       # R2 client + mediaUrl helper
    instagram.ts              # Instagram Graph API fetch
    turnstile.ts              # Cloudflare Turnstile server-side validation
  middleware.ts               # Edge middleware — route protection (auth + roles)
  env.d.ts                    # Cloudflare env type declarations

drizzle/migrations/           # SQL migration files (applied via wrangler d1 migrations apply)
```

---

## Database Models

| Model | Description |
|---|---|
| `User` | Auth — managed by Better Auth |
| `Session` | Auth — managed by Better Auth |
| `Account` | Auth — managed by Better Auth |
| `Verification` | Auth — managed by Better Auth |
| `News` | School news articles with action links and optional R2 image |
| `Course` | **Unified course model** — all course types (`program`, `program_track`, `short`, `summer`, `evening`) in one table. Fields include `applicationSectionHeading` (editable heading above the application section — default "Ansökan"). See [COURSES.md](COURSES.md). |
| `CourseInstance` | A specific intake of a Course — year, periodType, week, dates, spots, `applicationMethods` (open/mode/methods JSON), `applicationBlocks`, `extraFields` (custom form questions). One Course can have many CourseInstances. |
| `CourseApplication` | An application submitted via the built-in form (`/apply/[code]`). Stores fixed fields, `extraAnswers` (JSON), file attachments, and a status (`new`/`reviewing`/`accepted`/`declined`). |
| `ParticipantStory` | Former student testimonials, matched to courses via `courseName` |
| `Dish` | Reusable dish library with photos, used in weekly menus |
| `WeeklyMenu` | Weekly lunch menu container (year + ISO week) |
| `DayMenu` | One weekday in a weekly menu, with closed flag |
| `DayMenuItem` | One dish on a day (1–3 per day) |
| `RestaurantContent` | Editable intro, prices note, and default menu footer |
| `ErrorReport` | Maintenance/fault reports submitted by students or staff |
| `ErrorReportComment` | Internal staff comment thread on a fault report |
| `Profile` | Staff member — name, contact info, bio (rich text), photo, published flag |
| `Department` | School department with sort order |
| `ProfileDepartment` | Many-to-many — links profiles to departments with per-department role titles |
| `CourseDepartment` | Many-to-many — links courses to departments (renamed from `KursAvdelning`) |
| `Venue` | Individual room/space — category, capacity, priceInfo, features (JSON), imageKey, **blocks** (JSON for detail page), published flag |
| `VenueInquiry` | Booking inquiry — eventType (meeting/conference/event/course/other), requestedDate, alternativeDate, numberOfPeople, venues, equipmentNeeded, meals, notes |
| `VenueInquiryComment` | Internal staff comment thread on a venue inquiry |
| `HomeContent` | Singleton — blocks + hero ingress text and "Why us" rich text for the homepage |
| `AssociationContent` | Singleton — blocks + map heading, buildings text, board heading and intro (renamed from `ForeningenContent`/`OmSkolanContent`) |
| `HistoryContent` | Singleton — blocks + timeline for the school history page |
| `AdmissionsContent` | Singleton — blocks for the application periods page |
| `CareersContent` | Singleton — blocks + sidebar profile IDs for job listings page |
| `StudentSupportContent` | Singleton — blocks + sidebar profile IDs for student support page |
| `StudyGuidanceContent` | Singleton — blocks + sidebar profile IDs for study guidance page |
| `StudentRightsContent` | Singleton — blocks for student rights and policies page |
| `TermDatesContent` | Singleton — blocks for term and holiday dates page |
| `BoardingContent` | Singleton — blocks for the boarding school page |
| `ContactContent` | Singleton — address, contact details, office hours, absence notice, and blocks for the contact page |
| `VenuesContent` | Singleton — blocks for the /venues intro section |
| `NavHubContent` | Multi-row — heading, headingVisible, headingColor, ingress, blocks. Rows correspond to the hub pages (about, education programs, short courses, venues, participant info) |
| `MaintenanceReportContent` | Singleton — editable intro text and blocks for the public maintenance-report page |
| `SummerCoursesContent` / `EveningCoursesContent` / `NatureLifeCoursesContent` | Singletons — heading + blocks for the respective course list pages |
| `SummerCoursesAdmissionsContent` / `SummerCoursesPracticalInfoContent` | Singletons — blocks for summer-course application/practical info pages |
| `ParticipantStoriesContent` / `FolkEducationContent` / `NewsHubContent` | Singletons — blocks for their respective pages |
| `TypographySettings` | Singleton — fonts per H1/H2/H3/body + lock flag (Studio → Style Templates, see [FONTS.md](FONTS.md)) |
| `BgGradientSettings` | Singleton — page background gradient colors + favorites |

---

## Auth Roles

| Role | Access |
|---|---|
| `admin` | Full access to everything, including `/admin` |
| `developer` | Studio (prod: full; dev: only developer+admin), Restaurant — no `/admin` |
| `staff` | All editorial content via prod-Studio |
| `restaurant` | Weekly menu and dish library only (`/restaurant-admin`) |
| `facilities` | Maintenance-report portal only (`/facilities`) |

Studio access is environment-dependent: on the dev-Worker only `admin` and `developer` can log in to Studio; on the prod-Worker `staff` is also allowed. Unauthenticated visitors can access all public pages without logging in. Auth state is managed via an avatar dropdown in the navbar. New accounts can be registered at `/create-account` but start with status `pending` — an admin must activate them (via the admin dashboard) before login grants access. Password reset emails are sent via the Gmail API.

---

## Content Management

All content is stored in Cloudflare D1 and managed through the site's own admin UI at `/studio`. Staff log in with their email and password — roles control what each person can edit. Media files are stored in Cloudflare R2 and served via `/api/media/`.

All content pages use the **block system** — a freeform list of reorderable blocks stored as JSON in D1 under a `blocks` column. Block types are defined in `src/lib/blocks.ts`. Hub pages (`/education-programs`, `/short-courses`, `/about`, `/venues`) also support **nav-group** (manual navigation balls) and **course-group** (filtered course cards) blocks, accessible from `/studio/nav-hub/[id]`; `/about-redirect` and `/participant-info` redirect to `/about`. Pages show nothing until blocks are added — there is no fallback content.

Every content page has a studio-editable **page heading** (`heading`, `headingVisible`, `headingColor`) managed via `HeadingStyleEditor` in Studio. Detail pages (News, Course, Venue) have `headingColor` only.

**Typography** is dynamically configurable via Studio → Style Templates. 18 Google Fonts are available; H1/H2/H3/body each have an independent CSS variable (`--font-h1` etc.) set from D1 at request time. See [FONTS.md](FONTS.md).

**Navigation** uses `RadialNav` — a circular pie-menu component — on desktop (md+). On mobile it opens a grouped dropdown. The navigation tree (`SCHOOL_NAV_TREE`) is defined in `src/components/RadialNav.example.tsx` and consumed from `src/components/nav.tsx`.

Transactional email (maintenance-report notifications, password resets, account notices) is sent via the Gmail API using a Google Workspace service account — see [EMAIL.md](EMAIL.md). Bot protection on public forms via Cloudflare Turnstile.

---

## Deployment

Manual deploy only — `npm run build:cloudflare && npm run deploy`. There is no
CI/CD pipeline in this repo and no `production` environment in
`wrangler.jsonc`: it only ever targets this demo's own Cloudflare account, D1
database, and R2 bucket, so there's no path from this repo to the real
school's production infrastructure.

---

## Documentation

| File | Purpose |
|---|---|
| [ROADMAP.md](ROADMAP.md) | Project plan, progress tracking, deployment notes |
| [AGENTS.md](AGENTS.md) | Instructions for all AI coding agents (Claude, Copilot, Cursor, etc.) |
| [DESIGN.md](DESIGN.md) | Visual design spec — colors, typography, components |
| [FONTS.md](FONTS.md) | Font catalogue — all 18 available fonts, pairings, and technical notes |
| [COURSES.md](COURSES.md) | Course data model — Course schema, studio separation, field reference |
| [EMAIL.md](EMAIL.md) | Email setup — Gmail API sending, DNS/MX migration plan |
| [CLAUDE.md](CLAUDE.md) | Claude Code pointer → AGENTS.md |
| [.env.local.example](.env.local.example) | Environment variable template |

---

## License

All rights reserved — see [LICENSE](LICENSE). This repository is published
for viewing and code review, not for reuse.
