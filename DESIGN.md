# DESIGN.md — School CMS Demo

Visual design guidelines for the CMS's example implementation.
This document is the single source of truth for colors, typography, spacing, and component patterns.

---

## Design Principles

1. **Warm and welcoming** — Folk education is about people meeting. The design should feel open and inviting, not sterile or corporate.
2. **Scandinavian calm** — Generous whitespace. Few elements per view. Nothing that shouts for attention.
3. **Clear hierarchy** — Visitors should always know where they are and what the next step is.
4. **Accessibility first** — WCAG 2.1 AA minimum. Contrast, focus rings, semantic HTML.

---

## Color Palette

The palette is built on one image: **sea, sky and sunset**. A visitor scrolling the
page passes through it in order — sky at the top (header), the sunset on the
horizon in the middle (the Why Us band), and deep sea at the bottom (footer).

The token *names* are historical (`brand-green`, `brand-yellow`, `brand-pink`)
and were kept so the change didn't have to touch ~200 call sites; only the values
moved. The labels shown to editors in Studio's colour picker name the colour as
it actually looks. `src/lib/brand-colors.ts` duplicates these hex values for
inline styles and must be kept in sync with `globals.css`.

### Primary colors

| Tailwind class       | Hex       | Reads as   | Usage                                                    |
| -------------------- | --------- | ---------- | -------------------------------------------------------- |
| `brand-green-light`  | `#E3F1F9` | Light sky  | Hover backgrounds, navbar bottom                          |
| `brand-green`        | `#A6CFE6` | Sky        | Primary accent — navbar, active links, course cards       |
| `brand-green-dark`   | `#1F5A78` | Deep sky   | Borders, active nav link, primary-button hover, rich-text links |
| `brand-yellow-light` | `#FCE7CE` | Light sunset | Light backgrounds                                       |
| `brand-yellow`       | `#F6C68F` | Sunset     | Secondary accent — Why Us band (top), summer courses      |
| `brand-yellow-glow`  | `#F2B183` | Sunset coral | Bottom stop of the Why Us gradient only                 |
| `brand-yellow-dark`  | `#8E4A16` | Dark sunset | Borders, darker accents                                  |
| `brand-pink-light`   | `#FCE0DA` | Light coral | Studio table rows, light backgrounds                     |
| `brand-pink`         | `#F5C2B8` | Coral      | Tertiary accent — distance education, restaurant section  |
| `brand-pink-dark`    | `#9C4436` | Dark coral | BlockCard header (**dark — carries light text**), badge text |
| `brand-deep-sea`     | `#17506A` | Sea        | Footer gradient, top stop                                 |
| `brand-deep-sea-dark`| `#0F3644` | Deep sea   | Footer gradient, bottom stop                              |
| `brand-sea-foam`     | `#C3DAE2` | Sea foam   | Muted text on the footer's dark ground                    |
| `brand-blue-light`   | `#DCEEFF` | —          | Light blue backgrounds                                    |
| `brand-blue`         | `#A0D4FF` | —          | Quaternary accent — news cards                            |
| `brand-blue-dark`    | `#3A82C8` | —          | Blue hover accents                                        |
| `brand-purple-light` | `#E8E8FF` | —          | Light purple backgrounds                                  |
| `brand-purple`       | `#CBCBFF` | —          | Quinary accent — NavGroup balls, NavHubCard default        |
| `brand-purple-dark`  | `#9898CC` | —          | Purple hover accents                                      |

**Two dark tokens.** `brand-deep-sea` / `brand-deep-sea-dark` and `brand-pink-dark`
are the only brand colours that carry *light* text. Everything else is a light
surface for dark text. Don't put `text-gray-*` on them.

**Known overlap.** `brand-green` (sky, `#A6CFE6`) now sits close to `brand-blue`
(`#A0D4FF`) — an RGB distance of 26. They rarely meet in the UI, but they sit
side by side in `BrandColorPicker`. Moving `brand-blue` deeper was tried and
rejected: every darker blue drops `text-gray-600` below 4.5:1. Fixing it properly
means renaming tokens to their roles, which is a separate pass.

