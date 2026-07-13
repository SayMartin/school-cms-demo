"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { findBreadcrumbsFromUrl } from "@/components/RadialNav";
import { SCHOOL_NAV_TREE } from "@/components/RadialNav.example";
import type { RadialNavNode } from "@/components/RadialNav";

type Crumb = { label: string; href?: string };

const EXCLUDED = ["/", "/sign-in", "/403"];
const EXCLUDED_PREFIXES = ["/admin"];
const PORTAL_PREFIXES = ["/studio", "/restaurant-admin"];

// ─── Portal / studio breadcrumbs ──────────────────────────────────────────────

const PORTAL_MAP: Record<string, Crumb[]> = {
  // Restaurant-admin
  "/restaurant-admin": [{ label: "Restaurant" }],
  "/restaurant-admin/menus": [
    { label: "Restaurant", href: "/restaurant-admin" },
    { label: "Weekly Menus" },
  ],
  "/restaurant-admin/menus/new": [
    { label: "Restaurant", href: "/restaurant-admin" },
    { label: "Weekly Menus", href: "/restaurant-admin/menus" },
    { label: "New Weekly Menu" },
  ],
  "/restaurant-admin/dishes": [
    { label: "Restaurant", href: "/restaurant-admin" },
    { label: "Dishes" },
  ],
  "/restaurant-admin/dishes/new": [
    { label: "Restaurant", href: "/restaurant-admin" },
    { label: "Dishes", href: "/restaurant-admin/dishes" },
    { label: "New Dish" },
  ],
  "/restaurant-admin/content": [
    { label: "Restaurant", href: "/restaurant-admin" },
    { label: "Content" },
  ],

  // Studio
  "/studio": [{ label: "Studio" }],
  "/studio/home": [{ label: "Studio", href: "/studio" }, { label: "Home" }],
  "/studio/manage-news": [
    { label: "Studio", href: "/studio" },
    { label: "News" },
  ],
  "/studio/manage-news/new": [
    { label: "Studio", href: "/studio" },
    { label: "News", href: "/studio/manage-news" },
    { label: "New Article" },
  ],
  "/studio/news": [
    { label: "Studio", href: "/studio" },
    { label: "News — hub page" },
  ],
  "/studio/admissions-content": [
    { label: "Studio", href: "/studio" },
    { label: "Admissions" },
  ],
  "/studio/departments": [
    { label: "Studio", href: "/studio" },
    { label: "Departments" },
  ],
  "/studio/participant-stories-hub": [
    { label: "Studio", href: "/studio" },
    { label: "Participant Stories" },
  ],
  "/studio/manage-stories": [
    { label: "Studio", href: "/studio" },
    { label: "Manage Stories" },
  ],
  "/studio/manage-stories/new": [
    { label: "Studio", href: "/studio" },
    { label: "Manage Stories", href: "/studio/manage-stories" },
    { label: "New Story" },
  ],
  "/studio/report-issue-content": [
    { label: "Studio", href: "/studio" },
    { label: "Report an Issue" },
  ],
  "/studio/folk-education": [
    { label: "Studio", href: "/studio" },
    { label: "Folk Education" },
  ],
  "/studio/style-templates": [
    { label: "Studio", href: "/studio" },
    { label: "Style Templates" },
  ],
  "/studio/history": [
    { label: "Studio", href: "/studio" },
    { label: "History" },
  ],
  "/studio/boarding": [
    { label: "Studio", href: "/studio" },
    { label: "Boarding" },
  ],
  "/studio/careers": [{ label: "Studio", href: "/studio" }, { label: "Careers" }],
  "/studio/contact": [
    { label: "Studio", href: "/studio" },
    { label: "Contact" },
  ],
  "/studio/student-support": [
    { label: "Studio", href: "/studio" },
    { label: "Student Support" },
  ],
  "/studio/manage-courses": [
    { label: "Studio", href: "/studio" },
    { label: "Manage Courses" },
  ],
  "/studio/manage-courses/new": [
    { label: "Studio", href: "/studio" },
    { label: "Manage Courses", href: "/studio/manage-courses" },
    { label: "New Course" },
  ],
  "/studio/term-dates": [
    { label: "Studio", href: "/studio" },
    { label: "Term Dates" },
  ],
  "/studio/manage-venues": [
    { label: "Studio", href: "/studio" },
    { label: "Manage Venues" },
  ],
  "/studio/manage-venues/new": [
    { label: "Studio", href: "/studio" },
    { label: "Manage Venues", href: "/studio/manage-venues" },
    { label: "New Venue" },
  ],
  "/studio/manage-venues/content": [
    { label: "Studio", href: "/studio" },
    { label: "Manage Venues", href: "/studio/manage-venues" },
    { label: "Content" },
  ],
  "/studio/manage-venues/inquiries": [
    { label: "Studio", href: "/studio" },
    { label: "Manage Venues", href: "/studio/manage-venues" },
    { label: "Inquiries" },
  ],
  "/studio/venues-content": [
    { label: "Studio", href: "/studio" },
    { label: "Venues" },
  ],
  "/studio/venues-content/content": [
    { label: "Studio", href: "/studio" },
    { label: "Venues" },
  ],
  "/studio/nav-hub/participant-info": [
    { label: "Studio", href: "/studio" },
    { label: "Participant Info — hub page" },
  ],
  "/studio/nav-hub/om-skolan": [
    { label: "Studio", href: "/studio" },
    { label: "About — hub page" },
  ],
  "/studio/nav-hub/skolan": [
    { label: "Studio", href: "/studio" },
    { label: "About — hub page" },
  ],
  "/studio/about-redirect": [
    { label: "Studio", href: "/studio" },
    { label: "About redirect" },
  ],
  "/studio/profiles": [
    { label: "Studio", href: "/studio" },
    { label: "Profiles" },
  ],
  "/studio/profiles/new": [
    { label: "Studio", href: "/studio" },
    { label: "Profiles", href: "/studio/profiles" },
    { label: "New Profile" },
  ],
  "/studio/summer-courses": [
    { label: "Studio", href: "/studio" },
    { label: "Summer Courses" },
  ],
  "/studio/student-rights": [
    { label: "Studio", href: "/studio" },
    { label: "Student Rights" },
  ],
  "/studio/study-guidance": [
    { label: "Studio", href: "/studio" },
    { label: "Study Guidance" },
  ],
};

