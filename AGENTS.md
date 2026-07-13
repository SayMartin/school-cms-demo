# AGENTS.md — Instructions for AI Coding Agents

This file provides context for any AI agent (Claude, Copilot, Cursor, Codex, etc.)
working on this repository.

> **Note for Claude Code users:** `CLAUDE.md` points here. This file is the
> authoritative source for architecture, rules, and conventions.

> **Start here:** Before doing any work, read [ROADMAP.md](ROADMAP.md) to understand
> the current project status and what step is next.

## Working Style

- **One step at a time.** Propose and implement one logical step, then stop and wait for confirmation before proceeding to the next.
- **Explain every decision.** Before writing any code for a step, state: (1) what you are about to do, (2) why this approach was chosen over alternatives, and (3) what tradeoffs or risks it carries. Keep explanations concise but complete enough for a developer to learn from them.
- **Ask before assuming.** If a step has two or more reasonable approaches, present the options with their tradeoffs and let the user decide.

## Project Overview

School CMS Demo — a generic, headless, edge-deployed school CMS, showcased
through one example implementation: Demo Folk High School, a fictional
Swedish folk high school (about 200 students/year). The example content
models what replacing a legacy WordPress site with this CMS would look like.

Route names, DB table names, role names, and component/file names throughout
the codebase are English, so the codebase itself reads in English regardless
of which example content it hosts. User-facing UI strings (nav/footer labels,
page titles, form labels, body copy, seed content) are also in English — only
the example school's own identity (Swedish staff names and building names)
stays Swedish, as authentic in-world flavor. The school's own name, town, and
address are intentionally fictional/generic and must never be made to
resemble any real folk high school.

## Tech Stack

| Layer     | Technology                            |
|-----------|---------------------------------------|
| Framework | Next.js 16 (App Router) + TypeScript  |
| Styling   | Tailwind CSS v4                       |
| Database  | Cloudflare D1 (SQLite) via Drizzle ORM |
| Storage   | Cloudflare R2                         |
| Auth      | Better Auth — email + password        |
| Hosting   | Cloudflare Pages + Workers (Edge)     |

> **No external CMS.** All content (courses, news, pages, menus) is stored in
> Cloudflare D1.

## Architecture

```
Next.js App (Frontend + API)  →  Cloudflare Workers (OpenNext)
        │
        ├── Cloudflare D1 (SQLite via Drizzle) — all structured data & content
        ├── Cloudflare R2 — file/media storage
        └── Better Auth — session & role management
```

## Auth Roles

- `admin` — full access to everything
- `staff` — all editorial content (prod-Studio only)
- `developer` — Studio access in both environments + Restaurant; no `/admin`
- `restaurant` — weekly menu only (see `src/lib/auth/roles.ts`)
- `facilities` — maintenance-report portal only (`/facilities`)

**Portal access:**

| Route | Roles |
|---|---|
| `/studio/*` (prod-worker, `APP_ENV=prod`) | admin, staff, developer |
| `/studio/*` (dev-worker, `APP_ENV=dev`) | admin, developer |
| `/restaurant-admin/*` | admin, restaurant |
| `/facilities/*` | admin, facilities |
| `/admin/*` | admin only |

Studio access is environment-dependent: middleware reads `APP_ENV` via `getCloudflareContext()` and selects `DEV_STUDIO_ROLES` or `PROD_STUDIO_ROLES` accordingly. Locally (no CF context) falls back to prod rules.

Guard helpers in `src/lib/auth/roles.ts`: `hasProdStudioAccess`, `hasDevStudioAccess`, `hasStudioAccess` (= prod, for non-middleware use), `hasRestaurantAccess`, `hasFacilitiesAccess`, `hasAdminAccess`. Used by `middleware.ts` and API guards in `src/lib/auth/guards.ts`. The footer shows a portal link per role the signed-in user can access.

**Account flow:** Public sign-up exists at `/create-account` but new accounts get `status = "pending"` and land on `/account-pending` until an admin activates them via `/api/admin/users/[id]`. Password reset (`/forgot-password` → `/reset-password`) sends email via the Gmail API client.

## Key Commands

