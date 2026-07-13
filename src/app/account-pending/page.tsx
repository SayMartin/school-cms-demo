import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import Link from "next/link";
import { Info } from "lucide-react";
import { AuthBrand } from "@/components/auth-brand";
import { getDb } from "@/lib/db/client";
import { session, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const MESSAGES = {
  pending: {
    title: "Application received",
    body: "Your account application has been received and is being reviewed by an administrator. We'll email you once it's been processed.",
  },
  rejected: {
    title: "Application declined",
    body: "Unfortunately, your account application has been declined. Contact the school if you have any questions.",
  },
  archived: {
    title: "Account inactive",
    body: "Your account is currently deactivated. Contact the school if you have any questions.",
  },
} as const;

export default async function KontoVantarPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  let status = reason && reason in MESSAGES ? reason : "pending";

  // Only query the DB if no reason was passed via URL (e.g. direct navigation)
  if (!reason) {
    try {
      const cookieStore = await cookies();
      const raw =
        cookieStore.get("better-auth.session_token")?.value ??
        cookieStore.get("__Secure-better-auth.session_token")?.value ??
        "";
      const token = raw.split(".")[0];

      if (token) {
        const db = getDb();
        const [row] = await db
          .select({ status: user.status })
          .from(session)
          .innerJoin(user, eq(session.userId, user.id))
          .where(and(eq(session.token, token), gt(session.expiresAt, new Date())))
          .limit(1);
        if (row) status = row.status;
      }
    } catch {
      /* no Cloudflare context in dev — default to "pending" */
    }
  }

  const msg = MESSAGES[status as keyof typeof MESSAGES] ?? MESSAGES.pending;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          <AuthBrand />
        </div>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-green-light">
          <Info className="h-7 w-7 text-brand-green-dark" strokeWidth={2} />
        </div>
        <h1>{msg.title}</h1>
        <p className="mt-3 text-sm text-gray-600">{msg.body}</p>
        <Link
          href="/sign-in"
          className="mt-6 inline-block text-sm font-medium text-brand-green-dark underline underline-offset-2 hover:text-gray-900"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
