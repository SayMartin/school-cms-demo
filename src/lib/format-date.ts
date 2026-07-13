const SHORT = { timeZone: "Europe/Stockholm", day: "numeric", month: "short" } as const;
const LONG  = { timeZone: "Europe/Stockholm", year: "numeric", month: "long", day: "numeric" } as const;

export function fmtDate(d: Date | null, fmt: "short" | "long" = "short"): string {
  if (!d) return "unspecified";
  return d.toLocaleDateString("en-GB", fmt === "short" ? SHORT : LONG);
}

/** "Date: startStr – endStr", always shown, "unspecified" when null */
export function fmtDateRange(start: Date | null, end: Date | null, fmt: "short" | "long" = "short"): string {
  return `Date: ${fmtDate(start, fmt)} – ${fmtDate(end, fmt)}`;
}