```bash
# Local development
npm run dev              # Start local dev server (Turbopack) at http://localhost:3000

# Cloudflare deployment — always use these two together
npm run build:cloudflare # Build for Cloudflare Workers (wraps next build via OpenNext)
npm run deploy           # Deploy the demo Worker (minified)

# ⚠️ DO NOT use `npm run build` alone to deploy — it runs next build directly and
#    fails at prerender time because getCloudflareContext is not available outside
#    the Workers runtime. Always use build:cloudflare instead.

# Note: the "build" script forces `next build --webpack`, not Turbopack — with
# Turbopack, server chunks aren't deduplicated across route groups and the same
# drizzle-orm bundle gets duplicated ~6x, pushing the compressed Worker past
# Cloudflare's 3 MiB free-tier limit (~3.2 MiB minified). Webpack's cross-chunk
# splitChunks dedup brings it down to ~1.9 MiB. `npm run dev` is unaffected and
# still uses Turbopack.

# Local Cloudflare preview (after build:cloudflare)
npm run preview          # Preview Worker locally at http://localhost:8787

# Code quality
npm run lint             # Run ESLint
npx tsc --noEmit         # Type-check without building

# Database — this repo has one environment only (the demo D1), no prod
npm run db:migrate:local         # Apply pending migrations to local D1
npm run db:migrate:remote        # Apply pending migrations to the demo D1
npm run db:seed:demo:local       # Seed invented demo content (local)
npm run db:seed:demo:remote      # Seed invented demo content (remote demo D1)
npm run db:seed:instances:local  # Seed demo course instances (local)
npm run db:seed:instances:remote # Seed demo course instances (remote)
npm run seed:demo-users:local    # Create the demo login accounts (local)
npm run seed:demo-users:remote   # Create the demo login accounts (remote)
```

> **Portfolio-demo repo:** this is a sanitized clone for showing prospective
> employers how the real production site is built — it has no `production`
> Cloudflare environment, no CI/CD, and no scripts that reference the real
> school's D1/R2 by name. All content is invented. See [README.md](README.md).

## Project Structure

