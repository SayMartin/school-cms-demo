"use client";

import { useState } from "react";

type Props = {
  summary: string;
  summaryColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function AccordionBlock({ summary, summaryColor, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border bg-gray-100 border-gray-300">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer select-none items-center justify-between gap-4 bg-brand-green-light px-5 py-4 text-base font-semibold text-gray-900 transition-colors hover:bg-brand-green/40"
        style={summaryColor ? { color: summaryColor } : undefined}
      >
        {summary || "Visa mer"}
        <svg
          className={`h-5 w-5 shrink-0 text-brand-green-dark transition-transform duration-300 ease-in-out ${open ? "rotate-90" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="px-5 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
