import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { profile, profileDepartment } from "@/lib/db/schema";
import { ProfileCard } from "@/components/profile-card";
import type { ProfilesBlock } from "@/lib/blocks";

export async function ProfilesBlockView({ block }: { block: ProfilesBlock }) {
  if (block.profileIds.length === 0) return null;

  const db = getDb();
  const rows = await db
    .select({
      id: profile.id,
      name: profile.name,
      imageKey: profile.imageKey,
      phone: profile.phone,
      directPhone: profile.directPhone,
      email: profile.email,
      bio: profile.bio,
      title: profileDepartment.title,
    })
    .from(profile)
    .leftJoin(profileDepartment, eq(profile.id, profileDepartment.profileId))
    .where(and(inArray(profile.id, block.profileIds), eq(profile.published, true)));

  // Deduplicate — leftJoin can produce multiple rows per profile
  const seen = new Set<string>();
  const deduped = rows.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  // Preserve the order specified in the block
  const sorted = block.profileIds
    .map((id) => deduped.find((p) => p.id === id))
    .filter(Boolean) as typeof deduped;

  if (sorted.length === 0) return null;

  return (
    <div className="mt-10">
      {block.headingVisible && block.heading && (
        <h2 className="mb-6" style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h2>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((p) => (
          <div key={p.id}>
            <ProfileCard
              name={p.name}
              title={p.title ? (JSON.parse(p.title) as string[]) : undefined}
              imageKey={p.imageKey}
              phone={p.phone ?? undefined}
              directPhone={p.directPhone ?? undefined}
              email={p.email ?? undefined}
              bio={p.bio ?? undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
