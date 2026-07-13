import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db/client";
import { courseInstance, course } from "@/lib/db/schema";
import {
  formatPeriodLabel,
  formatRegistrationCode,
  type PeriodType,
} from "@/lib/course-instance";
import { parseApplicationConfig, type ApplicationMethod } from "@/lib/application-methods";
import { ApplicationForm, type ExtraField } from "./application-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Application" };

export default async function AnsokPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const db = getDb();
  const [instance] = await db
    .select({
      id: courseInstance.id,
      year: courseInstance.year,
      periodType: courseInstance.periodType,
      week: courseInstance.week,
      applicationMethods: courseInstance.applicationMethods,
      extraFields: courseInstance.extraFields,
      courseTitle: course.title,
    })
    .from(courseInstance)
    .innerJoin(course, eq(courseInstance.courseId, course.id))
    .where(eq(courseInstance.slug, code));

  if (!instance) notFound();

  const period = {
    year: instance.year,
    periodType: instance.periodType as PeriodType,
    week: instance.week,
  };
  const registrationCode = formatRegistrationCode(period);

  const config = parseApplicationConfig(instance.applicationMethods);
  const hasForm = config.open && config.methods.some((m) => m.type === "form");

  // If sequential mode: find the first method after "form" as the next step
  const nextStep: ApplicationMethod | null = config.mode === "sequence"
    ? (() => {
        const formIdx = config.methods.findIndex((m) => m.type === "form");
        return formIdx >= 0 && formIdx + 1 < config.methods.length
          ? config.methods[formIdx + 1]
          : null;
      })()
    : null;

  let extraFields: ExtraField[] = [];
  try {
    extraFields = JSON.parse(instance.extraFields) as ExtraField[];
  } catch {
    /* empty/invalid JSON → no extra fields */
  }

  let siteKey = "";
  try {
    siteKey = getCloudflareContext().env.TURNSTILE_SITE_KEY ?? "";
  } catch {
    /* next dev doesn't run the Cloudflare runtime */
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-center text-3xl font-semibold text-gray-900">
        Apply to {instance.courseTitle}
      </h1>
      <p className="mt-2 text-center text-sm text-gray-600">
        {registrationCode} · {formatPeriodLabel(period)}
      </p>

      {hasForm ? (
        <div className="mt-8">
          <ApplicationForm
            instanceId={instance.id}
            extraFields={extraFields}
            siteKey={siteKey}
            nextStep={nextStep}
          />
        </div>
      ) : (
        <p className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-6 text-center text-amber-800">
          Applications for this course are handled differently. See the course page for information.
        </p>
      )}
    </main>
  );
}
