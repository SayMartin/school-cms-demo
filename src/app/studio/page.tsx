import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { course, venue } from "@/lib/db/schema";
import { AccordionBlock } from "@/components/accordion-block";
import { DevBgPicker } from "@/components/dev-bg-picker";
import { StudioSectionGrid } from "@/components/studio-section-grid";
import type { StudioSection } from "@/components/studio-section-card";

export const metadata: Metadata = { title: "Studio" };
export const dynamic = "force-dynamic";

type SubGroup = {
  heading?: string;
  sections: StudioSection[];
};

// ─── A) Home ───────────────────────────────────────────────────────────────────

const HEM: StudioSection = {
  href: "/studio/home",
  label: "Home page",
  description: "Blocks on the home page (course groups, departments, text, etc.) and the Why Us text",
  color: "border-t-brand-green-dark",
  contentTypes: ["blocks", "fields"],
};

// ─── B) Courses — detail pages (built dynamically in the page function) ──────────────

const PRAKTISK_INFO: StudioSection = {
  href: "/studio/summer-courses-practical-info",
  label: "Practical Info Summer Courses",
  description: "Content on the Practical Information Summer Courses page",
  color: "border-t-brand-yellow",
  contentTypes: ["blocks"],
};


type KursRow = { slug: string; title: string; courseType: string; deliveryMode: string | null; isPublished: boolean };

const SHORT_PRIORITY: Record<string, number> = {
  "studiemotiverande-folkhogskola": 0,
  "forsta-hjalpen-till-psykisk-halsa": 1,
};

function kursTypeLabel(c: KursRow): string | undefined {
  if (c.courseType === "program_track") return "Education Track";
  if (c.courseType === "program") return "Education Program";
  if (c.courseType === "summer") return "Summer Course";
  if (c.courseType === "evening") return "Evening Course";
  return undefined; // short = SMF/MHFA, no label
}

function kursToSection(c: KursRow): StudioSection {
  const isDistance = c.deliveryMode === "distance_pure" || c.deliveryMode === "distance_hybrid";
  const color =
    c.courseType === "program_track"
      ? "border-t-brand-green-dark"
      : c.courseType === "program"
        ? isDistance ? "border-t-brand-pink" : "border-t-brand-green-dark"
        : c.courseType === "summer"
          ? "border-t-brand-yellow"
          : c.courseType === "evening"
            ? "border-t-brand-blue"
            : "border-t-brand-pink";
  return {
    href: `/studio/manage-courses/${c.slug}/edit`,
    label: c.title,
    description: c.isPublished ? "Published" : "Not published",
    typeLabel: kursTypeLabel(c),
    color,
    contentTypes: ["blocks", "fields"],
  };
}

function sortKortkurser(list: KursRow[]): KursRow[] {
  return [...list].sort((a, b) => {
    const aIsShort = a.courseType === "short";
    const bIsShort = b.courseType === "short";
    if (aIsShort !== bIsShort) return aIsShort ? -1 : 1;
    if (aIsShort) {
      const pa = SHORT_PRIORITY[a.slug] ?? 99;
      const pb = SHORT_PRIORITY[b.slug] ?? 99;
      if (pa !== pb) return pa - pb;
    }
    return a.title.localeCompare(b.title, "en");
  });
}

// ─── Venue → StudioSection ────────────────────────────────────────────────────

type VenueRow = { slug: string; name: string; category: string | null; published: boolean };

function venueToSection(v: VenueRow): StudioSection {
  return {
    href: `/studio/manage-venues/${v.slug}/edit`,
    label: v.name,
    description: v.published ? "Published" : "Not published",
    typeLabel: v.category ?? undefined,
    color: "border-t-brand-yellow",
    contentTypes: ["blocks", "fields"],
  };
}

// ─── C) Hub pages ──────────────────────────────────────────────────────────────

