import Link from "next/link";
import { HeroVideo } from "@/components/hero-video";
import { SoapBubbles } from "@/components/soap-bubbles";
import { DishItem } from "@/components/dish-item";
import { eq, and, asc } from "drizzle-orm";
import { RichTextContent } from "@/components/rich-text-content";
import { AccordionBlock } from "@/components/accordion-block";
import { Slideshow } from "@/components/slideshow";
import { ProfilesBlockView } from "@/components/profiles-block-view";
import { KursgruppBlockView } from "@/components/kursgrupp-block-view";
import { NavGroupBlockView } from "@/components/nav-group-block-view";
import { YoutubeBlockView } from "@/components/youtube-block-view";
import { VideoBlockView } from "@/components/video-block-view";
import { getDb } from "@/lib/db/client";
import {
  weeklyMenu,
  dayMenu,
  dayMenuItem,
  dish,
  homeContent,
} from "@/lib/db/schema";
import type { HubBlock, CourseGroupBlock, NavGroupBlock } from "@/lib/blocks";
import { parseHubBlocks } from "@/lib/parse-blocks";


export const dynamic = "force-dynamic";

function getISOWeek(d: Date) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function isoDay(d: Date) {
  return d.getDay() === 0 ? 7 : d.getDay();
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

export default async function HomePage() {
  const db = getDb();

  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Stockholm" }),
  );

  const [homeRow] = await Promise.all([
    db
      .select()
      .from(homeContent)
      .where(eq(homeContent.id, "main"))
      .limit(1)
      .then((r) => r[0]),
  ]);

  const menuDay = await (async () => {
    for (let offset = 0; offset < 7; offset++) {
      const target = addDays(now, offset);
      const targetDay = isoDay(target);
      const targetWeek = getISOWeek(target);
      const targetYear = target.getFullYear();

      const [menuRow] = await db
        .select({ id: weeklyMenu.id })
        .from(weeklyMenu)
        .where(
          and(
            eq(weeklyMenu.week, targetWeek),
            eq(weeklyMenu.year, targetYear),
            eq(weeklyMenu.published, true),
          ),
        )
        .limit(1);

      if (!menuRow) continue;

      const [dayRow] = await db
        .select({ id: dayMenu.id, closed: dayMenu.closed })
        .from(dayMenu)
        .where(
          and(eq(dayMenu.weeklyMenuId, menuRow.id), eq(dayMenu.day, targetDay)),
        )
        .limit(1);

      if (!dayRow || dayRow.closed) continue;

      const dishes = await db
        .select({
          name: dish.name,
          description: dish.description,
          allergens: dish.allergens,
          vegetarian: dish.vegetarian,
          vegan: dish.vegan,
          price: dish.price,
          studentPrice: dish.studentPrice,
          imageKey: dish.imageKey,
        })
        .from(dayMenuItem)
        .leftJoin(dish, eq(dayMenuItem.dishId, dish.id))
        .where(eq(dayMenuItem.dayMenuId, dayRow.id))
        .orderBy(asc(dayMenuItem.sortOrder));

      if (dishes.length === 0) continue;

      const weekdayName = target.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const rawLabel =
        offset === 0
          ? `Today ${weekdayName}`
          : offset === 1
            ? `Tomorrow ${weekdayName}`
            : weekdayName;
      const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

      return { label, dishes };
    }
    return null;
  })();

  const homeBlocks = parseHubBlocks(homeRow?.blocks ?? "[]");

  // Group consecutive content blocks together; standalone blocks (kursgrupp, navgrupp)
  // each get their own section so the user-defined order is preserved.
  type StandaloneBlock = CourseGroupBlock | NavGroupBlock;
  type InlineContentBlock = Exclude<HubBlock, StandaloneBlock>;
  type BlockGroup =
    | { kind: "standalone"; block: StandaloneBlock }
    | { kind: "content"; blocks: InlineContentBlock[] };

  const blockGroups: BlockGroup[] = [];
  for (const block of homeBlocks) {
    if (block.type === "course-group" || block.type === "nav-group") {
      blockGroups.push({ kind: "standalone", block });
    } else {
      const last = blockGroups[blockGroups.length - 1];
      if (last?.kind === "content") {
        last.blocks.push(block as InlineContentBlock);
      } else {
        blockGroups.push({ kind: "content", blocks: [block as InlineContentBlock] });
      }
    }
  }

  function renderContentBlock(block: InlineContentBlock) {
    if (block.type === "section")
      return (
        <div key={block.id}>
          {block.headingVisible && block.heading && <h1 style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h1>}
          {block.body && (
            <div
              className={`${block.headingVisible && block.heading ? "mt-3" : ""} max-w-7xl text-lg text-gray-700 leading-relaxed`}
            >
              <RichTextContent html={block.body} />
            </div>
          )}
        </div>
      );
    if (block.type === "accordion-section")
      return (
        <div key={block.id} className="max-w-7xl">
          <AccordionBlock summary={block.summary}>
            {block.body && (
              <RichTextContent html={block.body} className="text-gray-700" />
            )}
          </AccordionBlock>
        </div>
      );
    if (block.type === "slideshow")
      return <Slideshow key={block.id} block={block} />;
    if (block.type === "profiles")
      return <ProfilesBlockView key={block.id} block={block} />;
    if (block.type === "youtube")
      return <YoutubeBlockView key={block.id} block={block} />;
    if (block.type === "video")
      return <VideoBlockView key={block.id} block={block} />;
    return null;
  }

  return (
    <>
      <SoapBubbles className="fixed bottom-12 left-12 z-40 select-none" />

      {/* Hero */}
      <section className="relative h-[80vh] overflow-hidden bg-gray-800">
        <HeroVideo />
      </section>

      {homeRow?.headingVisible === 1 && homeRow.heading && (
        <div className="mx-auto text-center max-w-7xl px-4 pt-12">
          <h1 style={{ color: homeRow.headingColor ?? "#111827" }}>{homeRow.heading}</h1>
        </div>
      )}

      {/* Blocks — rendered in studio-defined order */}
      {blockGroups.map((group, i) => {
        if (group.kind === "standalone" && group.block.type === "course-group") {
          const block = group.block;
          return (
            <section
              key={block.id}
              className="px-4 py-12"
            >
              <div className="mx-auto max-w-7xl">
                <KursgruppBlockView block={block} />
              </div>
            </section>
          );
        }
        if (group.kind === "standalone" && group.block.type === "nav-group") {
          return (
            <section key={group.block.id} className="px-4 py-12">
              <div className="mx-auto max-w-7xl">
                <NavGroupBlockView block={group.block} />
              </div>
            </section>
          );
        }
        if (group.kind === "content" && group.blocks.length > 0) {
          return (
            <section key={i} className="px-4 py-12">
              <div className="mx-auto max-w-7xl space-y-10">
                {group.blocks.map(renderContentBlock)}
              </div>
            </section>
          );
        }
        return null;
      })}

      {/* At the Restaurant — always shown right above Why Us? */}
      {menuDay && (
        <section className="px-4 py-8 bg-brand-pink">
          <div className="mx-auto max-w-7xl">
            <h2>{menuDay.label} at the Restaurant</h2>
            <ul className="mt-4 space-y-3">
              {menuDay.dishes.map((d, i) => (
                <li key={i}>
                  <DishItem dish={d} />
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link
                href="/restaurant"
                className="font-medium hover:underline text-gray-900"
              >
                See this week&apos;s menu →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Why Us? — fixed yellow section, always at the bottom */}
      {homeRow?.whyUsText && (
        <section className="bg-linear-to-b from-brand-yellow to-brand-yellow-glow px-4 py-16">
          <div className="mx-auto max-w-7xl">
            {homeRow.whyUsHeadingVisible === 1 &&
              homeRow.whyUsHeading && (
                <h2>{homeRow.whyUsHeading}</h2>
              )}
            <div className="mt-8 max-w-7xl leading-relaxed">
              <RichTextContent html={homeRow.whyUsText} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