### Parchment palette

Used for nav-hub cards (`NavHubCard`) and `BrandColorPicker`. All levels are Tailwind utilities via `@theme inline`.

| Tailwind class                | Hex       | Description                             |
| ------------------------------ | --------- | ---------------------------------------- |
| `brand-parchment-light`        | `#EDE5CE` | Light parchment                          |
| `brand-parchment`              | `#DCCDAA` | Standard (= `rgb(220,205,170)`)          |
| `brand-parchment-dark`         | `#C4B080` | Dark parchment                           |
| `brand-parchment-dark-dark`    | `#A89060` | Deep parchment — darkest level           |

### Neutrals

| Name          | Hex       | Tailwind   | Usage                    |
| ------------- | --------- | ---------- | ------------------------- |
| White         | `#ffffff` | `white`    | Header background, cards |
| Parchment     | `#FDFCF8` | raw hex (DB default, not a Tailwind token) | Page background top (gradient start) |
| Parchment dark | `#F7F4ED` | raw hex (DB default, not a Tailwind token) | Page background bottom (gradient end) |
| Light gray    | `#f9fafb` | `gray-50`  | Table rows, summaries    |
| Border gray   | `#e5e7eb` | `gray-200` | Borders, dividers        |
| Body text     | `#111827` | `gray-900` | Headings                 |
| Secondary text | `#4b5563` | `gray-600` | Body copy, descriptions, metadata, placeholders — **lightest allowed** for dark text on a light background (see Text Size & Text Color) |

### Page background

`<body>` has a subtle parchment gradient: `linear-gradient(to bottom, #FDFCF8 0%, #F9F6EE 100%)`. The gradient spans the full document height (not `fixed`). The footer has its own background (the deep-sea gradient) that covers the parchment.

---

## Typography

Font choice is driven dynamically via CSS variables set in the root layout based on D1 data (the `typographySettings` table). The choice is made in **Studio → Style Templates**.

| CSS variable  | Controls      | Tailwind class               |
| ------------- | ------------- | ---------------------------- |
| `--font-h1`   | `h1`          | `text-4xl font-bold tracking-tight` |
| `--font-h2`   | `h2`          | `text-3xl font-bold`         |
| `--font-h3`   | `h3`          | `text-2xl font-bold`         |
| `--font-body` | `body` + UI   | `text-base leading-relaxed`  |

**Default font:** Geist Sans (`var(--font-geist-sans)`) — active until another font is chosen in Style Templates.

**Available fonts (18 total):** See [FONTS.md](FONTS.md) for the full list with character descriptions and pairing tips. Geist loads via `next/font/google`; the rest load via a shared Google Fonts `<link>` tag in the root layout.

**Heading-only fonts** (not shown in the body-text picker): Montserrat Underline, Germania One, Concert One, Courgette, Parisienne, Lugrasimo.

### Text Size & Text Color (hard rule)

Two unconditional rules for all text in the codebase:

1. **No text smaller than `text-sm`.** Never use `text-xs` — not even on badges, character counters, breadcrumbs, or status labels. The smallest allowed size is `text-sm`.
2. **Dark text on a light background: never lighter than `text-gray-600`.** Never use `text-gray-400` or `text-gray-500`. Darker shades (`gray-700/800/900`) are allowed. This also applies to intentionally muted text (placeholders, disabled buttons, metadata).
   - **Exception:** white/light text on a dark background (e.g. `text-white` on a dark button or section) is unaffected — the rule only applies to dark text on a light background.

When adding or editing components: always convert `text-xs → text-sm` and `text-gray-400/500 → text-gray-600`, even when mirroring older code that happens to break the rule.

---

## Responsiveness & Breakpoints

**Rule: always mobile-first.** Write base CSS for mobile, then add `sm:` / `md:` / `lg:` for wider viewports. Never test on desktop only.

