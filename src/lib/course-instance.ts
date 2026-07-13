// Shared helpers for course instances. The registration code is NOT stored as free text —
// it is always generated from the structured fields (year/periodType/week) so that
// instances can be filtered with real WHERE conditions and the code stays consistent.

export type PeriodType = "spring" | "fall" | "full_year" | "summer";

export const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  spring: "Spring term",
  fall: "Fall term",
  full_year: "Academic year",
  summer: "Summer",
};

export interface RegistrationPeriod {
  year: number;
  periodType: PeriodType;
  week: number | null;
}

const SUFFIX: Record<Exclude<PeriodType, "full_year">, string> = {
  spring: "VT",
  fall: "HT",
  summer: "ST",
};

/** Generates the registration code for display, e.g. "AK 26 VT", "AK 26/27", "AK 26 ST, v29". */
export function formatRegistrationCode({ year, periodType, week }: RegistrationPeriod): string {
  const yy = String(year).slice(-2).padStart(2, "0");
  if (periodType === "full_year") {
    const next = String((year + 1) % 100).padStart(2, "0");
    return `AK ${yy}/${next}`;
  }
  return `AK ${yy} ${SUFFIX[periodType]}${week ? `, v${week}` : ""}`;
}

/** Readable period description, e.g. "Spring term 2026", "Academic year 2026/27", "Summer 2026, week 29". */
export function formatPeriodLabel({ year, periodType, week }: RegistrationPeriod): string {
  if (periodType === "full_year") {
    return `Academic year ${year}/${String((year + 1) % 100).padStart(2, "0")}`;
  }
  const base = `${PERIOD_TYPE_LABELS[periodType]} ${year}`;
  return week ? `${base}, week ${week}` : base;
}

/** Builds a URL-safe slug for /apply/[code] from the course slug + generated code. */
export function buildInstanceSlug(kursSlug: string, period: RegistrationPeriod): string {
  const code = formatRegistrationCode(period)
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${kursSlug}-${code}`;
}
