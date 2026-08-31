import type { Metadata } from "next";
import { eq, and, asc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  weeklyMenu,
  dayMenu,
  dayMenuItem,
  dish,
  restaurantContent,
} from "@/lib/db/schema";
import { PrintButton } from "./print-button";
import { MenuDisplay } from "./menu-display";
import { SchoolLogo } from "@/components/logo";
import { RichTextContent } from "@/components/rich-text-content";
import { Button } from "@/components/button";
import { DishItem } from "@/components/dish-item";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "The Restaurant" };

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function getISOWeek(d: Date) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function currentMenuWeek() {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Stockholm" }),
  );
  const isFridayAfterNoon = now.getDay() === 5 && now.getHours() >= 12;
  const target = isFridayAfterNoon
    ? new Date(now.getTime() + 7 * 86400000)
    : now;
  return { week: getISOWeek(target), year: target.getFullYear() };
}

function weekMondayDate(week: number, year: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  return new Date(
    jan4.getTime() - (jan4Day - 1) * 86400000 + (week - 1) * 7 * 86400000,
  );
}

function fmtShort(d: Date) {
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

const defaultContent = {
  intro:
    "Welcome to the Restaurant. We serve home-cooked food made from local ingredients.",
  pricesNote: "",
};

export default async function RestaurantPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; year?: string }>;
}) {
  const db = getDb();
  const params = await searchParams;
  const current = currentMenuWeek();
  const week = params.week ? parseInt(params.week, 10) : current.week;
  const year = params.year ? parseInt(params.year, 10) : current.year;
  const isCurrentWeek = week === current.week && year === current.year;

  const [menuRows, allPublishedRows, contentRows] = await Promise.all([
    db
      .select()
      .from(weeklyMenu)
      .where(
        and(
          eq(weeklyMenu.week, week),
          eq(weeklyMenu.year, year),
          eq(weeklyMenu.published, true),
        ),
      )
      .limit(1),
    db
      .select({ week: weeklyMenu.week, year: weeklyMenu.year })
      .from(weeklyMenu)
      .where(eq(weeklyMenu.published, true))
      .orderBy(asc(weeklyMenu.year), asc(weeklyMenu.week)),
    db
      .select()
      .from(restaurantContent)
      .where(eq(restaurantContent.id, "main"))
      .limit(1),
  ]);

  const menu = menuRows[0] ?? null;
  const content = contentRows[0] ?? defaultContent;

  const key = (w: number, y: number) => y * 100 + w;
  const thisKey = key(week, year);
  const prevMenu =
    allPublishedRows.filter((m) => key(m.week, m.year) < thisKey).at(-1) ??
    null;
  const nextMenu =
    allPublishedRows.find((m) => key(m.week, m.year) > thisKey) ?? null;

  const days = menu
    ? await (async () => {
        const dayRows = await db
          .select({ id: dayMenu.id, day: dayMenu.day, closed: dayMenu.closed })
          .from(dayMenu)
          .where(eq(dayMenu.weeklyMenuId, menu.id))
          .orderBy(asc(dayMenu.day));

        return Promise.all(
          dayRows.map(async (d) => {
            const items = await db
              .select({
                sortOrder: dayMenuItem.sortOrder,
                name: dish.name,
                description: dish.description,
                allergens: dish.allergens,
                price: dish.price,
                studentPrice: dish.studentPrice,
                vegetarian: dish.vegetarian,
                vegan: dish.vegan,
                imageKey: dish.imageKey,
              })
              .from(dayMenuItem)
              .leftJoin(dish, eq(dayMenuItem.dishId, dish.id))
              .where(eq(dayMenuItem.dayMenuId, d.id))
              .orderBy(asc(dayMenuItem.sortOrder));
            return { ...d, items };
          }),
        );
      })()
    : [];

  const monday = menu ? weekMondayDate(menu.week, menu.year) : null;
  const friday = monday ? new Date(monday.getTime() + 4 * 86400000) : null;
  const dateRange =
    monday && friday
      ? `${fmtShort(monday)}–${fmtShort(friday)} ${friday.getUTCFullYear()}`
      : null;

  return (
    <>
      {/* ── Screen layout ─────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-12 print:hidden">
        <div className="flex items-start justify-between">
          <div>
            <h1 className=" text-gray-900">The Restaurant</h1>
            {content.intro && (
              <RichTextContent
                html={content.intro}
                className="mt-2 text-gray-800"
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center gap-4">
          {/* 3 equal-width columns */}
          <div className="grid flex-1 grid-cols-3 items-center">
            {/* Left: right-aligned */}
            <div className="flex justify-end pr-4 sm:pr-0">
              {prevMenu ? (
                <Button
                  href={`/restaurant?week=${prevMenu.week}&year=${prevMenu.year}`}
                  variant="outline-green"
                  size="sm"
                  className="w-auto sm:w-36 justify-center sm:justify-start"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="hidden sm:inline">Previous</span>
                </Button>
              ) : (
                <Button
                  variant="outline-green"
                  size="sm"
                  disabled
                  className="w-auto sm:w-36 justify-center sm:justify-start"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="hidden sm:inline">Previous</span>
                </Button>
              )}
            </div>

            {/* Middle: centered heading */}
            <div className="flex justify-center">
              <span
                className={`text-base font-semibold text-gray-800 whitespace-nowrap text-center ${isCurrentWeek ? "underline underline-offset-4 decoration-2 decoration-brand-green-dark" : ""}`}
              >
                Week {week}, {year}
              </span>
            </div>

            {/* Right: left-aligned + right-aligned tools */}
            <div className="flex items-center justify-start pl-4 sm:pl-0 sm:justify-between">
              {nextMenu ? (
                <Button
                  href={`/restaurant?week=${nextMenu.week}&year=${nextMenu.year}`}
                  variant="outline-green"
                  size="sm"
                  className="w-auto sm:w-36 justify-center sm:justify-between"
                >
                  <span className="hidden sm:inline">Upcoming</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              ) : (
                <Button
                  variant="outline-green"
                  size="sm"
                  disabled
                  className="w-auto sm:w-36 justify-center sm:justify-between"
                >
                  <span className="hidden sm:inline">Upcoming</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              )}
              <div />
            </div>
          </div>
        </div>

        <MenuDisplay weekKey={`${week}-${year}`}>
          {!menu ? (
            <p className="mt-6 text-gray-800">
              No published menu for week {week}.
            </p>
          ) : (
            <>
              <div className="mt-4 divide-y divide-gray-200">
                {days.map((d) => (
                  <div key={d.id} className="py-5">
                    <p className="font-semibold text-gray-900">
                      {DAY_NAMES[(d.day - 1) % 7]}
                    </p>
                    {d.closed ? (
                      <p className="mt-1 font-semibold text-gray-900 italic">
                        Closed
                      </p>
                    ) : d.items.length === 0 ? null : (
                      <ul className="mt-2 space-y-3">
                        {d.items.map((item, i) => (
                          <li key={i}>
                            <DishItem dish={item} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {menu.notes && (
                <div className="mt-6 rounded-md bg-yellow-50 px-4 py-3 text-base text-yellow-800">
                  <RichTextContent html={menu.notes} />
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <PrintButton />
              </div>
            </>
          )}
        </MenuDisplay>

        {content.pricesNote && (
          <div className="mt-10 border-t border-gray-200 pt-6">
            <RichTextContent
              html={content.pricesNote}
              className="text-base text-gray-700"
            />
          </div>
        )}
      </div>

      {/* ── Print layout ──────────────────────────────── */}
      <div className="hidden print:block">
        {/* @page rule for A4 */}
        <style>{`@media print { @page { margin: 15mm; size: A4 portrait; } body { font-family: Georgia, serif; } }`}</style>

        <div style={{ textAlign: "center", paddingBottom: "8pt" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <SchoolLogo size={40} color="#a6cfe6" />
          </div>
          <p
            style={{
              margin: "5pt 0 1pt",
              fontSize: "10pt",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#333",
              fontWeight: 600,
            }}
          >
            The Restaurant
          </p>
          <h1
            style={{
              margin: "1pt 0 1pt",
              fontSize: "17pt",
              fontWeight: 900,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            This Week&apos;s Lunch
          </h1>
          {dateRange && (
            <p style={{ margin: "2pt 0 0", fontSize: "9pt", color: "#444" }}>
              Week {menu!.week} &nbsp;·&nbsp; {dateRange}
            </p>
          )}
        </div>

        {!menu ? (
          <p style={{ textAlign: "center", color: "#666", marginTop: "20pt" }}>
            This week&apos;s menu has not been published yet.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "6pt",
              fontSize: "9pt",
              lineHeight: 1.25,
            }}
          >
            <tbody>
              {days.map((d) => (
                <tr
                  key={d.id}
                  style={{ borderTop: "1px solid #ccc", pageBreakInside: "avoid" }}
                >
                  <td
                    style={{
                      width: "16%",
                      padding: "4pt 8pt 4pt 0",
                      fontWeight: 700,
                      verticalAlign: "top",
                      textTransform: "uppercase",
                      fontSize: "8pt",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {DAY_NAMES[(d.day - 1) % 7]}
                  </td>
                  <td style={{ padding: "4pt 0" }}>
                    {d.closed ? (
                      <span
                        style={{
                          color: "#888",
                          fontStyle: "italic",
                          fontSize: "8pt",
                        }}
                      >
                        CLOSED
                      </span>
                    ) : d.items.length === 0 ? (
                      <span style={{ color: "#aaa", fontSize: "8pt" }}>—</span>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "3pt",
                        }}
                      >
                        {d.items.map((item, i) => (
                          <div key={i} style={{ pageBreakInside: "avoid" }}>
                            <span style={{ fontWeight: 600, fontSize: "9pt" }}>
                              {item.name}
                            </span>
                            {item.vegetarian && (
                              <span
                                style={{
                                  marginLeft: "5pt",
                                  fontSize: "7.5pt",
                                  color: "#2a7a2a",
                                }}
                              >
                                [Vegetarian]
                              </span>
                            )}
                            {item.vegan && (
                              <span
                                style={{
                                  marginLeft: "4pt",
                                  fontSize: "7.5pt",
                                  color: "#7a5a00",
                                }}
                              >
                                [Vegan]
                              </span>
                            )}
                            {(item.description || item.allergens) && (
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  alignItems: "baseline",
                                  columnGap: "4pt",
                                  marginLeft: "5pt",
                                  fontSize: "8pt",
                                  color: "#555",
                                }}
                              >
                                {item.description && (
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: item.description,
                                    }}
                                  />
                                )}
                                {item.description && item.allergens && (
                                  <span style={{ color: "#aaa" }}>·</span>
                                )}
                                {item.allergens && (
                                  <div
                                    style={{ color: "#888" }}
                                    dangerouslySetInnerHTML={{
                                      __html: item.allergens,
                                    }}
                                  />
                                )}
                              </div>
                            )}
                            {(item.price !== null ||
                              item.studentPrice !== null) && (
                              <div
                                style={{
                                  marginLeft: "5pt",
                                  color: "#444",
                                  fontSize: "7.5pt",
                                }}
                              >
                                {item.price !== null && (
                                  <span>{item.price} kr</span>
                                )}
                                {item.price !== null &&
                                  item.studentPrice !== null && (
                                    <span style={{ margin: "0 4pt" }}>·</span>
                                  )}
                                {item.studentPrice !== null && (
                                  <span>Student {item.studentPrice} kr</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {menu?.notes && (
          <div
            dangerouslySetInnerHTML={{ __html: menu.notes }}
            style={{
              marginTop: "10pt",
              padding: "6pt 8pt",
              border: "1px solid #d4a800",
              borderRadius: "3pt",
              fontSize: "9pt",
              color: "#7a5a00",
              backgroundColor: "#fffbea",
            }}
          />
        )}

        {menu?.footer && (
          <div
            style={{
              marginTop: "auto",
              borderTop: "1px solid #ccc",
              paddingTop: "8pt",
              fontSize: "8.5pt",
              color: "#555",
              lineHeight: 1.5,
            }}
            dangerouslySetInnerHTML={{ __html: menu.footer }}
          />
        )}
      </div>
    </>
  );
}
