"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { mediaUrl } from "@/lib/r2/client";
import type { SlideshowBlock } from "@/lib/blocks";

function imgSrc(key: string): string {
  return key.startsWith("/") ? key : mediaUrl(key);
}

type LightboxProps = {
  images: SlideshowBlock["images"];
  startIndex: number;
  heading: string;
  onClose: () => void;
};

// Simple lightbox implementation for slideshow images. Supports keyboard navigation and prevents body scroll while open.
function Lightbox({ images, startIndex, heading, onClose }: LightboxProps) {
  const [idx, setIdx] = useState(startIndex);
  const hasMultiple = images.length > 1;
  const current = images[idx]!;

  const prev = useCallback(
    () => setIdx((i) => (i - 1 + images.length) % images.length),
    [images.length],
  );
  const next = useCallback(
    () => setIdx((i) => (i + 1) % images.length),
    [images.length],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasMultiple) prev();
      if (e.key === "ArrowRight" && hasMultiple) next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasMultiple, prev, next, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="relative flex items-center justify-center p-4 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-5">
          {heading && <h3 className="text-white">{heading}</h3>}
          {hasMultiple && (
            <h3 className="text-white">
              {idx + 1} / {images.length}
            </h3>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 rounded-full p-1.5 text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Image area */}
      <div
        className="relative flex-1 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full">
          <Image
            src={imgSrc(current.src)}
            alt={current.alt}
            fill
            className="object-contain"
            unoptimized
            priority
          />
        </div>

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              aria-label="Previous image"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              aria-label="Next image"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Caption */}
      {current.alt && (
        <div
          className="shrink-0 px-4 py-3 text-center text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {current.alt}
        </div>
      )}
    </div>,
    document.body
  );
}

type Props = {
  block: SlideshowBlock;
};

export function Slideshow({ block }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { images, heading, headingVisible } = block;
  if (images.length === 0) return null;

  const first = images[0]!;
  const hasMultiple = images.length > 1;

  return (
    <>
      {headingVisible && heading && (
        <h2 className="mb-4 text-center" style={{ color: block.headingColor ?? "#111827" }}>{heading}</h2>
      )}

      <figure className="relative max-w-3xl mx-auto">
        <button
          type="button"
          className="group relative block w-full overflow-hidden cursor-zoom-in"
          onClick={() => setLightboxIndex(0)}
          aria-label="Open slideshow"
        >
          <Image
            src={imgSrc(first.src)}
            alt={first.alt}
            width={1200}
            height={800}
            className="w-full h-auto max-h-108 object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            unoptimized
          />
          {hasMultiple && (
            <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-white backdrop-blur-sm">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
              See more images ({images.length})
            </span>
          )}
        </button>
        {first.alt && <figcaption className="mt-1">{first.alt}</figcaption>}
      </figure>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          startIndex={lightboxIndex}
          heading={heading}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