| Prefix  | Breakpoint | Typical usage                    |
| ------- | ---------- | --------------------------------- |
| (none)  | 0px+       | Mobile — base, always            |
| `sm:`   | 640px+     | Tablet portrait, wide phone      |
| `md:`   | 768px+     | Tablet landscape                 |
| `lg:`   | 1024px+    | Desktop                          |

### Required mobile patterns

| Element           | Mobile                                                      | Desktop                         |
| ----------------- | ------------------------------------------------------------ | -------------------------------- |
| Card grid          | 1 column                                                    | `sm:grid-cols-2 lg:grid-cols-3` |
| Navigation links  | Hidden, hamburger menu                                       | `sm:flex`                       |
| Forms             | Full-width inputs (`w-full`)                                 | Full-width inputs (`w-full`)    |
| Studio tables     | Columns with `hidden sm:table-cell` for non-critical fields  | All columns visible             |
| Hero heading      | `text-4xl`                                                   | `sm:text-5xl`                   |
| Button rows       | `flex flex-wrap gap-3`                                       | `flex gap-4`                    |

### What agents should verify

Before marking a page or component done:

1. Inputs, buttons, and text are readable and clickable without zoom at 375px width.
2. No horizontal scroll on mobile (`overflow-x` should not occur).
3. Tables with many columns hide non-critical columns on mobile with `hidden sm:table-cell`.
4. Button rows (`flex`) use `flex-wrap` so they don't clip.
5. No fixed pixel widths (`w-[400px]` etc.) — use responsive classes or `max-w-*`.

---

## Spacing & Layout

- **Max width:** `max-w-[1295px]` centered with `mx-auto px-4`
- **Page padding:** `py-12` for content sections, `py-16` for hero/feature sections
- **Card gap:** `gap-6` in grids
- **Buttons:** `px-6 py-3` (primary), `px-4 py-2` (secondary)

---

## Components

Color references use `brand-*` Tailwind classes (defined via `@theme inline` in `globals.css`).
See the table in `AGENTS.md → Design System` for the full list.

### Navbar

- Background: the sky gradient — `bg-linear-to-b from-brand-green to-brand-green-light`, `sticky top-0 z-50`
- Border: `border-b border-brand-green-dark/20` at rest, swapped for `shadow-md` once scrolled past 4px
- Logo: `text-base font-black tracking-[0.22em] uppercase text-gray-900` + a tagline line beneath it
- Active link: `bg-white/50 text-brand-green-dark` (5.91:1 — the deep-sky token exists to make this pass AA)
- Inactive link: `text-gray-700 hover:bg-white/40 hover:text-gray-900`
- Mobile: hamburger menu (toggle), full-width dropdown on `bg-brand-green-light`
- **No auth UI in the navbar.** `nav.tsx` has no session logic at all — signed-in state lives in the footer (see below).

### Footer

- Background: `bg-linear-to-b from-brand-deep-sea to-brand-deep-sea-dark` — the only dark surface on the site
- Layout: desktop uses an inline `flex-wrap` row with school name + SVG icons + copyright; mobile stacks the blocks vertically.
- **Auth lives here**, not in the navbar: role links (Admin / Studio / Restaurant / Facilities), sign-in/sign-out, and a "Signed in as" line, all desktop-only (`hidden lg:flex`).
- Icons: inline SVG, `h-5 w-5`, `text-brand-sea-foam hover:text-white`
- Text: `text-white` for the school name; links use `text-brand-yellow hover:text-white` — the sunset gold from the band above, returning against the water (5.60:1)
- Copyright: `text-sm text-brand-sea-foam` (6.04:1)
- The footer reads the session and owns the reduced-motion toggle, so it is a Client Component.

### Hero section (homepage)

- Background: full-screen video (`h-[80vh]`, `overflow-hidden bg-gray-800` as fallback). Rendered via `HeroVideo` (`src/components/hero-video.tsx`) — a Client Component that sets `playbackRate = 0.5`. The video file `videos/hero.mp4` is stored in Cloudflare R2 and served via `mediaUrl()` (`/api/media/videos/hero.mp4`).
- Heading: `text-4xl sm:text-5xl font-bold tracking-tight text-gray-900`
- Primary button: `border border-brand-green-dark bg-brand-green text-gray-900` with hover `bg-brand-green-dark text-white`
- Secondary button (outline): `border border-gray-900 text-gray-900`

