import type { Metadata } from "next";
import { getDb } from "@/lib/db/client";
import { participantStory, participantStoriesContent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SchoolRainbow } from "@/components/school-rainbow";
import { RichTextContent } from "@/components/rich-text-content";
import { AccordionBlock } from "@/components/accordion-block";
import { Slideshow } from "@/components/slideshow";
import { NavGroupBlockView } from "@/components/nav-group-block-view";
import { ParticipantStoryCard } from "@/components/participant-story-card";
import { YoutubeBlockView } from "@/components/youtube-block-view";
import { VideoBlockView } from "@/components/video-block-view";
import { parseHubBlocks } from "@/lib/parse-blocks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Participant Stories – Demo Folk High School",
};

export default async function DeltagarberattelsePage() {
  const db = getDb();

  const [contentRow, stories] = await Promise.all([
    db
      .select()
      .from(participantStoriesContent)
      .where(eq(participantStoriesContent.id, "main"))
      .limit(1)
      .then((r) => r[0]),
    db
      .select({
        id: participantStory.id,
        name: participantStory.name,
        graduationYear: participantStory.graduationYear,
        courseName: participantStory.courseName,
        imageKey: participantStory.imageKey,
        story: participantStory.story,
      })
      .from(participantStory)
      .where(eq(participantStory.published, true)),
  ]);

  const blocks = parseHubBlocks(contentRow?.blocks ?? "[]").filter(
    (b) => b.type !== "course-group",
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg">
          <SchoolRainbow width="100%" height="100%" speed={5} />
        </div>
        {contentRow?.headingVisible && contentRow?.heading && (
          <h1
            className="text-center"
            style={{ color: contentRow.headingColor ?? "#111827" }}
          >
            {contentRow.heading}
          </h1>
        )}
      </div>

      {/* Editorial blocks */}
      {blocks.map((block) => {
        if (block.type === "section")
          return (
            <section key={block.id}>
              {block.headingVisible && block.heading && (
                <h1 style={{ color: block.headingColor ?? "#111827" }}>
                  {block.heading}
                </h1>
              )}
              {block.body && (
                <div
                  className={`${block.headingVisible && block.heading ? "mt-4" : ""} max-w-7xl text-gray-600 leading-relaxed`}
                >
                  <RichTextContent html={block.body} className="text-center" />
                </div>
              )}
            </section>
          );
        if (block.type === "accordion-section")
          return (
            <div key={block.id} className="max-w-7xl">
              <AccordionBlock summary={block.summary}>
                {block.body && <RichTextContent html={block.body} />}
              </AccordionBlock>
            </div>
          );
        if (block.type === "slideshow")
          return (
            <div key={block.id} className="mt-10">
              <Slideshow block={block} />
            </div>
          );
        if (block.type === "youtube")
          return (
            <div key={block.id} className="mt-10">
              <YoutubeBlockView block={block} />
            </div>
          );
        if (block.type === "video")
          return (
            <div key={block.id} className="mt-10">
              <VideoBlockView block={block} />
            </div>
          );
        if (block.type === "nav-group")
          return (
            <div key={block.id} className="mt-10">
              <NavGroupBlockView block={block} />
            </div>
          );
        return null;
      })}

      {/* Stories */}
      {stories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-8 py-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-600">
            Coming soon
          </p>
          <p className="mt-2 text-gray-600">
            Participant stories will be published here shortly.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-6 max-w-7xl">
          {stories.map((s) => (
            <li key={s.id}>
              <ParticipantStoryCard
                name={s.name}
                graduationYear={s.graduationYear}
                courseName={s.courseName}
                imageKey={s.imageKey}
                story={s.story}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
