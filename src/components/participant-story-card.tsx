"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { RichTextContent } from "@/components/rich-text-content";
import { mediaUrl } from "@/lib/r2/client";

type Props = {
  name: string;
  graduationYear: number | null;
  courseName: string | null;
  imageKey: string | null;
  story: string;
  /** Clip the card to a standard height/width with a "See more…" button. Default: show in full. */
  collapsible?: boolean;
};

/** Collapsed standard height in px — the card is clipped to this height until "See more…" is pressed. */
const STANDARD_HEIGHT = 448;

export function ParticipantStoryCard({
  name,
  graduationYear,
  courseName,
  imageKey,
  story,
  collapsible = false,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!collapsible) return;
    const el = contentRef.current;
    if (!el) return;

    const measure = () => {
      setFullHeight(el.scrollHeight);
      setOverflowing(el.scrollHeight > STANDARD_HEIGHT + 8);
    };

    measure();
    // Re-measure when images load or the window resizes (line breaks may change).
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [story, collapsible]);

  const clamped = collapsible && !expanded;

  return (
    <div
      className={`border border-gray-200 bg-white/60 shadow-sm p-6 ${
        collapsible ? "w-full max-w-4xl" : "overflow-hidden"
      }`}
    >
      <div
        ref={contentRef}
        style={
          collapsible
            ? { maxHeight: expanded ? fullHeight : STANDARD_HEIGHT }
            : undefined
        }
        className={`relative ${
          collapsible
            ? "overflow-hidden transition-[max-height] duration-500 ease-in-out"
            : ""
        }`}
      >
        <div className="w-full max-w-48 mx-auto overflow-hidden bg-brand-pink flex items-center justify-center md:float-left md:mr-8 md:w-1/3 md:max-w-none md:mx-0">
          {imageKey ? (
            <Image
              src={mediaUrl(imageKey)}
              alt={name}
              width={0}
              height={0}
              sizes="(min-width: 768px) 33vw, 12rem"
              className="w-full h-auto object-cover object-top"
              unoptimized
            />
          ) : (
            <div className="w-full flex items-center justify-center">
              <span className="text-4xl font-bold text-gray-700">
                {initials}
              </span>
            </div>
          )}
        </div>

        <h3>{name}</h3>
        <p className="font-semibold">
          {[courseName, graduationYear].filter(Boolean).join(" · ")}
        </p>
        <RichTextContent html={story} />

        <div className="clear-both" />

        {/* Fade hint at the bottom when the card is collapsed and has more text */}
        {clamped && overflowing && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-white/90 to-transparent" />
        )}
      </div>

      {collapsible && overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 font-semibold text-brand-green-dark underline underline-offset-2 hover:text-gray-700 transition-colors"
        >
          {expanded ? "Show less" : "See more…"}
        </button>
      )}
    </div>
  );
}
