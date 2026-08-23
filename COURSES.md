# COURSES — Data Model

Living documentation for the `Course` object in the database, using
the Demo Folk High School example implementation's content.
Update this file on every schema change.

---

## Files

| File                                                  | Purpose                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/lib/db/schema.ts`                                | Drizzle table `course`                                                                                 |
| `drizzle/migrations/0001_init.sql`                    | Consolidated schema migration (creates `Course` and all other tables in one shot)                      |
| `src/app/api/courses/route.ts`                        | GET (list, `?type=`) + POST                                                                            |
| `src/app/api/courses/[slug]/route.ts`                 | GET + PUT + DELETE per slug                                                                             |
| `src/app/studio/manage-courses/page.tsx`              | Studio CRUD list with type tabs (all / education programs / summer courses / evening courses / short courses) |
| `src/app/studio/manage-courses/new/page.tsx`          | Create a new course                                                                                     |
| `src/app/studio/manage-courses/[slug]/edit/page.tsx`  | Edit an existing course                                                                                 |
| `src/components/kurs-blocks-view.tsx`                 | Public renderer for course blocks (below the course data)                                               |

---

## Migration status

**The migration is complete.** `Course` is the only course table — the legacy tables `Program`, `SummerCourse`, and `EveningCourse` have been removed from the schema, along with their API routes. All public course pages and Studio read from `Course` via `/api/courses`.

Schema changes after the unification:

- `parentProgramId` → `parentKursId`
- `applicationText` + `locationText` added
- `durationWeeks`, `sessionCount`, `sessionDuration` removed
- Table renamed `Kurs` → `Course`, column `kursId` → `courseId` on `CourseInstance`/`CourseDepartment`

---

## Studio separation

**`/studio/manage-courses`** — CRUD list for individual `Course` objects. Type tabs: All / Education Programs / Summer Courses / Evening Courses / **Short Courses** (MHFA + SMF). Also contains New Course and Edit Course.

## Course detail page — layout

`CourseDetailView` (`src/components/course-detail-view.tsx`) is an async Server Component used by all course detail pages (`/education-programs/[slug]`, `/summer-courses/course/[slug]`, `/evening-courses/course/[slug]`, and more).

- Fetches a random published `ParticipantStory` where `courseName = item.title` via `ORDER BY RANDOM() LIMIT 1`.
- Renders a two-column grid directly below the ingress text: course data (`dl`) in the left column (2fr), `ParticipantStoryCard` in the right column (3fr). The story card only shows if a story is found.
- The course names in `ParticipantStory.courseName` match `Course.title` (free text — no FK). Make sure the course name is written identically in the Studio story form and the course's title in manage-courses.

---

## Studio form (`/studio/manage-courses/[slug]/edit`)

- All course types share the same form — no per-type field filtering.
- Required fields: Course Type, Delivery Mode, Title, Ingress, Start Date.
- Start Date has an "Update later" checkbox → saves `null`, shown as "unspecified" publicly.
- **The `description` field (RichTextEditor) has been removed from the form.** The field still exists in the DB and keeps its last saved value, but can no longer be edited via Studio.
- **"Extra content" (the block editor)** is placed last in the form (after Image), replacing the description field as the primary free-text tool.
- The hero image (`imageKey`) renders full-width edge-to-edge on public detail pages (outside the `max-w-7xl` container).

---

---

## Table: `Course`

### Type and delivery

| Column         | Type | Nullable | Description                                                  |
| -------------- | ---- | -------- | ------------------------------------------------------------ |
| `courseType`   | text | no       | Discriminator — see enum below                                |
| `deliveryMode` | text | yes      | How the course is delivered — see enum below                  |
| `parentKursId` | text | yes      | FK → `Course.id`. Set if a course/track belongs to a program (column name kept from before the table rename; was `parentProgramId` before migration 0060) |
| `schoolsoftId` | text | yes      | **Legacy/seed source.** The SchoolSoft ID is now handled per course instance (`CourseInstance.schoolsoftId`), not in the course form. The column is kept as a seed source for course instances. |

**`courseType` values:**

- `program` — Long-form education (General Course, Art School, Health Coach, etc.)
- `program_track` — A track within a program (belongs to a `program` via `parentKursId`)
- `short` — Short course (MHFA, SMF)
- `summer` — Summer course
- `evening` — Evening course

**`deliveryMode` values:**

- `campus` — On-site instruction, no distance component
- `distance_hybrid` — Distance course WITH in-person sessions
- `distance_pure` — Distance course WITHOUT in-person sessions (online summer course)
- `outdoor` — Outdoor/nature summer course

> **Studio UI:** All four options are selectable for every course type. There is no filtering per `courseType` — it's the course editor's responsibility to pick the right combination.

---

### Common fields

| Column         | Type          | Nullable | Description                                                                                             |
| -------------- | ------------ | -------- | ------------------------------------------------------------------------------------------------------- |
| `id`           | text PK      | no       | Nano-ID / UUID                                                                                            |
| `slug`         | text UNIQUE  | no       | URL slug, e.g. `allman-kurs`                                                                              |
| `title`        | text         | no       | Course name                                                                                                |
| `excerpt`      | text         | no       | Ingress/short description                                                                                 |
| `description`  | text         | no       | Rich text as JSON                                                                                          |
| `imageKey`     | text         | yes      | R2 key for the cover image                                                                                 |
| `headingColor` | text         | yes      | Heading color (hex) — edited via `HeadingStyleEditor` with `enabled={false}` in Studio. Always visible.    |
| `isPublished`  | boolean      | no       | Shown on the site                                                                                          |
| `startDate`    | timestamp_ms | yes      | Course start. `null` = date not set ("Update later" in Studio — shown as "unspecified" publicly)          |
| `endDate`      | timestamp_ms | yes      | Course end (null for evening courses and programs)                                                        |
| `spots`        | integer      | yes      | Number of spots                                                                                            |
| `createdAt`    | timestamp_ms | no       |                                                                                                             |
| `updatedAt`    | timestamp_ms | no       |                                                                                                             |

---

### Course length & study pace

| Column      | Type    | Nullable | Description                                    |
| ----------- | ------- | -------- | ----------------------------------------------- |
| `duration`  | text    | yes      | Display text: "2 terms", "15 weeks"             |
| `studyPace` | integer | yes      | Study pace as a percentage: `25`, `50`, `75`, `100` |

> `durationWeeks` (a machine-readable week count) was removed in migration 0069.

---

### Study aid

| Column          | Type | Nullable | Description                                 |
| --------------- | ---- | -------- | ------------------------------------------- |
| `studyAidLevel` | text | yes      | Study-aid level — replaces `csnEligible` (boolean) |

**`studyAidLevel` values:**

- `compulsory` — Study aid at compulsory-school level
- `upper_secondary` — Study aid at upper-secondary level
- `post_secondary` — Study aid at post-secondary level
- `none` — Not eligible for study aid

---

### Accommodation

| Column             | Type    | Nullable | Description                       |
| ------------------ | ------- | -------- | ---------------------------------- |
| `hasAccommodation` | boolean | no       | The course offers/includes accommodation |

> **`accessibilityTags`** remains in the DB schema but is **not** exposed in the Studio form or the API. The field is no longer written to. The accessibility section was removed from Studio.

---

### Program-specific fields (null for summer/evening)

| Column            | Type | Nullable | Description                                                                                                                                     |
| ----------------- | ---- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `applicationUrl`  | text | yes      | **Deprecated.** No longer handled in the course form and not used on the course detail page. Applications are driven by open course instances (`CourseInstance` → `/apply/[code]`). Column kept for any older data. |
| `applicationText` | text | yes      | "Info when applications are closed" — shown on the course detail page instead of the Apply button when no open course instance exists (e.g. "Next intake: fall 2026"). |
| `locationText`    | text | yes      | Location text, e.g. "Demo Folk High School in Lindeby"                                                                                          |
| `tracks`         | text | no       | JSON array: `[{ title, description }]`                                                                                                              |
| `infoSections`   | text | no       | JSON array: `[{ heading, body }]`                                                                                                                    |
| `staff`          | text | no       | JSON array: `[{ name, title, ... }]`                                                                                                                 |
| `links`          | text | no       | JSON array: `[{ label, url }]`                                                                                                                        |
| `gallery`        | text | no       | JSON array of imageKeys                                                                                                                               |
| `blocks`         | text | no       | JSON array of blocks (section, accordion-section, slideshow, etc.) — rendered below the course data on detail pages via `KursBlocksView`               |

---

### Departments (many-to-many)

The `CourseDepartment` table (renamed from `KursAvdelning`) links a course to one or more departments. Read via JOIN in the API routes and sent as `departmentIds: string[]` in the Studio form.

---

### Evening-course-specific fields

> `sessionCount` and `sessionDuration` were removed in migration 0069 — sessions are described in free text (`duration`/blocks) instead.

---

## Course instances — `CourseInstance`

A `Course` can have several instances. Each instance represents a specific intake (term/year) with its own application settings.

### Key columns

| Column               | Type | Description                                                                                 |
| -------------------- | ---- | --------------------------------------------------------------------------------------------- |
| `courseId`           | text | FK → `Course.id`                                                                              |
| `slug`               | text | URL-safe registration code, e.g. `allman-kurs-26-vt`. Generated by `buildInstanceSlug()`.      |
| `year`               | int  | Intake/start year (e.g. 2026)                                                                 |
| `periodType`         | text | `spring` / `fall` / `full_year` / `summer`                                                     |
| `week`               | int  | Week number (optional — for summer courses)                                                    |
| `schoolsoftId`       | text | SchoolSoft ID for this instance                                                                |
| `startDate`          | int  | Start date (timestamp_ms)                                                                     |
| `endDate`            | int  | End date (timestamp_ms)                                                                       |
| `spots`              | int  | Number of spots                                                                                |
| `extraFields`        | text | JSON: `ExtraField[]` — course-specific questions in the application form                       |
| `applicationMethods` | text | JSON: `ApplicationConfig` — see below                                                          |
| `applicationBlocks`  | text | JSON: `ContentBlock[]` — extra blocks (section/accordion-section) on the course detail page     |

The registration code ("AK 26 VT", "AK 26 Summer wk 29") is **generated** from the fields via `formatRegistrationCode()` in `src/lib/course-instance.ts` — never stored as free text.

### ApplicationConfig

```ts
type ApplicationConfig = {
  open: boolean;
  mode: "any" | "sequence";
  methods: ApplicationMethod[];
};
```

`ApplicationMethod` union: `form | url | email | schoolsoft | physical`. The SchoolSoft URL is auto-generated from `schoolsoftId` via `buildSchoolSoftUrl()`.

- `mode: "any"` — all methods show simultaneously.
- `mode: "sequence"` — methods show in order; the next one activates once the previous is complete (e.g. form → schoolsoft).

### ExtraField

```ts
type ExtraField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "files";
  options?: string[];   // for type="select"
  maxFiles?: number;    // for type="files", default 10
  required?: boolean;
};
```

- The `files` type renders `AttachmentUpload` inside the question block on `/apply/[code]`. Attachments are tagged with `fieldId` and merged with global `attachments` on submit.
- In the Studio applications view, field IDs are mapped to labels via the instance's `extraFields`.

> **The application form does not submit in this demo.** `/apply/[code]` validates,
> shows the confirmation screen, and discards; `POST /api/applications` and
> `/api/applications/upload` refuse via `demoLockCheck()`. The form collects a
> personal identity number, and the demo Studio password is public — see *Privacy &
> Personal Data* in `AGENTS.md`. Everything described above is the data model as
> built, not a live write path here. The applications already visible in Studio are
> seeded fiction from `scripts/seed-demo-data.sql`.

### SchoolSoftPrescreen

If an instance has the SchoolSoft method, **no** form method, and at least one required extraField (type text/textarea/select), `CourseDetailView` renders a `SchoolSoftPrescreen` component instead of a direct link. Answers are **not** stored in the DB — it's a purely client-side gate. For DB-stored answers: use `form + schoolsoft` in sequence mode.

---

## Mapping to folkhogskola.nu filters

| Filter                           | Field                             | Notes                                |
| --------------------------------- | ---------------------------------- | -------------------------------------- |
| Course start / Date               | `startDate`                        | Term is computed from the date         |
| Course type (7 types)              | `courseType` + `deliveryMode`      | The combination covers all types       |
| Course length (< 1 year, 1 year, 2 years…) | `duration` (free text)     | `durationWeeks` removed (0069)          |
| Study pace (50%, 75%, 100%)        | `studyPace` (integer %)            |                                         |
| Living & accommodation             | `hasAccommodation`                 | Childcare/pets = school-wide level      |
| Study aid level (4 levels)         | `studyAidLevel`                    | More nuanced than a boolean             |
| Disability accommodations          | `accessibilityTags` _(not active)_ | Column exists in schema but not written |
| County / Folk high school          | _(not in schema)_                  | Applies to the whole school             |