function buildPortalCrumbs(pathname: string): Crumb[] | null {
  if (PORTAL_MAP[pathname]) return PORTAL_MAP[pathname];

  if (
    pathname.startsWith("/restaurant-admin/menus/") &&
    pathname.endsWith("/edit")
  ) {
    return [
      { label: "Restaurant", href: "/restaurant-admin" },
      { label: "Weekly Menus", href: "/restaurant-admin/menus" },
      { label: "Edit" },
    ];
  }
  if (
    pathname.startsWith("/restaurant-admin/dishes/") &&
    pathname.endsWith("/edit")
  ) {
    return [
      { label: "Restaurant", href: "/restaurant-admin" },
      { label: "Dishes", href: "/restaurant-admin/dishes" },
      { label: "Edit" },
    ];
  }
  if (pathname.startsWith("/studio/manage-news/") && pathname.endsWith("/edit")) {
    return [
      { label: "Studio", href: "/studio" },
      { label: "News", href: "/studio/manage-news" },
      { label: "Edit" },
    ];
  }
  if (
    pathname.startsWith("/studio/manage-venues/") &&
    pathname.endsWith("/edit")
  ) {
    return [
      { label: "Studio", href: "/studio" },
      { label: "Manage Venues", href: "/studio/manage-venues" },
      { label: "Edit Venue" },
    ];
  }
  if (pathname.startsWith("/studio/profiles/") && pathname.endsWith("/edit")) {
    return [
      { label: "Studio", href: "/studio" },
      { label: "Profiles", href: "/studio/profiles" },
      { label: "Edit Profile" },
    ];
  }
  if (
    pathname.startsWith("/studio/manage-courses/") &&
    pathname.endsWith("/edit")
  ) {
    return [
      { label: "Studio", href: "/studio" },
      { label: "Manage Courses", href: "/studio/manage-courses" },
      { label: "Edit" },
    ];
  }
  if (
    pathname.startsWith("/studio/summer-courses/") &&
    pathname.endsWith("/edit")
  ) {
    return [
      { label: "Studio", href: "/studio" },
      { label: "Summer Courses", href: "/studio/summer-courses" },
      { label: "Edit" },
    ];
  }
  return null;
}