```
src/
  app/                        # Next.js App Router pages and layouts
    layout.tsx                # Root layout (fonts, typography CSS vars from D1, bg gradient)
    page.tsx                  # Homepage
    education-programs/       # Hub page — NavHubContent blocks via HubBlocksView; [slug] detail; nature-life-courses
    short-courses/            # Hub page — NavGrupp/KursGrupp blocks
    about/                    # Hub page + sub-pages
      association/            # Association / board / campus buildings
      apply/                   # Application periods
      history/                 # History (blocks + timeline)
      careers/                 # Open positions
      study-guidance/          # Study guidance
      student-support/         # Student support (curative support)
      student-rights/          # Student rights
      term-dates/              # Term and holiday dates
      report-issue/            # Maintenance report — form + Turnstile
    about-redirect/            # Redirect → /about
    distance-education/        # [slug] detail + samtliga-naturliv (static overview)
    summer-courses/            # List page + course/[slug] detail + summer-courses-practical-info
    evening-courses/           # List page + course/[slug] detail
    mental-health-first-aid/   # MHFA detail (Course, courseType=short)
    study-motivation-course/   # SMF detail (Course, courseType=short)
    apply/[code]/               # Course application form per course instance (CourseInstance.slug) — fixed fields + extra fields + file upload
    participant-info/           # Participant info hub redirect / content
    participant-stories/        # Participant stories (ParticipantStoriesContent + stories)
    folk-education/             # Folk education content page
    restaurant/                 # Weekly menu (public)
    restaurant-admin/           # Chef portal (admin + restaurant) — menus, dishes, content
    venues/                     # Venues NavHub (auto-generated balls per venue) + free intro blocks
      [slug]/                   # Venue detail page — VenueView + blocks + inquiry form
    boarding/                    # Boarding school
    news/                        # News list + detail pages
    contact/                     # Contact page
    sign-in/                     # Sign-in page
    create-account/              # Sign-up — new accounts get status "pending"
    account-pending/             # Account pending approval page
    forgot-password/             # Request password reset (email via Gmail API)
    reset-password/              # Set new password from reset link
    admin/                       # Admin dashboard — user management + IT handbook (admin role required)
      handbook/                  # IT handbook — deploy, tokens, domain changes
      users/                     # User management
    facilities/                  # Facilities portal (admin + facilities) — report-issue/: manage cases
    403/                         # Permission denied page
    bubbles/                     # SoapBubbles test page
    api/auth/[...all]/           # Better Auth API endpoints
    api/admin/users/              # User management (admin-gated) — list; [id]: activate/update/delete
    api/news/                     # News CRUD API routes
    api/courses/                  # Course CRUD API (unified — all course types); [slug]: get/update/delete
    api/course-instances/         # CourseInstance CRUD (Studio-gated; GET public, ?open=true, ?courseId=)
    api/applications/             # POST public (course application + Turnstile + email to ANSOKAN_EMAIL + confirmation copy); GET/[id] PATCH studio-gated; upload/ public attachment upload
    api/restaurant/                # Chef portal API (admin + restaurant): dishes, menus, content
    api/venues/                    # Venue CRUD (incl. blocks) + inquiries (POST public + Turnstile + email to MOTESPLATS_EMAIL + confirmation copy); inquiries/[id]/comments studio-gated
    api/venues-content/             # VenuesContent — blocks JSON (intro section for /venues)
    api/profiles/                   # Profile CRUD (Studio-gated, except GET)
    api/departments/                 # Department CRUD (Studio-gated, except GET)
    api/report-issue/                # POST public (+Turnstile + email to incident/facilities + confirmation copy); GET (cases with embedded comments)/PUT/comments facilities-gated (admin+facilities); content/ studio-gated
    api/participant-stories/          # ParticipantStory CRUD
    api/nav-hub/[id]/                 # NavHubContent GET + PUT
    api/typography/                    # TypographySettings GET (public) + PUT (lock: admin)
    api/bg-gradient/                    # BgGradientSettings GET + PUT
    api/hub-block-candidates/           # Data source for NavGroup/CourseGroup pickers in Studio
    api/.../content/                    # One content endpoint per singleton page — GET (public) + PUT
    api/upload/                          # File upload to R2 (Studio-gated)
    api/media/[...key]/                  # File serving from R2 (public)
    api/media-list/                       # List R2 keys (incl. ?type=video) for Studio pickers
    studio/                       # Admin UI for staff/admin (landing + per content type)
      news/                       # News CRUD
      manage-courses/             # Course CRUD — unified model (program, program_track, summer, evening, short)
      manage-course-instances/    # CourseInstance CRUD
      applications/               # Incoming course applications — course+term filters, list + status change
      manage-stories/             # ParticipantStory CRUD ([id], new)
      participant-stories-hub/    # Edit ParticipantStoriesContent — page heading/blocks
      summer-courses/             # Edit SummerCoursesContent (list page, separate from course edit)
      evening-courses/            # Edit EveningCoursesContent
      nature-life-courses/        # Edit NatureLifeCoursesContent
      admissions-content/         # Edit AdmissionsContent / SummerCoursesAdmissionsContent
      summer-courses-practical-info/ # Edit SummerCoursesPracticalInfoContent
      manage-venues/               # Venue CRUD + inquiries
      nav-hub/[id]/                 # Hub editor
      profiles/                     # Profile CRUD (with department memberships)
      departments/                   # Department management
      style-templates/               # Typography — fonts per H1/H2/H3/body + lock (see FONTS.md)
      report-issue-content/          # Edit MaintenanceReportContent
      folk-education/                 # Edit folk education page content
      contact/                         # Edit ContactContent — blocks + fixed fields
      home/                            # Edit HomeContent — blocks + whyUsText
      association/                     # Edit AssociationContent — blocks + fixed fields
      history/                          # Edit HistoryContent — blocks + timeline
      careers/ student-rights/ admissions-content/ term-dates/ student-support/ study-guidance/ boarding/
                                          # Edit respective singleton content — block editors
  components/                 # Shared UI components (Nav, RadialNav, Footer, Breadcrumbs, NewsCard,
                              # KursCard, NavHubCard, VenueView, MenuFab, ScrollToTop, SoapBubbles,
                              # HeroVideo, ImageUpload, AttachmentUpload, RichTextEditor, RichTextContent,
                              # ProfileCard, AccordionButton, AccordionBlock, BlockCard, BlockToolbar,
                              # SectionBlockEditor, AccordionBlockEditor, SlideshowBlockEditor,
                              # ProfilesBlockEditor, NavGroupBlockEditor, KursgruppBlockEditor,
                              # YoutubeBlockEditor, VideoBlockEditor, BallStyleEditor,
                              # HeadingStyleEditor, Slideshow, ProfilesBlockView, NavGroupBlockView,
                              # KursgruppBlockView, HubBlocksView, KursBlocksView, InstagramFeed,
                              # HistoriaTimeline, CourseDetailView, ParticipantStoryCard,
                              # SchoolSoftPrescreen, BrandColorPicker, SchoolRainbow, SchoolDisco,
                              # SummerCoursesNav, StudioSaveBar, StudioSectionCard, StudioSectionGrid,
                              # TurnstileWidget)
  lib/
    blocks.ts                 # Block type definitions: SectionBlock, AccordionSectionBlock, SlideshowBlock, ProfilesBlock, YoutubeBlock, VideoBlock, InstagramBlock + hub blocks: NavGroupBlock (`type: "nav-group"`), CourseGroupBlock (`type: "course-group"`)
    parse-blocks.ts           # Safe JSON → block-array parsing (parseBlocks, parseHubBlocks)
    auth/                     # Better Auth server + client config, roles, guards
    db/                       # Drizzle schema (schema.ts) + D1 client (client.ts)
    email/                    # Gmail API email client (client.ts) — service account + domain-wide delegation, edge-compatible. See EMAIL.md.
    r2/                       # R2 client (client.ts) + mediaUrl helper
    instagram.ts              # fetchInstagramPosts() — Meta Graph API, revalidate 3600
    historia-timeline.ts      # Timeline types/helpers for HistoryContent
    format-date.ts            # fmtDate / fmtDateRange (see Design System)
    brand-colors.ts           # BRAND_COLORS tokens + getColorHex
    revalidate.ts             # Shared revalidatePath helpers
    turnstile.ts              # Cloudflare Turnstile server-side token validation (verifyTurnstileToken)
    course-instance.ts        # formatRegistrationCode / buildInstanceSlug / formatPeriodLabel — generated from year+periodType+week
    application-methods.ts    # ApplicationConfig / ApplicationMethod types; parseApplicationConfig; buildSchoolSoftUrl; EMPTY_CONFIG
  middleware.ts               # Edge middleware — route protection (auth + roles)
  env.d.ts                    # Cloudflare env type declarations
public/                       # Static assets
drizzle/migrations/           # SQL migration files (applied via wrangler d1 migrations apply)
```

