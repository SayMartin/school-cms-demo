import { getColorHex } from "@/lib/brand-colors";
import { KursCard } from "@/components/kurs-card";
import { NavHubCard } from "@/components/nav-hub-card";
import { PLACEHOLDER_BALL_IMAGE_KEY } from "@/lib/r2/client";
import type { NavGroupBlock } from "@/lib/blocks";

export function NavGroupBlockView({ block }: { block: NavGroupBlock }) {
  if (block.items.length === 0 && !block.heading) return null;

  return (
    <div>
      {block.headingVisible && block.heading && (
        <h2 className="mb-6" style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h2>
      )}
      {block.items.length > 0 && (
        <ul className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          {block.items.map((item) => {
            const ballType = item.ballType ?? (item.imageKey ? "image" : "color");
            return ballType === "image" ? (
              <KursCard
                key={item.id}
                title={item.name}
                titleColor={item.nameColor}
                href={item.href}
                imageKey={item.imageKey ?? PLACEHOLDER_BALL_IMAGE_KEY}
                bandColor={item.color ? getColorHex(item.color) : undefined}
              />
            ) : (
              <NavHubCard
                key={item.id}
                name={item.name}
                nameColor={item.nameColor}
                href={item.href}
                ingress={item.ingress}
                color={item.color}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
