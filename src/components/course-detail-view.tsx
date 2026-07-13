import Link from "next/link";
import { eq, and, sql } from "drizzle-orm";
import { RichTextContent } from "@/components/rich-text-content";
import { ButtonLink } from "@/components/button-link";
import { ParticipantStoryCard } from "@/components/participant-story-card";
import { mediaUrl } from "@/lib/r2/client";
import { getDb } from "@/lib/db/client";
import { courseInstance, course, participantStory } from "@/lib/db/schema";
import { formatPeriodLabel, type PeriodType } from "@/lib/course-instance";
import {
  parseApplicationConfig,
  type ApplicationMethod,
} from "@/lib/application-methods";
import { KursBlocksView } from "@/components/kurs-blocks-view";
import {
  SchoolSoftPrescreen,
  type PrescreenField,
} from "@/components/schoolsoft-prescreen";

export type SummerCoursePreview = {
  slug: string;
  title: string;
  startDate: number | null;
  endDate: number | null;
};

export type EveningCoursePreview = {
  slug: string;
  title: string;
  startDate: number | null;
};

export type CourseDetailItem = {
  slug: string;
  title: string;
  headingColor?: string | null;
  excerpt: string;
  tracks?: string | null;
  duration: string | null;
  studyPace: number | null;
  studyAidLevel: string | null;
  locationText?: string | null;
  imageKey: string | null;
  deliveryMode?: string | null;
};

const STUDY_AID: Record<string, string> = {
  compulsory: "This program qualifies for CSN funding at compulsory school level",
  upper_secondary: "This program qualifies for CSN funding at upper secondary level",
  post_secondary: "This program qualifies for CSN funding at post-secondary level",
};

function MethodCta({
  method,
  instanceSlug,
  stepNumber,
  dimmed,
}: {
  method: ApplicationMethod;
  instanceSlug: string;
  stepNumber?: number;
  dimmed?: boolean;
}) {
  const stepLabel =
    stepNumber !== undefined ? (
      <span className="mr-2 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-green-dark text-xs font-bold text-white">
        {stepNumber}
      </span>
    ) : null;

  const wrapper = (children: React.ReactNode, note?: string) => (
    <div className={dimmed ? "opacity-50" : undefined}>
      {children}
      {dimmed && (
        <p className="mt-1 text-sm text-gray-700">
          Complete step {(stepNumber ?? 1) - 1} first.
        </p>
      )}
      {note && <p className="mt-1 text-sm text-gray-600">{note}</p>}
    </div>
  );

  if (method.type === "form") {
    return wrapper(
      <ButtonLink href={`/apply/${instanceSlug}`} size="lg" variant="primary">
        {stepLabel}
        {method.label || "Apply"}
      </ButtonLink>,
      method.note,
    );
  }

  if (method.type === "url") {
    return wrapper(
      <ButtonLink href={method.url} size="lg" variant="primary" external>
        {stepLabel}
        {method.label}
      </ButtonLink>,
      method.note,
    );
  }

  if (method.type === "email") {
    const href = method.subject
      ? `mailto:${method.email}?subject=${encodeURIComponent(method.subject)}`
      : `mailto:${method.email}`;
    return wrapper(
      <ButtonLink href={href} size="lg" variant="primary">
        {stepLabel}
        {method.label || "Apply via email"}
      </ButtonLink>,
      method.note,
    );
  }

  if (method.type === "schoolsoft") {
    return wrapper(
      <ButtonLink href={method.url} size="lg" variant="primary" external>
        {stepLabel}
        {method.label || "Apply via SchoolSoft"}
      </ButtonLink>,
      method.note,
    );
  }

  if (method.type === "physical") {
    return wrapper(
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        {stepLabel && (
          <span className="mb-1 inline-flex">
            {stepLabel}{" "}
            <span className="ml-1 text-sm font-medium text-gray-700">
              Paper application
            </span>
          </span>
        )}
        <p className="text-sm text-gray-700">{method.info}</p>
      </div>,
      method.note,
    );
  }

  return null;
}

function getPrescreenFields(extraFieldsJson: string): PrescreenField[] {
  try {
    const fields = JSON.parse(extraFieldsJson) as Array<{
      id: string;
      label: string;
      type: string;
      options?: string[];
      required?: boolean;
    }>;
    return fields.filter(
      (f): f is PrescreenField =>
        f.required === true &&
        (f.type === "text" || f.type === "textarea" || f.type === "select"),
    );
  } catch {
    return [];
  }
}

type Props = {
  item: CourseDetailItem;
  backHref: string;
  backLabel: string;
  accentColor?: string;
  summerCourses?: SummerCoursePreview[];
  eveningCourses?: EveningCoursePreview[];
  isArchived?: boolean;
};