### Cards

**KursCard** (`src/components/kurs-card.tsx`) — circular course card. Used on course-listing pages and via the `course-group` block.

- Shape: `aspect-square rounded-full` — always circular
- Image: `fill object-cover` background-filled circle
- Gradient overlay: `transparent 60% → rgba(220,205,170,0.6) 64% → rgba(220,205,170,0.95) 70%` — parchment-colored, visible at the bottom (colorable via `bandColor`)
- Content (bottom, centered): title → course type + delivery-mode icon (same row) → date range
- Delivery-mode icons: inside gray circles (`h-8 w-8 rounded-full bg-gray-200`). Lucide icons for Monitor, Users, Trees; custom SVG for campus.
- Props: `title`, `titleColor?`, `href`, `imageKey?`, `courseType?`, `deliveryMode?`, `startDate?`, `endDate?`, `bandColor?`
- **No** legacy props: accent, excerpt, meta, badges, studyPace — do not add them back

**NavHubCard** (`src/components/nav-hub-card.tsx`) — circular navigation card for the hub pages `/about`, `/education-programs`, `/short-courses`, `/venues` (`/about-redirect` and `/participant-info` redirect to `/about`).

- Shape: `aspect-square rounded-full` — always circular
- Background: hex value via `getColorHex(color)` (imported from `brand-color-picker`), default `brand-parchment`
- Content: name (`text-sm font-semibold`) + optional ingress (`text-sm`), centered
- Props: `name`, `href`, `ingress?`, `color?` (token string from `BRAND_COLORS`)
- Color choice is handled via `BrandColorPicker` in Studio
- Grid on public hub pages: `grid-cols-1 sm:grid-cols-4`

**BrandColorPicker** (`src/components/brand-color-picker.tsx`) — reusable color picker for studio editors.

- Shows 15 primary colors (green/yellow/pink/blue/purple × light/base/dark) defined in `src/lib/brand-colors.ts`
- Colors are stored and rendered with hex values directly (not CSS variables in inline styles)
- Active color is marked with a green ring; inactive ones have a gray ring
- Props: `value`, `onChange`, `label?`, `defaultToken?` — if `defaultToken` is given, "(optional — default: X)" and a "Reset" button appear when the value differs
- Exports `BRAND_COLORS`, `BrandColorToken`, and the helper function `getColorHex(token)`

**NewsCard** — fixed top border: `border-t-brand-blue`, hover `group-hover:text-brand-blue-dark`

Other cards share the base classes: `rounded-lg border border-gray-200 border-t-4 p-6 hover:shadow-md transition-shadow`

Grid: `md:grid-cols-2` or `md:grid-cols-2 lg:grid-cols-3` — always **1 column on mobile** (< 768 px). Never use `sm:grid-cols-2` for circular balls.

### ProfileCard

Staff card for personnel lists, shown on `/contact` (grouped by department) and on `/about/association` for the board.

- Outer wrapper: `flex flex-col items-center text-center gap-4 p-6` — no `overflow-hidden`
- Avatar: `h-56 w-56` round image with `object-cover`, fallback = initials in `text-5xl font-semibold` against `bg-brand-pink`
- Name: `text-lg font-medium text-gray-900`
- Titles per department: `text-sm font-bold italic text-gray-700`
- Phone: "Switchboard: XXXX" / "Direct: XXXX" — `text-sm text-gray-600`
- Email: `<a href="mailto:...">` with underline-offset — **always clickable**
- **Bio toggle:** if `bio` exists, a "Read more/Close" button is shown via `AccordionButton`. The bio expands downward with a `grid-rows-[0fr → 1fr]` animation. The bio is rendered with `RichTextContent` and the class `rich-content`.
- Server Component (no `"use client"` — delegated to `AccordionButton`).