> Some component/file names (e.g. `kurs-card.tsx`/`KursCard`, `kursgrupp-block-editor.tsx`/`KursgruppBlockEditor`, `historia-timeline.ts`/`HistoriaTimeline`) were not part of the structural rename and still carry their original Swedish names — this is expected, not a bug; only routes, DB tables/columns, and role names were renamed.

## Block System

All content pages use a **block system** for freeform page layout. Each page stores a `blocks TEXT` column (JSON array) in D1. Blocks are reorderable, addable, and removable by staff — no code changes needed.

**Block types** (defined in `src/lib/blocks.ts`):
- `section` — heading (optional, toggleable) + rich text body
- `accordion-section` — clickable summary + hidden rich text body
- `slideshow` — optional heading + image carousel
- `profiles` — optional heading + list of DB profile IDs, rendered as ProfileCard grid
- `youtube` — optional heading + YouTube URL + caption; embeds via iframe
- `video` — optional heading + R2 video key + caption; streams from R2 with `preload="metadata"`
- `instagram` — Instagram feed grid via `InstagramFeed` (requires `INSTAGRAM_ACCESS_TOKEN`)

**Hub block types** (hub-page editors only, not regular content pages):
- `nav-group` — optional heading + manual list of navigation items (name, href, image/color), rendered as NavHubCard circle grid
- `course-group` — heading + anchor + body + course picker/filter; renders filtered course lists as KursCard grids

