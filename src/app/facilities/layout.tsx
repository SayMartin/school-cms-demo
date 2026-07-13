import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAuth } from "@/lib/auth/auth";
import { getDb } from "@/lib/db/client";
import { hasFacilitiesAccess } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function FastighetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const db = getDb();
  const auth = createAuth(db);
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !hasFacilitiesAccess(session.user.role)) {
    redirect("/");
  }

  return <>{children}</>;
}
