import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb, type Db } from "@/lib/db/client";
import { profile, department, profileDepartment } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

async function listProfilesWithDepts(db: Db) {
  const profiles = await db.select().from(profile).orderBy(asc(profile.sortOrder));

  const deptRows = await db
    .select({
      profileId: profileDepartment.profileId,
      departmentId: profileDepartment.departmentId,
      departmentName: department.name,
      title: profileDepartment.title,
      sortOrder: profileDepartment.sortOrder,
    })
    .from(profileDepartment)
    .innerJoin(department, eq(profileDepartment.departmentId, department.id));

  const deptsByProfile = new Map<string, typeof deptRows>();
  for (const row of deptRows) {
    if (!deptsByProfile.has(row.profileId)) deptsByProfile.set(row.profileId, []);
    deptsByProfile.get(row.profileId)!.push(row);
  }

  return profiles.map((p) => ({
    ...p,
    departments: (deptsByProfile.get(p.id) ?? []).map((d) => ({
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      titles: JSON.parse(d.title) as string[],
      sortOrder: d.sortOrder,
    })),
  }));
}

export async function GET() {
  try {
    const db = getDb();
    return NextResponse.json(await listProfilesWithDepts(db));
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as {
      name: string;
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
    const now = new Date();
    const id = crypto.randomUUID();

    const depts = body.departments ?? [];
    await db.batch([
      db.insert(profile).values({
        id,
        name: body.name,
        phone: body.phone ?? null,
        directPhone: body.directPhone ?? null,
        email: body.email ?? null,
        bio: body.bio ?? null,
        imageKey: body.imageKey ?? null,
        sortOrder: body.sortOrder ?? 0,
        published: body.published ?? false,
        userId: body.userId ?? null,
        createdAt: now,
        updatedAt: now,
      }),
      ...depts.map((dept) =>
        db.insert(profileDepartment).values({
          profileId: id,
          departmentId: dept.departmentId,
          title: JSON.stringify(dept.titles),
          sortOrder: dept.sortOrder ?? 0,
        })
      ),
    ] as Parameters<typeof db.batch>[0]);

    const [created] = await db.select().from(profile).where(eq(profile.id, id));
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[POST /api/profiles]", err);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