> Legacy block types `two-column`, `departments`, `gallery`, `expandable` and `contact-person` have been removed — do not reintroduce them.

**Hub pages** (nav-group + course-group blocks available, stored in `navHubContent.blocks`): `/education-programs`, `/short-courses`, `/about` — edited via `/studio/nav-hub/[id]`. No fallback — pages show nothing until blocks are added in Studio. `/about-redirect` and `/participant-info` redirect to `/about`.
`/venues` — NavHub with auto-generated venue balls; intro blocks from `venuesContent`, edited via `/studio/nav-hub/[id]` (venues row) / `/studio/venues-content`.
`/venues/[slug]` — Venue detail page; blocks stored in `venue.blocks`, edited via `/studio/manage-venues/[slug]/edit`.

**Fully migrated:** All public pages use blocks exclusively. Legacy `migrateFromSections` fallback code and `links`/card fallbacks have been removed. Do not add `hasBlocks ? renderBlocks : renderFallback` patterns — pages show nothing until content is added in Studio.

**Page headings:** Every content page has `heading`, `headingVisible`, `headingColor` in DB. Studio uses `HeadingStyleEditor` (`enabled={true}` for singleton pages; `enabled={false}` for detail pages News/Course/Venue where title is always shown). Public render: `{headingVisible && heading && <h1 style={{ color: headingColor ?? "#111827" }}>{heading}</h1>}`. New content pages must follow this pattern.

**Shared studio editors** (`src/components/`):
- `BlockCard` — outer shell: label badge, ▲▼ move buttons, ✕ delete
- `BlockToolbar` — "add block" row rendered inside `StudioSaveBar children`
- `SectionBlockEditor` — heading + headingVisible toggle + RichTextEditor
- `AccordionBlockEditor` — summary input + RichTextEditor
- `SlideshowBlockEditor` — image upload grid (requires `uploadPrefix: string` prop)
- `ProfilesBlockEditor` — DB-backed profile picker
- `NavGroupBlockEditor` — manual nav-item list: name, href, ingress, color/image picker (requires `uploadPrefix: string` prop)
- `KursgruppBlockEditor` — course group editor with item picker and display mode
- `YoutubeBlockEditor` — YouTube URL input + optional heading/caption
- `VideoBlockEditor` — R2 video upload (max 200 MB; MP4/WebM/OGG/MOV) + R2 picker ("From R2 (videos/)") + optional heading/caption
- `BallStyleEditor` — color/image styling for NavGroup/CourseGroup balls
- `HeadingStyleEditor` — heading color + visibility toggle (see Page headings above)
- `StudioSectionCard` (`src/components/studio-section-card.tsx`) — studio landing page card with h-full flex layout, typeLabel, content-type badges
- `StudioSectionGrid` (`src/components/studio-section-grid.tsx`) — responsive grid of `StudioSectionCard`

**Public renderers** (`src/components/`):
- `RichTextContent` — renders stored HTML from RichTextEditor
- `AccordionBlock` — styled accordion with green header + animated chevron. Props: `summary`, `children`, `defaultOpen?`
- `AccordionButton` — minimal text-link expand/collapse (used by ProfileCard bio)
- `Slideshow` — image carousel with navigation
- `ProfilesBlockView` — fetches + renders DB profiles as ProfileCard grid
- `NavGroupBlockView` — renders nav-group block as NavHubCard circle grid
- `KursgruppBlockView` — renders course-group block as KursCard grid
- `HubBlocksView` — renders hub-page block arrays (content blocks + nav-group/course-group)
- `KursBlocksView` — renders blocks for course detail pages
- `InstagramFeed` — renders `instagram` block (5-column grid, server-side fetch)
- `YoutubeBlockView` — renders YouTube embed via iframe (`aspect-video`, `max-w-3xl mx-auto`, no rounded corners)
- `VideoBlockView` — renders R2 video (`<video controls preload="metadata">`, `aspect-video`, `max-w-3xl mx-auto`, no rounded corners)
- `VenueView` (`src/components/venue-view.tsx`) — renders compact venue info bar (category badge, capacity, priceInfo, features chips, availableTo). Used at top of `/venues/[slug]`.

