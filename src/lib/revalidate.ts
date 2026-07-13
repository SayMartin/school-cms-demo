import { revalidatePath } from "next/cache";

export function revalidateCoursePaths(slug?: string) {
  revalidatePath("/summer-courses");
  revalidatePath("/evening-courses");
  revalidatePath("/education-programs");
  revalidatePath("/education-programs/nature-life-courses");
  revalidatePath("/distance-education");
  revalidatePath("/short-courses");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/summer-courses/${slug}`);
    revalidatePath(`/summer-courses/course/${slug}`);
    revalidatePath(`/evening-courses/${slug}`);
    revalidatePath(`/evening-courses/course/${slug}`);
    revalidatePath(`/education-programs/${slug}`);
    revalidatePath(`/education-programs/nature-life-courses/${slug}`);
    revalidatePath(`/distance-education/${slug}`);
  }
}