### AccordionButton

Minimal expand/collapse component styled as a text link. Used for the bio toggle in `ProfileCard`.

```tsx
<AccordionButton label="Read more" closeLabel="Close">
  {/* optional content */}
</AccordionButton>
```

- Animation: `grid-template-rows: 0fr → 1fr`, 300 ms ease-in-out
- The button swaps text between `label` (closed) and `closeLabel` (open)
- Props: `label`, `closeLabel?`, `defaultOpen?`, `triggerClassName?`
- Client Component (`"use client"` + `useState`)
- File: `src/components/accordion-button.tsx`

### AccordionBlock

Styled accordion for public pages and the Studio landing page. Sky header (`brand-green-light`), animated chevron, smooth `grid-rows` animation.

```tsx
<AccordionBlock summary="Show more" defaultOpen>
  {/* optional content */}
</AccordionBlock>
```

- Header: `bg-brand-green-light` (light sky), `border border-gray-200`, `rounded-xl`
- Chevron rotates 90° when the accordion is open (300 ms ease-in-out)
- Content is animated with `grid-rows-[0fr → 1fr]`, 300 ms ease-in-out
- Props: `summary`, `children`, `defaultOpen?` (boolean, default `false`)
- Client Component (`"use client"` + `useState`)
- File: `src/components/accordion-block.tsx`
- Used by the block system (block type `accordion-section`) and the Studio landing page's navigation groups

### VenueView

Compact info row at the top of venue pages. Renders category badge, capacity, price info, and features chips.

```tsx
<VenueView venue={venueData} />
```

- Category badge: one `brand-*-light` / `brand-*-dark` pair per category — Conference Room=blue, Event Venue=coral (`brand-pink`), Sports Hall=sky (`brand-green`), Classroom=sunset (`brand-yellow`), Dining Hall=parchment, Other=gray
- Features chips: `rounded-full border bg-gray-50`
- File: `src/components/venue-view.tsx` — Server Component
- Used only on `/venues/[slug]`

### SoapBubbles

Decorative interactive FAB — a face silhouette SVG that blows iridescent soap bubbles. Can be placed anywhere via the `className` prop.

- File: `src/components/soap-bubbles.tsx` — Client Component (`"use client"`)
- **Placement is controlled by the caller** via the `className` prop (default: `fixed bottom-28 left-3 md:left-12 z-40`). The component does not decide its own position.
- **Fully hidden on mobile** — `matchMedia("(min-width: 768px)")` with a lazy `useState` initializer for SSR safety; returns `null` if `!isDesktop`
- Rendering: three DOM layers — canvas (visual, `pointer-events: none`), per-bubble hit-area divs (z-41, `pointer-events: auto`), face SVG (clickable)
- Animation: `requestAnimationFrame` loop on canvas, no external libraries
- The face SVG: cheeks scale via CSS `transform scale()` + `transition`, eyes squeeze together (`scaleY`), eyebrows rotate, the trumpet is rotated with `<g transform="rotate(-60, 72, 80)">` and is always visible
- **Bubble movement:** bubbles start with `vx = 0` (straight up); after 1.8 s a `targetVx` (1.6–3.2 px/frame) is set and the movement is smoothly interpolated with lerp (`vx += (targetVx - vx) * 0.06`)
- **Wind streaks:** white (`rgba(255,255,255,1)`), `lineWidth 5`, placed at ~40% of screen height, slow movement (`vx 0.3–0.8`), long lifetime (`alpha -= 0.007`, ~2–3 s). Sweep in from the left viewport edge at the same time the wind reaches the bubbles.
- Bubble effects: iridescent rotating gradient + radial edge glow + mirrored highlight per bubble; bubbles pop against the navbar with a color splatter
- Number of bubbles per click: random 3–8, spread over time
- Test page: `/bubbles`

### Breadcrumbs

Navigation trail shown directly below the navbar on all public and studio pages (except the homepage and the portal pages `/restaurant-admin` and `/admin`).