**Save pattern:** Studio pages pass an "add block" button row as `children` to `StudioSaveBar` (sticky header). There is **no bottom save button** — `StudioSaveBar` is the only save control.

**Pages using blocks:** All singleton content pages, all hub pages, venue detail pages, and course detail pages (via `KursBlocksView`). Every public content page uses blocks exclusively — no fallback rendering.

## Conventions

- **File naming**: kebab-case for all files and folders (e.g. `weekly-menu.ts`, `auth-client.ts`); the `RadialNav.tsx` / `RadialNav.example.tsx` component pair is a deliberate exception.
- **Components**: One component per file, named with PascalCase (e.g. `NavBar.tsx`)
- **Imports**: Always use the `@/` alias (maps to `src/`) — no relative `../` imports
- **Language**: English throughout — code, comments, route/table/component names, variable names, and all user-facing UI strings (labels, validation messages, placeholders). Only the fictional example school's own in-world identity (Swedish staff names and building names) stays Swedish, as authentic flavor within the seed content. The school's own name and setting are fictional/generic (see Project Overview) and must not be made to resemble any real folk high school.

## Design System

See [DESIGN.md](DESIGN.md) for the full visual design spec (colors, typography, spacing, components).

**Typography — two hard rules** (see `DESIGN.md → Text Size & Text Color`): (1) never use `text-xs` — minimum size is `text-sm`, including badges, counters, breadcrumbs. (2) Dark text on a light background is never lighter than `text-gray-600` — never `text-gray-400`/`500` (darker 700/800/900 is fine). Exception: white/light text on a dark background. When editing, convert `text-xs → text-sm` and `text-gray-400/500 → text-gray-600`, even when mirroring older code.

**Icons** — `lucide-react` is installed. Use it for generic icons (Monitor, Users, Trees, etc.). For school-specific icons without a Lucide equivalent, write a custom inline SVG. Do not introduce other icon libraries.

**format-date.ts** (`src/lib/format-date.ts`) — shared date formatting utility. `fmtDate(d, "short"|"long")` returns `"ospecificerat"` for null. `fmtDateRange(start, end)` returns `"Datum: X – Y"`. Use this on all public course pages instead of inline `toLocaleDateString` calls.

**text-limits.ts** (`src/lib/text-limits.ts`) — shared max-length constants (`name`, `email`, `phone`, `title`, `room`, `description`, `organization`, `shortNote`, `longNote`, `password`, `personalNumber`, `address`, `postalCode`, `city`) for free-text fields in public forms. Import in both the client form (`maxLength` attribute + validation + `CharCounter`) and the corresponding API route (server-side length check) so the two never drift apart. Used by the maintenance-report form, the venue inquiry form, the account forms (sign-in, create-account, forgot/reset-password), and the course application form (`/apply/[code]`). Pair with **CharCounter** (`src/components/char-counter.tsx`) — `<CharCounter value={...} max={...} />` rendered under any field that has a `TEXT_LIMITS` max; turns amber near the limit, red if exceeded.

**ConfirmDeleteButton** (`src/components/confirm-delete-button.tsx`) — shared delete button that opens a centered modal overlay (via `createPortal` to `document.body`) with a confirmation message before calling `onConfirm`. Props: `onConfirm`, optional `loading`, `label` (default in Swedish, "Radera ›"), `message`. Use this everywhere in Studio instead of `window.confirm` — both list pages (news, profiles, departments, manage-courses, manage-stories, manage-venues) and block editors (block-card, slideshow/nav-group/course-group editors).

**Course detail hero images** — rendered full-width edge-to-edge, outside the `max-w-7xl px-4` container, with no `rounded-lg`. Applies to `CourseDetailView`, `summer-courses/course/[slug]/page.tsx`, `evening-courses/course/[slug]/page.tsx`. The image element sits above the content container as a separate full-bleed block.

