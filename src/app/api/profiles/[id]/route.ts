import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb, type Db } from "@/lib/db/client";
import { profile, department, profileDepartment } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function getProfileWithDepts(db: Db, id: string) {
  const [p] = await db.select().from(profile).where(eq(profile.id, id)).limit(1);
  if (!p) return null;

  const depts = await db
    .select({
      departmentId: profileDepartment.departmentId,
      departmentName: department.name,
      title: profileDepartment.title,
      sortOrder: profileDepartment.sortOrder,
    })
    .from(profileDepartment)
    .innerJoin(department, eq(profileDepartment.departmentId, department.id))
    .where(eq(profileDepartment.profileId, id))
    .orderBy(asc(profileDepartment.sortOrder));

  return {
    ...p,
    departments: depts.map((d) => ({
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      titles: JSON.parse(d.title) as string[],
      sortOrder: d.sortOrder,
    })),
  };
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const db = getDb();
    const result = await getProfileWithDepts(db, id);
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as {
      name?: string;
      phone?: string | null;
      directPhone?: string | null;
      email?: string | null;
      bio?: string | null;
      imageKey?: string | null;
      sortOrder?: number;
      published?: boolean;
      userId?: string | null;
      departments?: { departmentId: string; titles: string[]; sortOrder?: number }[];
    };

    const db = getDb();
    const patch: Partial<typeof profile.$inferInsert> = { updatedAt: new Date() };
    if (body.name !== undefined) patch.name = body.name;
    if (body.phone !== undefined) patch.phone = body.phone;
    if (body.directPhone !== undefined) patch.directPhone = body.directPhone;
    if (body.email !== undefined) patch.email = body.email;
    if (body.bio !== undefined) patch.bio = body.bio;
    if (body.imageKey !== undefined) patch.imageKey = body.imageKey;
    if (body.sortOrder !== undefined) patch.sortOrder = body.sortOrder;
    if (body.published !== undefined) patch.published = body.published;
    if (body.userId !== undefined) patch.userId = body.userId;

    const deptStatements = body.departments !== undefined
      ? [
          db.delete(profileDepartment).where(eq(profileDepartment.profileId, id)),
          ...body.departments.map((dept) =>
            db.insert(profileDepartment).values({
              profileId: id,
              departmentId: dept.departmentId,
              title: JSON.stringify(dept.titles),
              sortOrder: dept.sortOrder ?? 0,
            })
          ),
        ]
      : [];

    await db.batch([
      db.update(profile).set(patch).where(eq(profile.id, id)),
      ...deptStatements,
    ] as Parameters<typeof db.batch>[0]);

    const result = await getProfileWithDepts(db, id);
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const db = getDb();
    await db.delete(profile).where(eq(profile.id, id));
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
