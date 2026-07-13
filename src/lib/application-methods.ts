export type ApplicationMethod =
  | { type: "form"; label?: string; note?: string }
  | { type: "url"; url: string; label: string; note?: string }
  | { type: "email"; email: string; subject?: string; label?: string; note?: string }
  | { type: "schoolsoft"; url: string; label?: string; note?: string }
  | { type: "physical"; info: string; note?: string };

export type ApplicationConfig = {
  open: boolean;
  mode: "any" | "sequence";
  methods: ApplicationMethod[];
};

export const EMPTY_CONFIG: ApplicationConfig = { open: false, mode: "any", methods: [] };

const SCHOOLSOFT_BASE =
  "https://sms.schoolsoft.se/fhsk/react/#/login/applicant?application_education_id=";

export function buildSchoolSoftUrl(schoolsoftId: string | null | undefined): string {
  return schoolsoftId ? `${SCHOOLSOFT_BASE}${schoolsoftId}` : "";
}

export function parseApplicationConfig(json: string): ApplicationConfig {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      "mode" in parsed &&
      "methods" in parsed &&
      Array.isArray((parsed as ApplicationConfig).methods)
    ) {
      const p = parsed as Record<string, unknown>;
      const methods = (parsed as ApplicationConfig).methods;
      return {
        open: typeof p.open === "boolean" ? p.open : methods.length > 0,
        mode: (parsed as ApplicationConfig).mode,
        methods,
      };
    }
  } catch { /* invalid JSON */ }
  return EMPTY_CONFIG;
}