**ProfileCard** (`src/components/profile-card.tsx`) — circular photo (h-56 w-56 rounded-full overflow-hidden), fallback background `bg-brand-pink`. A visible white ring on some profile photos is caused by the photo file having a white studio background — it is not a CSS issue and cannot be fixed in code.

**Color classes** — always use the `brand-*` Tailwind utilities for the primary colors, never raw hex or `green-*` classes:

| Class                           | Hex       | Usage                                      |
|---------------------------------|-----------|---------------------------------------------|
| `brand-green-light`             | `#E3FFE3` | Hover backgrounds, navbar bottom           |
| `brand-green`                   | `#AFFDAF` | Primary — logo, active links, badges       |
| `brand-green-dark`              | `#4AAD4A` | Borders, darker accents                    |
| `brand-yellow-light`            | `#FFFF99` | Light yellow — backgrounds                 |
| `brand-yellow`                  | `#FFFF50` | Secondary — highlights, about section      |
| `brand-yellow-dark`             | `#C8C800` | Dark yellow — borders, darker accents      |
| `brand-pink-light`              | `#FEE8FE` | Light pink backgrounds                     |
| `brand-pink`                    | `#FDB9FC` | Tertiary — footer, distance courses        |
| `brand-pink-dark`               | `#CC7ACC` | Gradient start for pink sections           |
| `brand-blue-light`              | `#DCEEFF` | Light blue backgrounds                     |
| `brand-blue`                    | `#A0D4FF` | Quaternary — news cards                    |
| `brand-blue-dark`               | `#3A82C8` | Blue hover accents                         |
| `brand-purple-light`            | `#E8E8FF` | Light purple backgrounds                   |
| `brand-purple`                  | `#CBCBFF` | Quinary — NavGroup balls                   |
| `brand-purple-dark`             | `#9898CC` | Purple hover accents                       |
| `brand-parchment-light`         | `#EDE5CE` | Light parchment — NavHubCard default, Dining Hall venue tag |
| `brand-parchment`               | `#DCCDAA` | Parchment — standard for nav-hub cards      |
| `brand-parchment-dark`          | `#C4B080` | Dark parchment                             |
| `brand-parchment-dark-dark`     | `#A89060` | Deep parchment — darkest level, used for text on light parchment |

**Gradients** — use Tailwind v4 syntax (top → bottom):
- Navbar: `bg-linear-to-b from-brand-green to-brand-green-light`
- Pink footer: `bg-linear-to-b from-brand-pink-dark to-brand-pink`

**Buttons** — primary uses `border border-brand-green-dark bg-brand-green text-gray-900 hover:bg-brand-green-dark hover:text-white`. See `ButtonLink` (`src/components/button-link.tsx`) and `.rich-content a.rte-btn` in `globals.css`.

## Rules for Agents

1. **Mobile-first, always** — write base styles for mobile (375px), then add `sm:` / `md:` / `lg:`
   modifiers for wider viewports. Before marking any UI task done, verify:
   - No horizontal scroll at 375px width.
   - All inputs, buttons, and text are readable and tappable without zooming.
   - Tables hide non-critical columns on mobile with `hidden sm:table-cell`.
   - Button rows use `flex-wrap` so they don't overflow.
   - No fixed pixel widths — use `w-full`, `max-w-*`, or responsive classes.
   - **Circular card grids (KursCard, NavHubCard "balls")** must be 1 column on mobile. Use `md:grid-cols-2` (≥768 px) — never `sm:grid-cols-2` (≥640 px) for these grids.
   See `DESIGN.md → Responsiveness & Breakpoints` for the full pattern reference.

   **Automatic hyphenation** — `<html lang="sv">` is set on the root layout. To enable Swedish browser hyphenation on a text element add `hyphens-auto` (Tailwind). Do **not** insert manual soft-hyphens (`­` / U+00AD) in database content — they are invisible in the Studio editor and confuse colleagues. Use `hyphens-auto` in the component instead.