// ─── Public breadcrumbs via the radial nav tree ──────────────────────────────

function formatSlug(slug: string): string {
  return (
    slug.replace(/-/g, " ").charAt(0).toUpperCase() +
    slug.replace(/-/g, " ").slice(1)
  );
}

function tartaToCrumbs(nodes: RadialNavNode[], pathname: string): Crumb[] {
  const lastNode = nodes[nodes.length - 1];
  const lastUrl = lastNode.href ?? lastNode.overviewHref;
  const isExact = lastUrl === pathname;

  const crumbs: Crumb[] = nodes.map((node, i) => {
    const isLast = i === nodes.length - 1;
    const label = node.label.replace(/­/g, "");
    if (isLast && isExact) return { label };
    const href = node.overviewHref ?? node.href;
    return { label, href };
  });

  if (!isExact) {
    // Prefix match: append a slug crumb for the current sub-page
    const slug = pathname.split("/").filter(Boolean).pop() ?? "";
    crumbs.push({ label: formatSlug(slug) });
  }

  return crumbs;
}

function buildPublicCrumbs(pathname: string): Crumb[] | null {
  // Try radial nav tree first — gives us the full hierarchy automatically
  const tartaNodes = findBreadcrumbsFromUrl(SCHOOL_NAV_TREE, pathname);
  if (tartaNodes.length) return tartaToCrumbs(tartaNodes, pathname);

  // Venue detail page
  if (pathname.startsWith("/venues/") && pathname.split("/").length === 3) {
    const slug = pathname.split("/")[2];
    return [
      { label: "About", href: "/about" },
      { label: "Venues", href: "/venues" },
      { label: formatSlug(slug ?? "") },
    ];
  }

  // Dynamic routes not in radial nav tree
  if (pathname.startsWith("/summer-courses/course/")) {
    const slug = pathname.split("/")[3];
    return [
      { label: "Short Courses", href: "/short-courses" },
      { label: "Summer Courses", href: "/summer-courses" },
      { label: formatSlug(slug) },
    ];
  }
  if (pathname.startsWith("/summer-courses/")) {
    const slug = pathname.split("/")[2];
    return [
      { label: "Short Courses", href: "/short-courses" },
      { label: "Summer Courses", href: "/summer-courses" },
      { label: formatSlug(slug) },
    ];
  }
  if (pathname.startsWith("/evening-courses/course/")) {
    const slug = pathname.split("/")[3];
    return [
      { label: "Short Courses", href: "/short-courses" },
      { label: "Evening Courses", href: "/evening-courses" },
      { label: formatSlug(slug) },
    ];
  }
  if (pathname.startsWith("/evening-courses/")) {
    const slug = pathname.split("/")[2];
    return [
      { label: "Short Courses", href: "/short-courses" },
      { label: "Evening Courses", href: "/evening-courses" },
      { label: formatSlug(slug) },
    ];
  }

  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function buildCrumbs(pathname: string): Crumb[] | null {
  if (EXCLUDED.includes(pathname)) return null;
  if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  if (PORTAL_PREFIXES.some((p) => pathname.startsWith(p))) {
    return buildPortalCrumbs(pathname);
  }

  const crumbs = buildPublicCrumbs(pathname);
  if (!crumbs) return null;
  return [{ label: "Home", href: "/" }, ...crumbs];
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);
  if (!crumbs) return null;

  return (
    <nav
      aria-label="Breadcrumbs"
      className="print:hidden sticky top-16 z-40 border-b border-gray-100 bg-transparent backdrop-blur-sm"
    >
      <ol className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-1.5 whitespace-nowrap">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              {isLast || !crumb.href ? (
                <span className="uppercase tracking-wide">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="uppercase tracking-wide text-gray-600 hover:text-gray-700 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