const HUBSIDOR: StudioSection[] = [
  {
    href: "/studio/nav-hub/utbildningar",
    label: "Education Programs — hub page",
    description: "Heading, intro and blocks on /education-programs",
    color: "border-t-brand-green-dark",
    contentTypes: ["blocks"],
  },
  {
    href: "/studio/nature-life-courses",
    label: "Nature & Outdoor Courses — hub page",
    description: "Department and blocks on the nature & outdoor courses page",
    color: "border-t-brand-green-dark",
    contentTypes: ["blocks"],
  },
  {
    href: "/studio/nav-hub/short-courses",
    label: "Short Courses — hub page",
    description: "Heading, intro and blocks on /short-courses",
    color: "border-t-brand-yellow",
    contentTypes: ["blocks"],
  },
  {
    href: "/studio/summer-courses",
    label: "Summer Courses — hub page",
    description: "Blocks above the course list on the summer courses page",
    color: "border-t-brand-yellow",
    contentTypes: ["blocks"],
  },
  {
    href: "/studio/evening-courses",
    label: "Evening Courses — hub page",
    description: "Blocks above the course list on the evening courses page",
    color: "border-t-brand-yellow",
    contentTypes: ["blocks"],
  },
  {
    href: "/studio/news",
    label: "News — hub page",
    description: "Heading and blocks above the news list on /news",
    color: "border-t-brand-green-dark",
    contentTypes: ["blocks"],
  },
  {
    href: "/studio/participant-stories-hub",
    label: "Participant Stories — hub page",
    description: "Blocks above the stories list on /participant-stories",
    color: "border-t-brand-pink",
    contentTypes: ["blocks"],
  },
  {
    href: "/studio/nav-hub/skolan",
    label: "School — hub page",
    description: "Heading, intro and blocks on /about",
    color: "border-t-brand-blue",
    contentTypes: ["blocks"],
  },
  {
    href: "/studio/venues-content",
    label: "Venues — hub page",
    description: "Intro block and NavGroup on /venues",
    color: "border-t-brand-yellow",
    contentTypes: ["blocks"],
  },
];

// ─── D) School ────────────────────────────────────────────────────────────────

const SKOLAN_SUBGROUPS: SubGroup[] = [
  {
    heading: "About the school",
    sections: [
      {
        href: "/studio/association",
        label: "Association",
        description: "Intro, buildings, association and board intro",
        color: "border-t-brand-blue",
        contentTypes: ["blocks", "fields"],
      },
      {
        href: "/studio/admissions-content",
        label: "Admission Periods",
        description: "Intro text and courses with admission status",
        color: "border-t-brand-green-dark",
        contentTypes: ["blocks"],
      },
      {
        href: "/studio/history",
        label: "History",
        description: "The school's history, from 1870 to today",
        color: "border-t-brand-yellow",
        contentTypes: ["blocks"],
      },
      {
        href: "/studio/careers",
        label: "Job Openings",
        description: "Job openings and open-application information",
        color: "border-t-brand-yellow",
        contentTypes: ["blocks"],
      },
      {
        href: "/studio/boarding",
        label: "Boarding",
        description: "Housing, prices, meals, FAQ and contact details",
        color: "border-t-brand-green-dark",
        contentTypes: ["blocks"],
      },
    ],
  },
  {
    heading: "Student info",
    sections: [
      {
        href: "/studio/study-guidance",
        label: "Study Guidance",
        description: "Intro text and study guidance counselor contact details",
        color: "border-t-brand-pink",
        contentTypes: ["blocks"],
      },
      {
        href: "/studio/student-support",
        label: "Student Support",
        description: "Intro text and counselor contact details",
        color: "border-t-brand-pink",
        contentTypes: ["blocks"],
      },
      {
        href: "/studio/student-rights",
        label: "Student Rights",
        description: "Student rights standard and policy page",
        color: "border-t-brand-yellow",
        contentTypes: ["blocks"],
      },
      {
        href: "/studio/term-dates",
        label: "Term Dates",
        description: "Term and holiday dates for long courses",
        color: "border-t-brand-blue",
        contentTypes: ["blocks"],
      },
      {
        href: "/studio/report-issue",
        label: "Report an Issue",
        description: "Intro text on the report-an-issue page",
        color: "border-t-brand-yellow",
        contentTypes: ["blocks"],
      },
    ],
  },
  {
    heading: "Other pages",
    sections: [
      {
        href: "/studio/folk-education",
        label: "Folk Education",
        description: "Free-form blocks on the folk education page",
        color: "border-t-brand-blue",
        contentTypes: ["blocks"],
      },
      {
        href: "/studio/contact",
        label: "Contact Page",
        description: "Address, phone, email, bank giro and free-form blocks",
        color: "border-t-brand-blue",
        contentTypes: ["blocks", "fields"],
      },
    ],
  },
];

