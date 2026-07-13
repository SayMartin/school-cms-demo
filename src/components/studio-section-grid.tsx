import { StudioSectionCard } from "@/components/studio-section-card";
import type { StudioSection } from "@/components/studio-section-card";

export function StudioSectionGrid({ sections }: { sections: StudioSection[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
      {sections.map((s) => (
        <StudioSectionCard key={s.href} s={s} />
      ))}
    </ul>
  );
}