export async function CourseDetailView({
  item,
  backHref,
  backLabel,
  accentColor = "brand-green",
  summerCourses,
  eveningCourses,
  isArchived = false,
}: Props) {
  const [randomStory = null] = await getDb()
    .select({
      name: participantStory.name,
      graduationYear: participantStory.graduationYear,
      courseName: participantStory.courseName,
      imageKey: participantStory.imageKey,
      story: participantStory.story,
    })
    .from(participantStory)
    .where(
      and(
        eq(participantStory.published, true),
        eq(participantStory.courseName, item.title),
      ),
    )
    .orderBy(sql`RANDOM()`)
    .limit(1);

  const [kursRow] = await getDb()
    .select({ applicationSectionHeading: course.applicationSectionHeading })
    .from(course)
    .where(eq(course.slug, item.slug))
    .limit(1);
  const sectionHeading = kursRow?.applicationSectionHeading || "Apply";

  const allInstances = await getDb()
    .select({
      slug: courseInstance.slug,
      year: courseInstance.year,
      periodType: courseInstance.periodType,
      week: courseInstance.week,
      startDate: courseInstance.startDate,
      endDate: courseInstance.endDate,
      spots: courseInstance.spots,
      applicationMethods: courseInstance.applicationMethods,
      applicationText: courseInstance.applicationText,
      applicationBlocks: courseInstance.applicationBlocks,
      extraFields: courseInstance.extraFields,
    })
    .from(courseInstance)
    .innerJoin(course, eq(courseInstance.courseId, course.id))
    .where(eq(course.slug, item.slug))
    .orderBy(courseInstance.sortOrder, courseInstance.year);

  const activeInstances = allInstances.map((inst) => ({
    ...inst,
    config: parseApplicationConfig(inst.applicationMethods),
  }));

  return (
    <>
      {item.imageKey && (
        <div
          className="w-full h-[70vh]"
          style={{
            backgroundImage: `url(${mediaUrl(item.imageKey)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          aria-hidden="true"
        />
      )}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Link
          href={backHref}
          className="underline-offset-2 hover:underline hover:text-brand-green-dark transition-colors"
        >
          ← {backLabel}
        </Link>

        {isArchived && (
          <div className="mt-8 rounded-xl border border-orange-200 bg-orange-50 px-6 py-5 text-center">
            <p className="font-semibold text-orange-900">
              This course is not currently offered
            </p>
            <p className="mt-1 text-sm text-orange-700">
              The course may resume in the future. Contact the school for
              more information.
            </p>
          </div>
        )}

        <article className="mt-8">
          <header className={`border-t-4 border-t-${accentColor} pt-6`}>
            <h1
              className="leading-tight hyphens-auto"
              style={{ color: item.headingColor ?? "#111827" }}
            >
              {item.title}
            </h1>
            <RichTextContent
              html={item.excerpt}
              className="mt-4 text-lg text-gray-600 leading-relaxed border-b-2 border-brand-green pb-6"
            />
          </header>

          <div className="mt-2 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 border-b-2 border-brand-green pb-2">
            <dl className="flex flex-col gap-3">
              {(() => {
                const tracks = (() => {
                  try {
                    return (JSON.parse(item.tracks ?? "[]") as string[]).filter(
                      Boolean,
                    );
                  } catch {
                    return [];
                  }
                })();
                return tracks.length > 0 ? (
                  <div>
                    <h3>Tracks:</h3>
                    <dd>{tracks.join(" · ")}</dd>
                  </div>
                ) : null;
              })()}
              {item.duration && (
                <div>
                  <h3>Duration:</h3>
                  <dd>{item.duration}</dd>
                </div>
              )}
              {item.studyPace != null && (
                <div>
                  <h3>Pace of study:</h3>
                  <dd>{item.studyPace} %</dd>
                </div>
              )}
              {item.studyAidLevel &&
                item.studyAidLevel !== "none" &&
                STUDY_AID[item.studyAidLevel] && (
                  <div>
                    <h3>Financial aid:</h3>
                    <dd>{STUDY_AID[item.studyAidLevel]}</dd>
                  </div>
                )}
              {item.locationText && (
                <div>
                  <h3>Location:</h3>
                  <dd>{item.locationText}</dd>
                </div>
              )}
            </dl>

            {randomStory && (
              <ParticipantStoryCard
                name={randomStory.name}
                graduationYear={randomStory.graduationYear}
                courseName={randomStory.courseName}
                imageKey={randomStory.imageKey}
                story={randomStory.story}
                collapsible
              />
            )}
          </div>

          {!isArchived && (
            <section className="mt-10 border-b-2 border-brand-green pb-4 pt-8">
              <h2 className="mb-6">{sectionHeading}</h2>
              {activeInstances.length === 0 ? (
                <p className="text-gray-600">
                  No application periods have been added yet.
                </p>
              ) : activeInstances.length === 1 ? (
                (() => {
                  const inst = activeInstances[0];
                  const isOpen =
                    inst.config.open && inst.config.methods.length > 0;
                  const isSequence = inst.config.mode === "sequence";
                  const period = {
                    year: inst.year,
                    periodType: inst.periodType as PeriodType,
                    week: inst.week,
                  };
                  const dateRange = (() => {
                    const fmt = (d: Date | null) =>
                      d
                        ? d.toLocaleDateString("en-US", {
                            timeZone: "Europe/Stockholm",
                            day: "numeric",
                            month: "short",
                          })
                        : null;
                    const s = fmt(inst.startDate);
                    const e = fmt(inst.endDate);
                    return s ? (e ? `${s} – ${e}` : s) : null;
                  })();
                  return (
                    <div className="px-6 py-5 bg-gray-50">
                      <p className="mb-1 font-semibold text-gray-900">
                        {formatPeriodLabel(period)}
                      </p>
                      {(dateRange || inst.spots) && (
                        <p className="mb-3 text-sm text-gray-700">
                          {[
                            dateRange,
                            inst.spots ? `${inst.spots} spots` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      {inst.applicationText && (
                        <p className="mb-4 text-gray-700">
                          {inst.applicationText}
                        </p>
                      )}
                      {inst.applicationBlocks &&
                        inst.applicationBlocks !== "[]" && (
                          <div className="mb-4">
                            <KursBlocksView
                              blocksJson={inst.applicationBlocks}
                            />
                          </div>
                        )}
                      {isOpen
                        ? (() => {
                            const prescreenFields = getPrescreenFields(
                              inst.extraFields,
                            );
                            const ssMethod = inst.config.methods.find(
                              (m) => m.type === "schoolsoft",
                            );
                            const hasForm = inst.config.methods.some(
                              (m) => m.type === "form",
                            );
                            const usePrescreen =
                              ssMethod &&
                              !hasForm &&
                              prescreenFields.length > 0;
                            if (usePrescreen) {
                              return (
                                <div className="space-y-4">
                                  {inst.config.methods
                                    .filter((m) => m.type !== "schoolsoft")
                                    .map((method, idx) => (
                                      <MethodCta
                                        key={idx}
                                        method={method}
                                        instanceSlug={inst.slug}
                                      />
                                    ))}
                                  <SchoolSoftPrescreen
                                    url={ssMethod.url}
                                    label={ssMethod.label}
                                    note={ssMethod.note}
                                    fields={prescreenFields}
                                  />
                                </div>
                              );
                            }
                            return (
                              <div
                                className={
                                  isSequence
                                    ? "space-y-3"
                                    : "flex flex-wrap gap-3"
                                }
                              >
                                {inst.config.methods.map((method, idx) => (
                                  <MethodCta
                                    key={idx}
                                    method={method}
                                    instanceSlug={inst.slug}
                                    stepNumber={
                                      isSequence ? idx + 1 : undefined
                                    }
                                    dimmed={isSequence && idx > 0}
                                  />
                                ))}
                              </div>
                            );
                          })()
                        : !inst.applicationText &&
                          !(
                            inst.applicationBlocks &&
                            inst.applicationBlocks !== "[]"
                          ) && (
                            <p className="text-gray-600">
                              Applications are currently closed.
                            </p>
                          )}
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const allSameText = activeInstances.every(
                    (i) =>
                      i.applicationText === activeInstances[0].applicationText,
                  );
                  const sharedText = allSameText
                    ? activeInstances[0].applicationText
                    : null;
                  return (
                    <>
                      {sharedText && (
                        <p className="mb-5 text-gray-700">{sharedText}</p>
                      )}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {activeInstances.map((inst) => {
                          const isOpen =
                            inst.config.open && inst.config.methods.length > 0;
                          const isSequence = inst.config.mode === "sequence";
                          const period = {
                            year: inst.year,
                            periodType: inst.periodType as PeriodType,
                            week: inst.week,
                          };
                          const dateRange = (() => {
                            const fmt = (d: Date | null) =>
                              d
                                ? d.toLocaleDateString("en-US", {
                                    timeZone: "Europe/Stockholm",
                                    day: "numeric",
                                    month: "short",
                                  })
                                : null;
                            const s = fmt(inst.startDate);
                            const e = fmt(inst.endDate);
                            return s ? (e ? `${s} – ${e}` : s) : null;
                          })();
                          return (
                            <div
                              key={inst.slug}
                              className={`rounded-xl border px-5 py-4 flex flex-col gap-3 ${isOpen ? "border-brand-green bg-gray-50" : "border-gray-200 bg-gray-50 opacity-75"}`}
                            >
                              <div>
                                <p className="font-medium text-gray-800">
                                  {formatPeriodLabel(period)}
                                </p>
                                {(dateRange || inst.spots) && (
                                  <p className="mt-0.5 text-sm text-gray-700">
                                    {[
                                      dateRange,
                                      inst.spots
                                        ? `${inst.spots} spots`
                                        : null,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </p>
                                )}
                                {!allSameText && inst.applicationText && (
                                  <p className="mt-2 text-sm text-gray-700">
                                    {inst.applicationText}
                                  </p>
                                )}
                              </div>
                              {inst.applicationBlocks &&
                                inst.applicationBlocks !== "[]" && (
                                  <KursBlocksView
                                    blocksJson={inst.applicationBlocks}
                                  />
                                )}
                              {isOpen ? (
                                (() => {
                                  const prescreenFields = getPrescreenFields(
                                    inst.extraFields,
                                  );
                                  const ssMethod = inst.config.methods.find(
                                    (m) => m.type === "schoolsoft",
                                  );
                                  const hasForm = inst.config.methods.some(
                                    (m) => m.type === "form",
                                  );
                                  const usePrescreen =
                                    ssMethod &&
                                    !hasForm &&
                                    prescreenFields.length > 0;
                                  if (usePrescreen) {
                                    return (
                                      <div className="space-y-3">
                                        {inst.config.methods
                                          .filter(
                                            (m) => m.type !== "schoolsoft",
                                          )
                                          .map((method, idx) => (
                                            <MethodCta
                                              key={idx}
                                              method={method}
                                              instanceSlug={inst.slug}
                                            />
                                          ))}
                                        <SchoolSoftPrescreen
                                          url={ssMethod.url}
                                          label={ssMethod.label}
                                          note={ssMethod.note}
                                          fields={prescreenFields}
                                        />
                                      </div>
                                    );
                                  }
                                  return (
                                    <div
                                      className={
                                        isSequence
                                          ? "space-y-2"
                                          : "flex flex-wrap gap-2"
                                      }
                                    >
                                      {inst.config.methods.map(
                                        (method, idx) => (
                                          <MethodCta
                                            key={idx}
                                            method={method}
                                            instanceSlug={inst.slug}
                                            stepNumber={
                                              isSequence ? idx + 1 : undefined
                                            }
                                            dimmed={isSequence && idx > 0}
                                          />
                                        ),
                                      )}
                                    </div>
                                  );
                                })()
                              ) : (
                                <p className="text-sm text-gray-600">
                                  {!inst.applicationText &&
                                  !inst.applicationBlocks
                                    ? "Closed"
                                    : ""}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()
              )}
            </section>
          )}

          {summerCourses && summerCourses.length > 0 && (
            <section className="mt-10 border-t border-gray-200 pt-8">
              <div className="flex items-baseline justify-between mb-4">
                <h2>Summer courses</h2>
                <Link
                  href={`/summer-courses/course/${item.slug}`}
                  className="text-sm text-brand-green-dark hover:underline"
                >
                  View all →
                </Link>
              </div>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {summerCourses.map((sc) => {
                  const startStr = sc.startDate
                    ? new Date(sc.startDate).toLocaleDateString("en-US", {
                        timeZone: "Europe/Stockholm",
                        day: "numeric",
                        month: "short",
                      })
                    : null;
                  const endStr = sc.endDate
                    ? new Date(sc.endDate).toLocaleDateString("en-US", {
                        timeZone: "Europe/Stockholm",
                        day: "numeric",
                        month: "short",
                      })
                    : null;
                  const dateRange = startStr
                    ? endStr
                      ? `${startStr} – ${endStr}`
                      : startStr
                    : null;
                  return (
                    <li key={sc.slug}>
                      <Link
                        href={`/summer-courses/${sc.slug}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <span>{sc.title}</span>
                        <span className="shrink-0 ml-4">{dateRange}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {eveningCourses && eveningCourses.length > 0 && (
            <section className="mt-10 border-t border-gray-200 pt-8">
              <div className="flex items-baseline justify-between mb-4">
                <h2>Evening courses</h2>
                <Link
                  href={`/evening-courses/course/${item.slug}`}
                  className="text-brand-green-dark hover:underline"
                >
                  View all →
                </Link>
              </div>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {eveningCourses.map((ec) => {
                  const startStr = ec.startDate
                    ? new Date(ec.startDate).toLocaleDateString("en-US", {
                        timeZone: "Europe/Stockholm",
                        day: "numeric",
                        month: "long",
                      })
                    : null;
                  return (
                    <li key={ec.slug}>
                      <Link
                        href={`/evening-courses/${ec.slug}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <span>{ec.title}</span>
                        {startStr && (
                          <span className="shrink-0 ml-4">{startStr}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </article>
      </div>
    </>
  );
}
