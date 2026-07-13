import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { course, department, courseDepartment } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export type CandidateItem =
  | {
      id: string;
      itemType: "course";
      label: string;
      meta: string;
      imageKey: string | null;
      courseType: string;
      deliveryMode: string | null;
      avdelningIds: string[];
      isPublished: boolean;
      isArchived: boolean;
    }
  | {
      id: string;
      itemType: "department";
      label: string;
      meta: string;
      imageKey: string | null;
      isCourseDepartment: boolean;
      href: string | null;
    };

export async function GET(req: Request) {
  const access = await requireStudioAccess(req);
  if (access.response) return access.response;

  try {
    const db = getDb();

    const [kurser, avdelningar, avdelningLinks] = await Promise.all([
      db
        .select({
          id: course.id,
          title: course.title,
          courseType: course.courseType,
          deliveryMode: course.deliveryMode,
          imageKey: course.imageKey,
          isPublished: course.isPublished,
          isArchived: course.isArchived,
        })
        .from(course)
        .orderBy(asc(course.courseType), asc(course.title)),
      db
        .select()
        .from(department)
        .orderBy(asc(department.sortOrder), asc(department.name)),
      db.select().from(courseDepartment),
    ]);

    // Build avdelningIds map for kurser
    const avdelningMap = new Map<string, string[]>();
    for (const row of avdelningLinks) {
      const list = avdelningMap.get(row.courseId) ?? [];
      list.push(row.departmentId);
      avdelningMap.set(row.courseId, list);
    }

    const COURSE_TYPE_LABELS: Record<string, string> = {
      program: "Program",
      program_track: "Program track",
      short: "Short course",
      summer: "Summer course",
      evening: "Evening course",
    };

    const DELIVERY_LABELS: Record<string, string> = {
      campus: "Campus",
      distance_hybrid: "Distance w/ meetups",
      distance_pure: "Distance",
      outdoor: "Outdoors",
    };

    const kursCandidates: CandidateItem[] = kurser.map((k) => ({
      id: k.id,
      itemType: "course",
      label: k.title,
      meta: [
        COURSE_TYPE_LABELS[k.courseType] ?? k.courseType,
        k.deliveryMode ? DELIVERY_LABELS[k.deliveryMode] ?? k.deliveryMode : null,
      ]
        .filter(Boolean)
        .join(" · "),
      imageKey: k.imageKey,
      courseType: k.courseType,
      deliveryMode: k.deliveryMode,
      avdelningIds: avdelningMap.get(k.id) ?? [],
      isPublished: k.isPublished,
      isArchived: k.isArchived,
    }));

    const avdelningCandidates: CandidateItem[] = avdelningar.map((d) => ({
      id: d.id,
      itemType: "department",
      label: d.name,
      meta: d.isCourseDepartment ? "Course department" : "Department",
      imageKey: d.imageKey,
      isCourseDepartment: d.isCourseDepartment,
      href: d.href,
    }));

    return NextResponse.json([...kursCandidates, ...avdelningCandidates]);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
