import { ButtonLink } from "@/components/button-link";

export function SummerCoursesNav() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 flex justify-evenly gap-4">
      <ButtonLink href="/summer-courses-practical-info" variant="primary">
        Practical information
      </ButtonLink>
      <ButtonLink href="/summer-courses" variant="primary">
        All summer courses
      </ButtonLink>
    </div>
  );
}
