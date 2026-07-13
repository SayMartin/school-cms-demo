import type { Metadata } from "next";
import { asc, and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { associationContent, profile, department, profileDepartment } from "@/lib/db/schema";
import { RichTextContent } from "@/components/rich-text-content";
import { AccordionBlock } from "@/components/accordion-block";
import { Slideshow } from "@/components/slideshow";
import { ProfileCard } from "@/components/profile-card";
import { YoutubeBlockView } from "@/components/youtube-block-view";
import { VideoBlockView } from "@/components/video-block-view";
import { parseContentBlocks } from "@/lib/parse-blocks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "The Association" };

export default async function ForeningenPage() {
  const db = getDb();

  const [content, boardRows] = await Promise.all([
    db.select().from(associationContent).where(eq(associationContent.id, "main")).limit(1).then((r) => r[0]),
    db
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
      .innerJoin(profileDepartment, eq(profile.id, profileDepartment.profileId))
      .innerJoin(department, eq(profileDepartment.departmentId, department.id))
      .where(and(eq(profile.published, true), eq(department.name, "Styrelsen")))
      .orderBy(asc(profileDepartment.sortOrder), asc(profile.sortOrder)),
  ]);

  const rawBlocks = content?.blocks ?? "[]";
  const blocks = parseContentBlocks(rawBlocks);

  const boardHeading = content?.boardHeading || "The Board";
  const boardIntro = content?.boardIntro ?? "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {content?.headingVisible && content?.heading && (
        <h1 className="text-center" style={{ color: content.headingColor ?? "#111827" }}>{content.heading}</h1>
      )}

      {blocks.map((block) => {
        if (block.type === "section") return (
          <section key={block.id} className="mt-8">
            {block.headingVisible && block.heading && <h1 style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h1>}
            {block.body && <div className={`${block.headingVisible && block.heading ? "mt-4" : "mt-0"} max-w-7xl text-gray-600 leading-relaxed`}><RichTextContent html={block.body} /></div>}
          </section>
        );
        if (block.type === "accordion-section") return (
          <div key={block.id} className="mt-8 max-w-7xl">
            <AccordionBlock summary={block.summary}>{block.body && <RichTextContent html={block.body} className="text-gray-600" />}</AccordionBlock>
          </div>
        );
        if (block.type === "slideshow") return (
          <div key={block.id} className="mt-10">
            <Slideshow block={block} />
          </div>
        );
        if (block.type === "youtube") return (
          <div key={block.id} className="mt-10">
            <YoutubeBlockView block={block} />
          </div>
        );
        if (block.type === "video") return (
          <div key={block.id} className="mt-10">
            <VideoBlockView block={block} />
          </div>
        );
        return null;
      })}

      {/* Board section — fixed layout with editable heading + intro */}
      <section className="mt-16">
        <h2>{boardHeading}</h2>
        {boardIntro && <p className="mt-2 text-gray-600">{boardIntro}</p>}

        {boardRows.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {boardRows.map((member) => (
              <ProfileCard
                key={member.id}
                name={member.name}
                title={JSON.parse(member.title) as string[]}
                imageKey={member.imageKey}
                phone={member.phone ?? undefined}
                directPhone={member.directPhone ?? undefined}
                email={member.email ?? undefined}
                bio={member.bio ?? undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