// ─── E) Administration ────────────────────────────────────────────────────────

const ADMINISTRATION: StudioSection[] = [
  {
    href: "/studio/manage-news",
    label: "Manage News",
    description: "News and events from the school",
    color: "border-t-brand-green-dark",
    contentTypes: ["data"],
  },
  {
    href: "/studio/manage-stories",
    label: "Manage Stories",
    description: "Participant stories — create, edit and publish",
    color: "border-t-brand-pink",
    contentTypes: ["data"],
  },
  {
    href: "/studio/manage-courses",
    label: "Manage Courses",
    description: "All course types in one list — education programs, summer and evening courses",
    color: "border-t-brand-green-dark",
    contentTypes: ["data"],
  },
  {
    href: "/studio/manage-venues",
    label: "Manage Venues",
    description: "Bookable venues, inquiries and content",
    color: "border-t-brand-yellow",
    contentTypes: ["blocks", "data"],
  },
  {
    href: "/studio/manage-course-instances",
    label: "Course Instances & Applications",
    description: "Registration codes, SchoolSoft ID and application forms per course instance",
    color: "border-t-brand-green-dark",
    contentTypes: ["data"],
  },
  {
    href: "/studio/applications",
    label: "Received Applications",
    description: "Manage and mark the status of applications from applicants",
    color: "border-t-brand-green-dark",
    contentTypes: ["data"],
  },
  {
    href: "/studio/profiles",
    label: "Manage Profiles",
    description: "Staff with photo, contact info and departments",
    color: "border-t-brand-blue",
    contentTypes: ["data"],
  },
  {
    href: "/studio/departments",
    label: "Manage Departments",
    description: "Name, sort order, short link and cover image per department",
    color: "border-t-brand-blue",
    contentTypes: ["data"],
  },
  {
    href: "/studio/formatmallar",
    label: "Style Templates",
    description: "Choose fonts for headings and body text across the whole site",
    color: "border-t-brand-pink",
    contentTypes: ["fields"],
  },
];


