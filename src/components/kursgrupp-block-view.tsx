import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { course, department } from "@/lib/db/schema";
import { KursCard } from "@/components/kurs-card";
import { NavHubCard } from "@/components/nav-hub-card";
import { RichTextContent } from "@/components/rich-text-content";
import { getColorHex } from "@/lib/brand-colors";
import { PLACEHOLDER_BALL_IMAGE_KEY } from "@/lib/r2/client";
import type { CourseGroupBlock } from "@/lib/blocks";

type KursData = { id: string; title: string; slug: string; courseType: string; deliveryMode: string | null; imageKey: string | null };
type AvdelningData = { id: string; name: string; href: string | null; imageKey: string | null };
type ResolvedItem =
  | { kind: "course"; data: KursData; color: string | undefined; titleColor: string | undefined }
  | { kind: "department"; data: AvdelningData; color: string | undefined; titleColor: string | undefined };

function courseHref(slug: string, courseType: string, deliveryMode: string | null): string {
  if (courseType === "program") {
    return deliveryMode === "distance_hybrid" || deliveryMode === "distance_pure"
      ? `/distance-education/${slug}`
      : `/education-programs/${slug}`;
  }
  if (courseType === "program_track") return `/education-programs/nature-life-courses/${slug}`;
  if (courseType === "summer") return `/summer-courses/${slug}`;
  if (courseType === "evening") return `/evening-courses/${slug}`;
  return `/${slug}`;
}

export async function KursgruppBlockView({ block }: { block: CourseGroupBlock }) {
  const db = getDb();

  const kursIds = block.selectedItems.filter((i) => i.itemType === "course").map((i) => i.id);
  const avdelningIds = block.selectedItems.filter((i) => i.itemType === "department").map((i) => i.id);

  const [kurser, avdelningar] = await Promise.all([
    kursIds.length > 0
      ? db
          .select({ id: course.id, title: course.title, slug: course.slug, courseType: course.courseType, deliveryMode: course.deliveryMode, imageKey: course.imageKey })
          .from(course)
          .where(and(inArray(course.id, kursIds), eq(course.isArchived, false)))
      : Promise.resolve([]),
    avdelningIds.length > 0
      ? db
          .select({ id: department.id, name: department.name, href: department.href, imageKey: department.imageKey })
          .from(department)
          .where(inArray(department.id, avdelningIds))
      : Promise.resolve([]),
  ]);

  const kursMap = new Map(kurser.map((k) => [k.id, k]));
  const avdelningMap = new Map(avdelningar.map((d) => [d.id, d]));

  const items: ResolvedItem[] = block.selectedItems.flatMap((item): ResolvedItem[] => {
    if (item.itemType === "course") {
      const k = kursMap.get(item.id);
      return k ? [{ kind: "course", data: k, color: item.color, titleColor: item.titleColor }] : [];
    }
    const d = avdelningMap.get(item.id);
    return d ? [{ kind: "department", data: d, color: item.color, titleColor: item.titleColor }] : [];
  });

  if (items.length === 0 && !block.heading && !block.body) return null;

  return (
    <div>
      {block.headingVisible && block.heading && <h2 className="mb-3" style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h2>}
      {block.body && (
        <div className={`${block.heading ? "mb-5" : ""} max-w-2xl text-gray-600`}>
          <RichTextContent html={block.body} />
        </div>
      )}
      {items.length > 0 && (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            if (block.displayMode === "without-image") {
              const href =
                item.kind === "course"
                  ? courseHref(item.data.slug, item.data.courseType, item.data.deliveryMode)
                  : (item.data.href ?? "#");
              const name = item.kind === "course" ? item.data.title : item.data.name;
              return <NavHubCard key={item.data.id} name={name} href={href} color={item.color} />;
            }
            if (item.kind === "course") {
              return (
                <KursCard
                  key={item.data.id}
                  title={item.data.title}
                  href={courseHref(item.data.slug, item.data.courseType, item.data.deliveryMode)}
                  imageKey={item.data.imageKey}
                  courseType={item.data.courseType}
                  deliveryMode={item.data.deliveryMode}
                  bandColor={getColorHex(item.color ?? "brand-purple")}
                  titleColor={item.titleColor}
                />
              );
            }
            return item.data.href ? (
              <KursCard
                key={item.data.id}
                title={item.data.name}
                href={item.data.href}
                imageKey={item.data.imageKey ?? PLACEHOLDER_BALL_IMAGE_KEY}
                bandColor={getColorHex(item.color ?? "brand-purple")}
                titleColor={item.titleColor}
              />
            ) : null;
          })}
        </ul>
      )}
    </div>
  );
}