2. **Runtime is Edge** — all server code must be compatible with the Cloudflare Workers
   runtime. Do not use Node.js-only APIs (`fs`, `path`, `crypto` from Node, etc.).
   Use Web Standard APIs instead. The Cloudflare Workers free plan has a 3 MiB compressed
   script limit — avoid adding large browser-only libraries to the server bundle.

   **Tiptap/Prosemirror pattern:** `RichTextEditor` is wrapped in `dynamic({ssr:false})` to
   prevent its large dependency tree from entering the server bundle. Any future component
   that imports Tiptap (or other heavy browser-only libs) must follow the same pattern:
   create a `*-impl.tsx` with the real code and a `*.tsx` thin wrapper using `next/dynamic`
   with `ssr: false`.

3. **D1 does not support explicit transactions** — `db.transaction()` sends `BEGIN`/`COMMIT` which D1 rejects at the REST API layer. Use `db.batch([...])` instead for atomic multi-statement operations. Build an array of Drizzle statements and cast: `db.batch([stmt1, ...rest] as Parameters<typeof db.batch>[0])`.

4. **App Router only** — use `src/app/` conventions. No `pages/` directory.

5. **Server Components by default** — only add `"use client"` when the component
   genuinely requires browser APIs or React state/effects.

6. **TypeScript strictly** — no `any`, no `@ts-ignore` without a comment explaining why.

7. **All content via Drizzle/D1** — editorial content (courses, news, menus, pages) and
   structured data (users, applications, enrollments) all live in Cloudflare D1
   accessed through Drizzle ORM. Do not hardcode content in components.

8. **Media via R2** — store file metadata (filename, R2 key, mime type, size) in D1;
   store the actual file bytes in R2.

9. **Auth via Better Auth** — do not implement custom auth logic. Use Better Auth's
   session and role utilities.

10. **Swedish content** — UI strings shown to website visitors should be in Swedish.
    Code, comments, and variable names stay in English.

11. **No unnecessary abstractions** — do not add helpers, wrappers, or utilities for
    one-off operations. Three similar lines of code is better than a premature abstraction.

## Environment Variables

See `.env.local.example` for required environment variables.
Never commit real secrets.

All env vars are declared in `src/env.d.ts` (Cloudflare Workers bindings):

| Variable | Used for |
|---|---|
| `DB` | Cloudflare D1 binding |
| `STORAGE` | Cloudflare R2 binding |
| `BETTER_AUTH_SECRET` | Better Auth session signing |
| `BETTER_AUTH_URL` | Better Auth base URL |
| `NEXT_PUBLIC_APP_URL` | App base URL |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Gmail API — service account (transactional email, see EMAIL.md) |
| `GOOGLE_PRIVATE_KEY` | Gmail API — service account private key (PEM) |
| `GOOGLE_SENDER_EMAIL` | Gmail API — Workspace address mails are sent from |
| `INCIDENT_EMAIL` | Maintenance-report recipient for IT issues — incident@example.com |
| `FASTIGHET_EMAIL` | Maintenance-report recipient for janitorial issues (electrical, plumbing, cleaning, other) — fastighet@example.com |
| `ADMIN_EMAIL` | Fallback recipient when the category-specific vars are unset |
| `MOTESPLATS_EMAIL` | Venue-inquiry recipients (comma-separated; falls back to `ADMIN_EMAIL`) |
| `ANSOKAN_EMAIL` | Course-application recipient — new applications from `/apply/[code]` (falls back to `ADMIN_EMAIL`) |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile — public key, passed to client widget |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile — secret key, used for server-side validation |
| `INSTAGRAM_ACCESS_TOKEN` | Instagram Graph API — long-lived token (expires after 60 days, refresh manually) |

> Note: `FASTIGHET_EMAIL`, `MOTESPLATS_EMAIL`, and `ANSOKAN_EMAIL` keep their original Swedish names — the structural rename covered route segments, DB tables/columns, and role names, not these specific env var names.

Dev values are in `.dev.vars`. Turnstile uses Cloudflare's always-passing test keys in dev (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`).

## Do Not

- Do not use the Pages Router — this project uses App Router exclusively.
- Do not use `any` in TypeScript — always type properly.
- Do not commit `.env` or `.env.local` files.
- Do not add unnecessary abstractions or helpers for one-off operations.
