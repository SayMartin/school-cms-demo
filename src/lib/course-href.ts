export function courseHref(
  slug: string,
  courseType: string,
  deliveryMode: string | null,
): string {
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