- File: `src/components/breadcrumbs.tsx` — Client Component (`"use client"` + `usePathname()`)
- **Sticky:** `sticky top-16 z-40` — sticks just below the navbar when scrolling
- Background: `bg-white border-b border-gray-100 print:hidden`
- Layout: `mx-auto max-w-7xl px-4 py-1.5`, horizontally scrollable on overflow
- Text: `text-sm text-gray-600` for clickable links, `hover:text-gray-700` on hover
- Separator: `/` in `text-gray-300`
- Current page: `text-gray-600` (no link)
- "Home" always shows as the first link
- The last level shows without a link (marks the current page)
- Semantics: `<nav aria-label="Breadcrumbs"><ol>…</ol></nav>`

### Block system (Studio)

Several CMS pages use a block-based system for freeform page layout. Each page stores a `blocks TEXT` column (JSON array) in D1. Blocks are reorderable, addable, and removable by staff without code changes.

**Block types** (defined in `src/lib/blocks.ts`):
- `section` — heading (optional, toggleable, colorable) + rich text body
- `accordion-section` — clickable summary + hidden rich text content
- `slideshow` — optional heading + image carousel
- `profiles` — optional heading + list of profile IDs from DB, rendered as a ProfileCard grid
- `nav-group` — optional heading + manual list of navigation items (name, href, ingress, color/image); used on hub pages
- `course-group` — heading + anchor + body + course selection; used on hub and homepage
- `youtube` — optional heading + YouTube URL + caption; rendered as an iframe
- `video` — optional heading + R2 key + caption; streamed from R2
- `instagram` — Instagram feed (5-column square grid via `InstagramFeed`); requires `INSTAGRAM_ACCESS_TOKEN`

**YouTube and Video — visual rules:**
- Container: `max-w-3xl mx-auto` — same width as the slideshow figure (`max-w-3xl mx-auto` in `Slideshow`)
- Aspect ratio: `aspect-video w-full overflow-hidden`
- **No rounded corners** — `rounded-*` should not be used on video or YouTube containers
- Shadow: `shadow-sm`
- Video background: `bg-black`
- Caption: `mt-2 text-sm text-gray-700` — applies to YouTube, video, and slideshow (alt text in `<figcaption>`)

**Shared studio components:**
- `BlockCard` (`src/components/block-card.tsx`) — outer shell for all blocks in the editor: label badge, ▲▼ move, ✕ delete. Omit `onDelete` to make a block non-deletable.
- `HeadingStyleEditor` (`src/components/heading-style-editor.tsx`) — color picker (white/dark) + visibility checkbox for headings. Used in all block editors and on all studio content pages. `enabled={false}` locks the visibility checkbox (always on) — used for detail pages where the title should always show.
- `SectionBlockEditor` (`src/components/section-block-editor.tsx`) — editor for `section` blocks: heading + HeadingStyleEditor + RichTextEditor
- `AccordionBlockEditor` (`src/components/accordion-block-editor.tsx`) — editor for `accordion-section` blocks: clickable text (button) + RichTextEditor
- `SlideshowBlockEditor` (`src/components/slideshow-block-editor.tsx`) — editor for `slideshow` blocks: image list with ImageUpload + alt text + HeadingStyleEditor
- `ProfilesBlockEditor` (`src/components/profiles-block-editor.tsx`) — editor for `profiles` blocks: DB-driven profile picker + HeadingStyleEditor
- `NavGroupBlockEditor` (`src/components/nav-group-block-editor.tsx`) — editor for `nav-group` blocks: ball list with name, href, ingress, color/image
- `KursgruppBlockEditor` (`src/components/kursgrupp-block-editor.tsx`) — editor for `course-group` blocks: course picker with filter mode and ball style
- `YoutubeBlockEditor` (`src/components/youtube-block-editor.tsx`) — editor for `youtube` blocks: URL input + HeadingStyleEditor + caption
- `VideoBlockEditor` (`src/components/video-block-editor.tsx`) — editor for `video` blocks: R2 upload (max 200 MB, MP4/WebM/OGG/MOV) + R2 picker + HeadingStyleEditor + caption

