"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MiniRadialNav,
  findBreadcrumbsFromUrl,
} from "@/components/RadialNav";
import { SCHOOL_NAV_TREE } from "@/components/RadialNav.example";

const educationProgramsHrefs = ["/education-programs", "/distance-education/"];

const shortCoursesHrefs = [
  "/short-courses",
  "/evening-courses",
  "/mental-health-first-aid",
  "/study-motivation-course",
];

const summerCoursesHrefs = ["/summer-courses"];

const aboutHrefs = [
  "/about",
  "/about-redirect",
  "/participant-info",
  "/about/association",
  "/about/apply",
  "/about/history",
  "/about/careers",
  "/about/study-guidance",
  "/about/student-support",
  "/about/student-rights",
  "/about/term-dates",
  "/about/report-issue",
];

const mainLinks = [
  { href: "/restaurant", label: "Restaurant" },
  { href: "/venues", label: "Venues" },
  { href: "/boarding", label: "Boarding" },
  { href: "/contact", label: "Contact" },
];

function matchesAny(pathname: string, hrefs: string[]) {
  return hrefs.some((h) =>
    h.endsWith("/")
      ? pathname.startsWith(h)
      : pathname === h || pathname.startsWith(h + "/"),
  );
}


interface NavProps {
  tartaOpen?: boolean;
  onTartaToggle?: () => void;
}

export function Nav({ tartaOpen, onTartaToggle }: NavProps = {}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isEducationProgramsActive = matchesAny(pathname, educationProgramsHrefs);
  const isShortCoursesActive = matchesAny(pathname, shortCoursesHrefs);
  const isSummerCoursesActive = matchesAny(pathname, summerCoursesHrefs);
  const isAboutActive = matchesAny(pathname, aboutHrefs);

  const breadcrumbNodeIds = new Set(
    findBreadcrumbsFromUrl(SCHOOL_NAV_TREE, pathname).map((n) => n.id),
  );
  const isMobileActive = (id: string, href: string) =>
    breadcrumbNodeIds.has(id) || matchesAny(pathname, [href]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const linkCls = (active: boolean) =>
    `rounded-md px-3 py-2 text-sm font-medium not-italic transition-colors ${
      active
        ? "bg-white/50 text-brand-green-dark"
        : "text-gray-700 hover:bg-white/40 hover:text-gray-900"
    }`;


  return (
    <header
      className={`print:hidden sticky top-0 z-50 bg-linear-to-b from-brand-green to-brand-green-light transition-shadow duration-200 ${
        scrolled ? "shadow-md" : "border-b border-brand-green-dark/20"
      }`}
    >
      <div className="mx-auto flex min-h-16 max-w-8xl items-center justify-between px-4 md:px-12 py-0">
        {/* ── Logo ── */}
        <Link href="/" className="group flex flex-col shrink-0">
          <span className="text-base font-black tracking-[0.22em] text-gray-900 uppercase leading-none">
            Demo Folk High School
          </span>
          {/* <span className="text-[11px] font-bold tracking-[0.18em] text-gray-900 uppercase leading-tight mt-0.5">Folkhögskola</span> */}
          <span className="text-[12px] md:text-[15px] text-gray-60 leading-snug mt-1">
            Popular education for the future –<br className="md:hidden" /> connections
            and opportunities together
          </span>
        </Link>

        {/* ── Desktop nav: text links when no RadialNav, mini-radial-nav when RadialNav active ── */}
        {onTartaToggle ? (
          <div className="hidden md:block">
            <MiniRadialNav
              nodes={SCHOOL_NAV_TREE}
              activeId={null}
              isOpen={tartaOpen ?? false}
              onClick={onTartaToggle}
              size={64}
            />
          </div>
        ) : (
          <nav className="hidden md:flex items-center gap-0.5 not-italic">
            <Link
              href="/education-programs"
              className={linkCls(isEducationProgramsActive)}
            >
              Education Programs
            </Link>
            <Link href="/short-courses" className={linkCls(isShortCoursesActive)}>
              Short Courses
            </Link>
            <Link href="/summer-courses" className={linkCls(isSummerCoursesActive)}>
              Summer Courses
            </Link>
            <Link href="/about" className={linkCls(isAboutActive)}>
              About
            </Link>
            {mainLinks.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={linkCls(active)}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* ── Mobile radial-nav toggle ── */}
        <div className="md:hidden" aria-expanded={mobileOpen}>
          <MiniRadialNav
            nodes={SCHOOL_NAV_TREE}
            activeId={null}
            isOpen={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
            size={44}
          />
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <nav className="border-t border-brand-green-dark/20 bg-brand-green-light md:hidden">
          <div className="px-3 py-3 space-y-1">
            {SCHOOL_NAV_TREE.map((node) => {
              const href = node.overviewHref ?? node.href ?? null;
              const label = node.label.replace(/­/g, "");
              if (!href) return null;
              return (
                <Link
                  key={node.id}
                  href={href}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isMobileActive(node.id, href)
                      ? "bg-white/50 text-brand-green-dark"
                      : "text-gray-700 hover:bg-white/40"
                  }`}
                  onClick={closeMobile}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