function SubGroupedAccordion({
  label,
  subGroups,
}: {
  label: string;
  subGroups: SubGroup[];
}) {
  return (
    <AccordionBlock summary={label} defaultOpen>
      <div className="space-y-8">
        {subGroups.map((sg, i) => (
          <div key={i}>
            {sg.heading && (
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest">
                {sg.heading}
              </p>
            )}
            <StudioSectionGrid sections={sg.sections} />
          </div>
        ))}
      </div>
    </AccordionBlock>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StudioPage() {
  const db = getDb();
  const [courses, venues] = await Promise.all([
    db
      .select({ slug: course.slug, title: course.title, courseType: course.courseType, deliveryMode: course.deliveryMode, isPublished: course.isPublished })
      .from(course)
      .orderBy(asc(course.title)),
    db
      .select({ slug: venue.slug, name: venue.name, category: venue.category, published: venue.published })
      .from(venue)
      .orderBy(asc(venue.sortOrder)),
  ]);

  const utbildningar = courses.filter((c) => c.courseType === "program" || c.courseType === "program_track");
  const sommarkurser = courses.filter((c) => c.courseType === "summer");
  const kortkurser   = sortKortkurser(courses.filter((c) => c.courseType === "short"));
  const kvallskurser = courses.filter((c) => c.courseType === "evening").sort((a, b) => a.title.localeCompare(b.title, "en"));

  const kurserSubGroups: SubGroup[] = [
    { heading: "Education Programs",  sections: utbildningar.map(kursToSection) },
    {
      heading: "Summer Courses",
      sections: [PRAKTISK_INFO, ...sommarkurser.map(kursToSection)],
    },
    { heading: "Short Courses",   sections: kortkurser.map(kursToSection) },
    { heading: "Evening Courses", sections: kvallskurser.map(kursToSection) },
  ].filter((sg) => sg.heading === "Evening Courses" || sg.sections.length > 0);

  const venueSubGroups: SubGroup[] = venues.length > 0
    ? [{ sections: venues.map(venueToSection) }]
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-gray-600">Studio</p>
        <h1 className="mt-1">Content Management</h1>
      </div>

      {/* Help */}
      <div className="mb-6">
        <AccordionBlock summary="How do I do this?">
          <div className="space-y-8 text-sm text-gray-700">

            {/* What is Studio */}
            <div>
              <h3>What is Studio?</h3>
              <p className="mt-1 text-gray-600">
                Studio is the website&apos;s editing tool — no coding required.
                What you save here shows up immediately on the public site.
              </p>
              <p className="mt-2 text-gray-600">
                Pages are grouped into six sections: <strong>Home</strong>, <strong>Courses</strong> (per-course detail pages), <strong>Hub pages</strong> (landing pages with navigation circles), <strong>Venues</strong>, <strong>School</strong>, and <strong>Administration</strong> (manage courses, venues, profiles).
              </p>
            </div>

            {/* Dev vs Prod */}
            <div>
              <h3>Demo environment</h3>
              <p className="mt-1 text-gray-600">
                This is a portfolio demo with a single environment — there&apos;s no separate dev/prod split.
                Everything you save here shows up immediately on this demo&apos;s public pages.
              </p>
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-amber-900 mb-1">The content is made up</p>
                <p className="text-sm text-amber-800">
                  Staff, courses, news and menus in this demo are entirely fictional and can be edited
                  freely without affecting any real production site.
                </p>
              </div>
            </div>

            {/* Kurs vs Kursinstans */}
            <div>
              <h3>Course vs. course instance — what&apos;s the difference?</h3>
              <p className="mt-1 text-gray-600">
                There are two different levels when managing courses in Studio. It&apos;s important to understand the difference.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-brand-green bg-brand-green/10 p-4">
                  <p className="font-semibold text-gray-900 mb-2">Course — the template</p>
                  <p className="text-gray-700 text-sm mb-3">
                    A course is the <strong>timeless content</strong> — the pedagogy, the purpose and the description of what you&apos;ll learn. This text applies regardless of which year the course runs.
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>✔ What the course is about</li>
                    <li>✔ What participants will learn</li>
                    <li>✔ Pace, funding, location</li>
                    <li>✔ Teachers and profiles</li>
                    <li>✔ Heading for the application section (e.g. &quot;Registration&quot; for evening and summer courses)</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-brand-blue bg-brand-blue/10 p-4">
                  <p className="font-semibold text-gray-900 mb-2">Course instance — the occurrence</p>
                  <p className="text-gray-700 text-sm mb-3">
                    A course instance is a <strong>specific admission round</strong> — when the course runs, how to apply and how many spots are available.
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>✔ Start and end dates</li>
                    <li>✔ Number of spots</li>
                    <li>✔ Application methods (form, SchoolSoft, email …)</li>
                    <li>✔ Admission period (Spring 26, Fall 26 …)</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 sm:col-span-2 lg:col-span-1">
                  <p className="font-semibold text-amber-900 mb-1">Keep the course description timeless</p>
                  <p className="text-sm text-amber-800">
                    Never write &quot;Next intake starts fall 2026&quot; or &quot;Apply by April 15&quot; in the course description — that belongs in the course instance.
                  </p>
                  <p className="text-sm text-amber-800 mt-2">
                    Think of the course as a <em>program</em> in a TV guide and the course instance as a <em>broadcast time slot</em>.
                  </p>
                </div>
              </div>
              <p className="mt-3 text-gray-600 text-sm">
                You manage courses under <strong>Administration → Manage Courses</strong> and course instances under <strong>Course Instances &amp; Applications</strong>.
              </p>
            </div>

            {/* Applications per course instance */}
            <div>
              <h3>Applications — configure per course instance</h3>
              <p className="mt-1 mb-3 text-gray-600">
                All application management happens under <strong>Administration → Course Instances &amp; Applications</strong>. Expand a course instance to edit it.
              </p>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-44">Open / Closed</span>
                  <span>Controls whether applications show as active on the course page. You must have added at least one application method to open it — otherwise the toggle is disabled.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-44">Application methods</span>
                  <span>
                    Add one or more:
                    <ul className="mt-1.5 space-y-1 text-gray-600">
                      <li><strong>Form</strong> — The applicant fills in a form on the website. Answers are stored and appear under Received Applications.</li>
                      <li><strong>SchoolSoft</strong> — Link to SchoolSoft&apos;s admissions system. Filled in automatically if a SchoolSoft ID is set.</li>
                      <li><strong>Link (URL)</strong> — External link, e.g. Google Forms.</li>
                      <li><strong>Email</strong> — Opens the applicant&apos;s email client with a prefilled recipient.</li>
                      <li><strong>Paper application</strong> — Instructions for applicants sending in a paper application.</li>
                    </ul>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-44">Order</span>
                  <span>
                    <strong>Methods are optional to choose between</strong> — The applicant freely picks among the methods.{" "}
                    <strong>Methods are carried out in sequence</strong> — The methods are shown numbered, and the next one is enabled once the previous is done. Suits &quot;Submit form → Register in SchoolSoft&quot;.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-44">Extra fields</span>
                  <span>
                    Custom questions in the form. Choose a type: <strong>Short text</strong>, <strong>Long text</strong>, <strong>Multiple choice</strong> (comma-separated options), or <strong>File upload</strong> (set the max number of files). Check <strong>Required</strong> for fields that must be answered.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-44">Application blocks</span>
                  <span>Section and accordion blocks shown in the application section on the public course page — e.g. requirements, key dates and a process explanation.</span>
                </li>
              </ul>
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="font-semibold text-blue-900 mb-1">SchoolSoft as the only method + required extra fields</p>
                <p className="text-sm text-blue-800">
                  If you choose SchoolSoft (without Form) and have required extra fields, the questions appear directly on the course page — the SchoolSoft button activates once the applicant has answered all of them. <strong>Note: the answers are not stored in Studio</strong> in this mode. If you want to save the answers, use Form + SchoolSoft in sequence mode.
                </p>
              </div>
            </div>

            {/* Received applications */}
            <div>
              <h3>Received applications</h3>
              <p className="mt-1 mb-3 text-gray-600">
                Under <strong>Administration → Received Applications</strong> you see all form applications.
              </p>
              <ol className="space-y-2 text-gray-600">
                <li className="flex gap-2"><span className="shrink-0 font-semibold text-gray-600">1.</span> Choose a <strong>course</strong> in the left-hand dropdown.</li>
                <li className="flex gap-2"><span className="shrink-0 font-semibold text-gray-600">2.</span> Choose a <strong>term</strong> in the right-hand menu — the list only shows terms for the selected course.</li>
                <li className="flex gap-2"><span className="shrink-0 font-semibold text-gray-600">3.</span> Click a row to see the applicant&apos;s details, answers to course-specific questions and attached files.</li>
                <li className="flex gap-2"><span className="shrink-0 font-semibold text-gray-600">4.</span> Set the status: <span className="rounded-full bg-amber-100 px-2 py-0.5 text-sm font-medium text-amber-700">New</span> <span className="rounded-full bg-blue-100 px-2 py-0.5 text-sm font-medium text-blue-700">Reviewing</span> <span className="rounded-full bg-green-100 px-2 py-0.5 text-sm font-medium text-green-700">Accepted</span> <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-600">Declined</span>.</li>
              </ol>
              <p className="mt-3 text-gray-600 text-sm">
                Answers to course-specific extra fields are shown with the question&apos;s full text as the heading — not the internal field ID.
              </p>
            </div>

            {/* Tre sidtyper */}
            <div>
              <h3>Three page types</h3>
              <p className="mt-1 mb-3 text-gray-600">The badge in the card&apos;s bottom corner shows what you can do on the page.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-block shrink-0 rounded-full border border-green-600 px-2 py-0.5 text-sm font-medium text-green-700">Block editor</span>
                  <span className="text-gray-600">You build the page freely with blocks — text, images, accordions, navigation circles. Add, move and remove blocks however you like.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-block shrink-0 rounded-full border border-brand-pink-dark px-2 py-0.5 text-sm font-medium text-brand-pink-dark">Fields</span>
                  <span className="text-gray-600">The page has fixed fields to fill in — heading, intro, address. No blocks to manage.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-block shrink-0 rounded-full border border-blue-500 px-2 py-0.5 text-sm font-medium text-blue-600">Data</span>
                  <span className="text-gray-600">A list to manage: courses, staff, venues, issue reports. There&apos;s no free text to edit.</span>
                </li>
              </ul>
            </div>

            {/* Step by step */}
            <div>
              <h3>Editing a page — step by step</h3>
              <p className="mt-0.5 mb-3 text-gray-600">
                Applies to pages with the{" "}
                <span className="rounded-full border border-green-600 px-1.5 text-sm font-medium text-green-700">Block editor</span> badge.
              </p>
              <ol className="space-y-2 text-gray-600">
                <li className="flex gap-2"><span className="shrink-0 font-semibold text-gray-600">1.</span> Click a card to open the page.</li>
                <li className="flex gap-2"><span className="shrink-0 font-semibold text-gray-600">2.</span> Click <span className="rounded bg-gray-200 px-1.5 py-0.5 text-sm">+ Section</span> (or another block type) in the green row at the top.</li>
                <li className="flex gap-2"><span className="shrink-0 font-semibold text-gray-600">3.</span> Fill in the text fields. Move blocks with ▲ ▼. Remove with the red <strong>Remove</strong> button.</li>
                <li className="flex gap-2"><span className="shrink-0 font-semibold text-gray-600">4.</span> Click <span className="rounded border border-brand-green-dark bg-brand-green px-1.5 py-0.5 text-sm font-medium text-gray-900">Save changes</span>.</li>
                <li className="flex gap-2"><span className="shrink-0 font-semibold text-gray-600">5.</span> Open the page on the web and check that it looks right.</li>
              </ol>
            </div>

            {/* Blocktyper */}
            <div>
              <h3>Block types</h3>
              <p className="mt-1 mb-3 text-gray-600">All block types are available in the block editor. Types marked ✦ are only available on hub pages.</p>
              <ul className="space-y-2.5 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-32">Section</span>
                  <span>Running text with an optional heading. The most common block for all editorial text.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-32">Accordion</span>
                  <span>Text that expands when the visitor clicks — suits FAQs, detail information and long texts.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-32">Slideshow</span>
                  <span>One or more images in a browsable gallery. Upload images directly in the block.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-32">Profiles</span>
                  <span>Choose which staff members should be shown as profile cards — pulls data from the staff list.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-32">YouTube</span>
                  <span>Paste a YouTube link and the video embeds directly on the page.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-32">Video</span>
                  <span>Upload your own video file (MP4/WebM, max 200 MB) that plays directly on the page.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-32">NavGroup ✦</span>
                  <span>
                    Navigation circles — you write a heading, link and optional intro for each circle.
                    Choose a <strong>circle style</strong> per circle: <em>With image</em> (upload an image shown in the circle) or <em>Without image</em> (solid color circle).
                    Under each circle there&apos;s a <strong>color picker</strong> — choose from the brand colors to change the circle&apos;s color.
                    Only available on hub pages.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-32">CourseGroup ✦</span>
                  <span>
                    Hand-picked course cards — choose courses and departments from a list and decide the order.
                    Click the <strong>Band color</strong> button under a course to change the color of the band behind the course name.
                    Only available on hub pages.
                  </span>
                </li>
              </ul>
            </div>

            {/* Color pickers */}
            <div>
              <h3>Color pickers</h3>
              <p className="mt-1 mb-3 text-gray-600">There are three types of color pickers in Studio — all choosing from the brand color palette.</p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-36">Heading color</span>
                  <span>On pages with an editable heading there&apos;s a small color circle next to the heading text. Click it to change the heading&apos;s text color. Uncheck the visibility checkbox to hide the heading entirely.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-36">Circle color (NavGroup)</span>
                  <span>Each circle in a NavGroup block has its own color button right below the circle&apos;s input fields. Click to choose a color — the preview updates immediately.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-gray-800 w-36">Band color (CourseGroup)</span>
                  <span>Each course in a CourseGroup block has a <strong>Band color</strong> button. Click to open the color picker for that course — the band behind the course name changes color immediately.</span>
                </li>
              </ul>
            </div>

            {/* Hubsidor */}
            <div>
              <h3>Hub pages</h3>
              <p className="mt-1 text-gray-600">
                A hub page is a landing page that shows circles leading to sub-pages — e.g. <em>Education Programs</em>, <em>Short Courses</em>, <em>School</em>, and <em>Venues</em>. You edit the heading, intro and blocks under <strong>Hub pages</strong> in the list below.
              </p>
              <p className="mt-2 text-gray-600">
                On Venues, the circles are generated automatically from the venues you add under <strong>Manage Venues</strong> — you don&apos;t need to add them manually.
              </p>
            </div>

            {/* Hantera Aktuellt */}
            <div>
              <h3>Manage News — news items</h3>
              <p className="mt-1 text-gray-600">
                Under <strong>Administration → Manage News</strong> you create and edit news and events. Each news item gets its own page at <em>/news/…</em> and is listed automatically on the news page, newest first.
              </p>
              <p className="mt-2 mb-3 text-gray-600">Create a new news item:</p>
              <ol className="space-y-2 text-gray-600">
                <li className="flex gap-2"><span className="shrink-0 font-semibold text-gray-600">1.</span> Click <span className="rounded border border-brand-green-dark bg-brand-green px-1.5 py-0.5 text-sm font-medium text-gray-900">+ New news item</span> at the top right of the list.</li>
                <li className="flex gap-2"><span className="shrink-0 font-semibold text-gray-600">2.</span> Write a <strong>title</strong>. The URL (slug) is generated automatically — click <span className="rounded bg-gray-200 px-1.5 py-0.5 text-sm">✎ Edit slug</span> if you want to change it.</li>
                <li className="flex gap-2"><span className="shrink-0 font-semibold text-gray-600">3.</span> Fill in the <strong>author</strong> (optional) and upload a <strong>cover image</strong> that appears in the news list.</li>
                <li className="flex gap-2"><span className="shrink-0 font-semibold text-gray-600">4.</span> Build the text itself with blocks — <strong>Section</strong>, <strong>Accordion</strong>, <strong>Slideshow</strong>, <strong>YouTube</strong> and <strong>Video</strong>.</li>
                <li className="flex gap-2"><span className="shrink-0 font-semibold text-gray-600">5.</span> Choose a publishing option: <strong>Immediately</strong>, <strong>Choose a date</strong> (schedule it for the future) or <strong>Save as draft</strong>.</li>
                <li className="flex gap-2"><span className="shrink-0 font-semibold text-gray-600">6.</span> Click <span className="rounded border border-brand-green-dark bg-brand-green px-1.5 py-0.5 text-sm font-medium text-gray-900">Save changes</span>.</li>
              </ol>
              <p className="mt-3 text-gray-600">
                In the list you can <strong>Edit</strong> or <strong>Remove</strong> a news item. Drafts and scheduled news items show the{" "}
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-sm font-medium text-amber-700">Draft</span> badge until the publish date has passed.
              </p>
              <p className="mt-2 text-gray-600">
                To change the <strong>heading or text above</strong> the news list, edit <em>News — hub page</em> under <strong>Hub pages</strong> — not here.
              </p>
            </div>

            {/* Delete confirmation */}
            <div>
              <h3>Delete confirmation</h3>
              <p className="mt-1 text-gray-600">
                The <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-sm font-medium text-red-700">Delete ›</span> button in the lists (news, courses, profiles, venues, etc.) now opens a confirmation prompt before anything is deleted: <em>&quot;Are you sure you want to delete this? This cannot be undone.&quot;</em> Confirm with <strong>Yes, delete</strong> or close with <strong>Cancel</strong>. So you can no longer accidentally delete something with a single click.
              </p>
            </div>

            {/* Dos och Don'ts */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                <p className="mb-2 font-semibold text-green-800">✅ Keep in mind</p>
                <ul className="space-y-1.5 text-green-900">
                  <li>Always save before closing the tab.</li>
                  <li>Preview on the web after every save.</li>
                  <li>Not sure? Move the block to the bottom instead of deleting it.</li>
                  <li>Keep the course description timeless — dates and applications belong in the course instance.</li>
                  <li>Create a new course instance for each admission round instead of changing the old one.</li>
                </ul>
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                <p className="mb-2 font-semibold text-red-800">⛔ Avoid</p>
                <ul className="space-y-1.5 text-red-900">
                  <li>Don&apos;t paste text from Word/Google Docs — use <span className="text-sm font-mono">Ctrl+Shift+V</span> (plain text).</li>
                  <li>Don&apos;t edit <span className="rounded-full border border-blue-400 px-1.5 text-sm font-medium text-blue-600">Data</span> pages if you&apos;re unsure about the content.</li>
                  <li>Don&apos;t delete blocks if you don&apos;t know what they do.</li>
                  <li>Don&apos;t write &quot;Apply by …&quot; or &quot;Next intake …&quot; in the course description.</li>
                </ul>
              </div>
            </div>

          </div>
        </AccordionBlock>
      </div>

      {/* Background color picker — dev-only */}
      <div className="mb-10">
        <AccordionBlock summary="Background colors">
          <DevBgPicker />
        </AccordionBlock>
      </div>

      <div className="space-y-6">

        {/* A) Home */}
        <section>
          <h2 className="mb-4">Home</h2>
          <StudioSectionGrid sections={[HEM]} />
        </section>

        {/* B) Courses */}
        <section>
          <h2 className="mb-4">Courses</h2>
          <SubGroupedAccordion label="Course detail pages" subGroups={kurserSubGroups} />
        </section>

        {/* C) Hub pages */}
        <section>
          <h2 className="mb-4">Hub pages</h2>
          <AccordionBlock summary="All hub pages" defaultOpen>
            <StudioSectionGrid sections={HUBSIDOR} />
          </AccordionBlock>
        </section>

        {/* Venues */}
        {venueSubGroups.length > 0 && (
          <section>
            <h2 className="mb-4">Venues</h2>
            <SubGroupedAccordion label="Venues" subGroups={venueSubGroups} />
          </section>
        )}

        {/* D) School */}
        <section>
          <h2 className="mb-4">School</h2>
          <SubGroupedAccordion label="Pages under School" subGroups={SKOLAN_SUBGROUPS} />
        </section>

        {/* E) Administration */}
        <section>
          <h2 className="mb-4">Administration</h2>
          <StudioSectionGrid sections={ADMINISTRATION} />
        </section>

      </div>
    </div>
  );
}
