"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { TimelineEntry } from "@/lib/historia-timeline";
import { RichTextContent } from "@/components/rich-text-content";
import { Slideshow } from "@/components/slideshow";
import type { SlideshowBlock } from "@/lib/blocks";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const ITEMS_VISIBLE = 11;
const FAST_JUMP = 5;

function toSlideshowBlock(entry: TimelineEntry): SlideshowBlock {
  return {
    type: "slideshow",
    id: entry.id,
    heading: "",
    headingVisible: false,
    images: entry.images,
  };
}

type Props = {
  entries: TimelineEntry[];
  heading?: string;
  headingVisible?: boolean;
  headingColor?: string;
};

export function HistoriaTimeline({ entries, heading, headingVisible, headingColor }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeIdxRef = useRef(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const zone1Ref = useRef<HTMLDivElement>(null);
  // sectionRef → inner max-w-7xl container (used for all measurements)
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const leftPadRef = useRef<HTMLDivElement>(null);
  const rightPadRef = useRef<HTMLDivElement>(null);
  const snapItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const yearLabelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const arcPathRef = useRef<SVGPathElement>(null);
  const rafRef = useRef<number>(0);

  const visibleEntries = useMemo(
    () => entries.filter((e) => e.text || e.images.length > 0),
    [entries]
  );

  const runLayout = useCallback(() => {
    const scroll = scrollRef.current;
    const section = sectionRef.current;
    if (!scroll || !section) return;

    const cw = section.clientWidth;
    const ch = section.clientHeight;
    const itemW = cw / ITEMS_VISIBLE;
    const padW = cw / 2 - itemW / 2;
    const dotY = ch * 0.38;
    const scrollLeft = scroll.scrollLeft;

    // Update scroll content widths
    const totalW = 2 * padW + visibleEntries.length * itemW;
    if (scrollContentRef.current) scrollContentRef.current.style.width = `${totalW}px`;
    if (leftPadRef.current) leftPadRef.current.style.width = `${padW}px`;
    if (rightPadRef.current) rightPadRef.current.style.width = `${padW}px`;
    snapItemRefs.current.forEach((el) => { if (el) el.style.width = `${itemW}px`; });

    // Green line through dot centres
    if (arcPathRef.current) {
      arcPathRef.current.setAttribute("d", `M 0 ${dotY + 8} L ${cw} ${dotY + 8}`);
    }

    let newActiveIdx = activeIdxRef.current;

    visibleEntries.forEach((_entry, i) => {
      const dot = dotRefs.current[i];
      const label = yearLabelRefs.current[i];
      const distNorm = (i * itemW - scrollLeft) / itemW;

      if (dot) {
        dot.style.transform = `translateX(-50%) translateY(${dotY}px)`;
      }

      if (label) {
        const scale = Math.max(0, Math.pow(1 - Math.abs(distNorm) / (ITEMS_VISIBLE / 2), 3));
        label.style.fontSize = `${9 + scale * 15}px`;
      }

      if (Math.abs(distNorm) < 0.5) {
        newActiveIdx = i;
      }
    });

    if (newActiveIdx !== activeIdxRef.current) {
      activeIdxRef.current = newActiveIdx;
      setActiveIdx(newActiveIdx);
    }
  }, [visibleEntries]);

  const goToEntry = useCallback((idx: number) => {
    const scroll = scrollRef.current;
    const section = sectionRef.current;
    if (!scroll || !section) return;
    const clamped = Math.max(0, Math.min(visibleEntries.length - 1, idx));
    const itemW = section.clientWidth / ITEMS_VISIBLE;
    scroll.scrollTo({ left: clamped * itemW, behavior: "smooth" });
  }, [visibleEntries.length]);

  // Fill wrapper from its top edge to just above the footer
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const footer = document.querySelector("footer");
    function setHeight() {
      const top = wrapper!.getBoundingClientRect().top;
      const footerH = footer ? footer.clientHeight : 0;
      wrapper!.style.height = `${window.innerHeight - top - footerH}px`;
    }
    setHeight();
    const ro = footer ? new ResizeObserver(setHeight) : null;
    ro?.observe(footer!);
    window.addEventListener("resize", setHeight);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", setHeight);
    };
  }, []);

  // Scroll zone 1 back to top when active entry changes
  useEffect(() => {
    zone1Ref.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeIdx]);

  // Arrow-key navigation (desktop)
  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") { e.preventDefault(); goToEntry(activeIdxRef.current - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goToEntry(activeIdxRef.current + 1); }
      else if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToEntry]);

  // Block all wheel scroll in zone 2
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    function onWheel(e: WheelEvent) { e.preventDefault(); }
    section.addEventListener("wheel", onWheel, { passive: false });
    return () => section.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    function onScroll() {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(runLayout);
    }

    scroll.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(runLayout);
    });
    if (sectionRef.current) ro.observe(sectionRef.current);

    runLayout();

    return () => {
      scroll.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [runLayout]);

  const activeEntry = visibleEntries[activeIdx] ?? null;
  const hasSlideshow = (activeEntry?.images.length ?? 0) > 0;

  return (
    <>
      {/* Desktop layout */}
      <div ref={wrapperRef} className="hidden md:flex flex-col overflow-hidden">
        {headingVisible && heading && (
          <div className="mx-auto w-full max-w-7xl px-6 pt-10">
            <h1 className="mb-6 text-center" style={{ color: headingColor ?? "#111827" }}>
              {heading}
            </h1>
          </div>
        )}

        {/* Timeline — now above the description */}
        <div
          className="shrink-0 w-full overflow-hidden"
          style={{ height: "13vh" }}
        >
          {/* Inner timeline — constrained to max-w-7xl */}
          <div ref={sectionRef} className="relative mx-auto h-full max-w-7xl">
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
            >
              <path
                ref={arcPathRef}
                d=""
                fill="none"
                stroke="#4aad4a"
                strokeWidth="3"
              />
            </svg>

            <div
              ref={scrollRef}
              className="absolute inset-0 overflow-x-scroll"
              style={{
                scrollSnapType: "x mandatory",
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch",
              } as React.CSSProperties}
            >
              <div ref={scrollContentRef} className="relative flex h-full">
                <div ref={leftPadRef} style={{ flexShrink: 0 }} />

                {visibleEntries.map((entry, i) => (
                  <div
                    key={entry.id}
                    ref={(el) => { snapItemRefs.current[i] = el; }}
                    className="relative h-full shrink-0"
                    style={{ scrollSnapAlign: "center" }}
                  >
                    <div
                      ref={(el) => { dotRefs.current[i] = el; }}
                      className="absolute left-1/2 top-0 h-4 w-4 cursor-pointer"
                      style={{ transform: "translateX(-50%)" }}
                      onClick={() => goToEntry(i)}
                    >
                      {/* Year label above dot */}
                      <span
                        ref={(el) => { yearLabelRefs.current[i] = el; }}
                        className="absolute left-1/2 -translate-x-1/2 select-none whitespace-nowrap text-center font-semibold leading-none text-gray-600"
                        style={{ fontSize: "9px", transition: "font-size 60ms linear", bottom: "22px" }}
                      >
                        {entry.year}
                      </span>
                      <div className="h-4 w-4 rounded-full bg-brand-green-dark shadow-sm ring-2 ring-white" />
                    </div>
                  </div>
                ))}

                <div ref={rightPadRef} style={{ flexShrink: 0 }} />
              </div>
            </div>

            {/* Nav buttons — all 4 centered in middle third */}
            <div className="absolute inset-x-0 z-10 flex" style={{ top: "calc(38% + 34px)" }}>
              <div className="flex-1" />
              <div className="flex flex-1 items-center justify-around gap-2">
                <button
                  onClick={() => goToEntry(activeIdx - FAST_JUMP)}
                  disabled={activeIdx === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition-opacity"
                  aria-label="Jump back"
                >
                  <ChevronsLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => goToEntry(activeIdx - 1)}
                  disabled={activeIdx === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition-opacity"
                  aria-label="Previous event"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => goToEntry(activeIdx + 1)}
                  disabled={activeIdx === visibleEntries.length - 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition-opacity"
                  aria-label="Next event"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => goToEntry(activeIdx + FAST_JUMP)}
                  disabled={activeIdx === visibleEntries.length - 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition-opacity"
                  aria-label="Jump forward"
                >
                  <ChevronsRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1" />
            </div>
          </div>
        </div>

        {/* Description — scrollable zone, below the timeline */}
        <div ref={zone1Ref} className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
        <div className="mx-auto w-full max-w-7xl px-6 py-10 pb-16">
          {activeEntry && (
            <div
              key={activeEntry.id}
              className={`mx-auto ${hasSlideshow ? "flex max-w-7xl items-start gap-10" : "max-w-2xl"}`}
            >
              {activeEntry.text && (
                <div className={hasSlideshow ? "min-w-0 flex-1" : ""}>
                  <RichTextContent
                    html={activeEntry.text}
                    className="text-lg leading-relaxed text-gray-700"
                  />
                </div>
              )}
              {hasSlideshow && (
                <div className="w-2/5 shrink-0">
                  <Slideshow block={toSlideshowBlock(activeEntry)} />
                </div>
              )}
            </div>
          )}
        </div>
        </div>{/* end zone1 */}
      </div>

      {/* Mobile: vertical list */}
      <section className="md:hidden mx-auto max-w-2xl px-4 py-12">
        {headingVisible && heading && (
          <h1 className="mb-8 text-center" style={{ color: headingColor ?? "#111827" }}>
            {heading}
          </h1>
        )}
        <ul className="space-y-10">
          {entries
            .filter((e) => e.text)
            .map((entry) => {
              const entryHasSlideshow = entry.images.length > 0;
              return (
                <li key={entry.id}>
                  <p className="text-sm font-semibold text-brand-green-dark">{entry.year}</p>
                  <div className="mt-2">
                    <RichTextContent html={entry.text} className="text-gray-700" />
                    {entryHasSlideshow && (
                      <div className="mt-4">
                        <Slideshow block={toSlideshowBlock(entry)} />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
        </ul>
      </section>
    </>
  );
}