**R2 library buttons:** Button text should show the folder path, e.g. `From R2 (history/)`. Applies to both `ImageUpload` (image) and `VideoBlockEditor` (video).

**StudioSaveBar** (`src/components/studio-save-bar.tsx`) — sticky save bar below the navbar (`top-16 z-30`). Three states: saved (green), unsaved changes (amber), error (red). **The height is always stable** — buttons always render but are `invisible` in the saved state (no layout jumps). Accepts `children` (e.g. "add block" buttons) in the same wrapper. There is **no** bottom save button — StudioSaveBar is the only save control.

### Primary button

```
rounded-md px-6 py-3 font-semibold text-gray-900
border border-brand-green-dark bg-brand-green
hover:bg-brand-green-dark hover:text-white transition-colors
```

### Secondary button / link

```
font-medium underline-offset-2 hover:underline text-gray-900
```

### Badge

```
rounded-full px-2 py-0.5 text-sm font-medium text-gray-900
bg-brand-yellow   ← education
bg-brand-green    ← approved/study-aid eligible
bg-brand-pink     ← other
```

---

## Page Templates

| Page                        | Layout                                              |
| ---------------------------- | --------------------------------------------------- |
| Homepage                    | Hero → Education programs (featured) → About (teaser) |
| Education Programs          | Heading + ingress → blocks (NavGroup/CourseGroup)   |
| Summer Courses              | Heading + ingress → card grid                        |
| `/about`                    | Hub page with NavGroup balls to sub-pages            |
| `/about/association`        | Heading → body text + image → optional staff list    |
| `/about/apply`               | Heading → application-period table                   |
| `/about/study-guidance`      | Heading → body text + contact info                   |
| `/about/careers`             | Heading → list of open positions                     |
| Restaurant (`/restaurant`)   | Weekly menu table → allergen information             |
| `/venues`                    | NavHub — intro block (NavGroup etc.) + auto-generated venue balls (NavHubCard) |
| `/venues/[slug]`             | Venue detail — hero image (full bleed) + VenueView info row + free blocks + inquiry form |
| Boarding                     | Block-based (image gallery, expandable image, section, accordion) |
| Contact                      | Address + map → contact form                          |

---

## Image Style

- Photographic style: real photos from the school — students, environment, nature
- No stock photos
- Image format: landscape (16:9 or 3:2) for hero/banner, square for staff cards
- Images are stored in Cloudflare R2

---

## Studio (admin UI)

Studio pages under `/studio/*` share the same layout (nav + footer + breadcrumbs) as public pages but have a clear visual marker:

- Breadcrumbs: a global breadcrumb trail is shown below the navbar on all studio pages (same component as public pages, see the Breadcrumbs section above)
- Tables: `overflow-hidden rounded-lg border border-gray-200`, header `bg-gray-50`
- Action buttons: Edit `border border-gray-300 text-gray-700`, Delete `border border-red-200 text-red-600`
- Form fields: `border border-gray-300 focus:border-brand-green focus:ring-1 focus:ring-brand-green`
- Studio button in the navbar: pill-shaped with `border`, active = `border-brand-green text-brand-green`

---

## Other

- Icons: **`lucide-react` is installed** and used for delivery-mode icons in `KursCard`. Use Lucide when there are 4+ icons and Lucide covers the need. For school/venue-specific icons without a Lucide equivalent (e.g. the campus building's gable roof) — draw a custom inline SVG. Do not mix in other icon libraries.
- Animations: generally only `transition-colors`, `transition-shadow`. Canvas-based animations (canvas + `requestAnimationFrame`) are allowed for decorative FABs — see `SoapBubbles` above. No external animation libraries.
- Dark mode: not implemented — `globals.css` has no dark-mode overrides. Tailwind utility classes always apply.
- All public content pages and studio lists use `max-w-[1295px]` as the max width. Studio forms and detail pages may use `max-w-2xl` / `max-w-3xl` for readability.
