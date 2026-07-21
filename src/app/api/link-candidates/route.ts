import { NextResponse } from "next/server";
import { asc, ne } from "drizzle-orm";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { course, venue, department } from "@/lib/db/schema";
import { courseHref } from "@/lib/course-href";
import { INTERNAL_PAGES } from "@/lib/internal-pages";

export const dynamic = "force-dynamic";

export type LinkCandidate = { href: string; label: string; group: string };

export async function GET(req: Request) {
  const access = await requireStudioAccess(req);
  if (access.response) return access.response;

  try {
    const db = getDb();

    const [courses, venues, departments] = await Promise.all([
      db
        .select({
          slug: course.slug,
          title: course.title,
          courseType: course.courseType,
          deliveryMode: course.deliveryMode,
        })
        .from(course)
        // "short" courses (SMF, MHFA) live at fixed routes already listed in INTERNAL_PAGES
        .where(ne(course.courseType, "short"))
        .orderBy(asc(course.title)),
      db
        .select({ slug: venue.slug, name: venue.name })
        .from(venue)
        .orderBy(asc(venue.sortOrder)),
      db
        .select({ name: department.name, href: department.href })
        .from(department)
        .orderBy(asc(department.sortOrder)),
    ]);

    const candidates: LinkCandidate[] = [
      ...INTERNAL_PAGES.map((p) => ({ ...p, group: "Pages" })),
      ...courses.map((c) => ({
        href: courseHref(c.slug, c.courseType, c.deliveryMode),
        label: c.title,
        group: "Courses",
      })),
      ...venues.map((v) => ({
        href: `/venues/${v.slug}`,
        label: v.name,
        group: "Venues",
      })),
      ...departments
        .filter((d): d is { name: string; href: string } => !!d.href)
        .map((d) => ({ href: d.href, label: d.name, group: "Departments" })),
    ];

    return NextResponse.json(candidates);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
