-- Seeds course instances (CourseInstance) from existing courses.
--
-- Creates ONE instance per course of type program / program_track / summer /
-- evening, plus the short courses SMF (studiemotiverande-folkhogskola) and
-- MHFA (forsta-hjalpen-till-psykisk-halsa), which don't yet have an
-- instance. NOTE: these two courses' slugs are intentionally left in
-- Swedish here — they are real courses from the original site, seeded by migration
-- 0034, and the corresponding route pages
-- (src/app/study-motivation-course/page.tsx and
-- src/app/mental-health-first-aid/page.tsx) query Course by these exact
-- Swedish slug values. Renaming the slugs here would break those lookups.
-- schoolsoftId lives only on CourseInstance (not on Course), so newly
-- generated instances start out with schoolsoftId = NULL until a staff
-- member fills it in manually. The period is derived from the course type;
-- since Course has no start date of its own, the year defaults to 2026
-- (update manually afterwards if a different intake year is needed).
-- Instances are created CLOSED
-- (applicationMethods.open = false) so the public site is unchanged
-- (external SchoolSoft link stays in place) until a staff member opens the
-- form for each course.
--
-- Idempotent: courses that already have an instance are skipped, so the
-- script can be re-run without creating duplicates.
--
-- Run: npm run db:seed:instances:local (requires db:sync:local first so
-- schoolsoftId exists locally), or :dev / :prod against remote.

INSERT INTO CourseInstance
  (id, courseId, slug, year, periodType, week, schoolsoftId, applicationMethods, extraFields, sortOrder, createdAt, updatedAt)
WITH src AS (
  SELECT
    k.id   AS courseId,
    k.slug AS kursSlug,
    CASE
      WHEN k.courseType = 'summer'  THEN 'summer'
      WHEN k.courseType = 'evening' THEN 'fall'
      ELSE 'full_year'
    END AS periodType,
    2026 AS yr
  FROM Course k
  WHERE (
      k.courseType IN ('program', 'program_track', 'summer', 'evening')
      -- SMF + MHFA (short courses without a SchoolSoft ID)
      OR k.slug IN ('studiemotiverande-folkhogskola', 'forsta-hjalpen-till-psykisk-halsa')
    )
    AND k.id NOT IN (SELECT courseId FROM CourseInstance)
)
SELECT
  lower(hex(randomblob(16))),
  src.courseId,
  -- Slug in the same format as buildInstanceSlug() in src/lib/course-instance.ts
  src.kursSlug || '-ak-' || substr(printf('%04d', src.yr), 3, 2) || '-' ||
    CASE src.periodType
      WHEN 'full_year' THEN printf('%02d', (src.yr + 1) % 100)  -- "ak-26-27"
      WHEN 'summer'    THEN 'st'                                 -- "ak-26-st"
      WHEN 'fall'      THEN 'ht'
      ELSE 'vt'
    END,
  src.yr,
  src.periodType,
  NULL,
  NULL,
  '{"open":false,"mode":"any","methods":[]}',
  '[]',
  0,
  CAST(unixepoch() AS INTEGER) * 1000,
  CAST(unixepoch() AS INTEGER) * 1000
FROM src;
