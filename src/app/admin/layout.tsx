import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAuth } from "@/lib/auth/auth";
import { getDb } from "@/lib/db/client";
import { hasAdminAccess } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const db = getDb();
  const auth = createAuth(db);
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !hasAdminAccess(session.user.role)) {
    redirect("/");
  }

  return <>{children}</>;
}
