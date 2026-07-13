import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStudioAccess } from "@/lib/auth/guards";
import { getDb } from "@/lib/db/client";
import { associationContent } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const DEFAULT_SECTIONS = JSON.stringify([
  {
    id: "section-intro",
    heading: "",
    body: "<p>Demo Folk High School is set in a beautiful park area, centrally located close to shops, sea, and forest. Around 200 participants study with us.</p><p>Our vision is: <em>Folk education for the future – encounters and opportunities together.</em></p><p>We take a holistic view of the individual and the world, and we are a health-promoting school that works deliberately with the links between health, wellbeing, and academic results.</p><p>Attending a folk high school is a chance to start over, pursue dreams, discover new possibilities, recognize your strengths, and grow as a person at your own pace. You choose courses based on your interests and needs, and you'll meet many stimulating and diverse people. The school has 50 boarding places for those who want to live on campus.</p><p>The educational model is built on democratic principles, where participants help shape the course content and working methods. Collaboration is an important pedagogical element. The school works thematically and across subjects with problem-based learning and current events to strengthen participants' ability to navigate and shape the future. Dialogue, encounters, and new challenges are central to every learning situation.</p>",
  },
  {
    id: "section-forening",
    heading: "The Association",
    body: "<p>The Association is the principal organizer of Demo Folk High School and is a non-partisan, non-religious nonprofit association. Both individuals and organizations can be members. The Association operates, organizes, and carries out folk high school activities in accordance with the regulations governing state funding for folk education.</p><p>The Board is elected by the Annual General Meeting, which is the Association's highest decision-making body and is held every year in May. At the meeting, members can help influence the school's direction.</p>",
  },
  {
    id: "section-bli-medlem",
    heading: "Become a Member",
    body: "<p>Membership in the Association means, among other things, that you can attend the Annual General Meeting in May each year and help influence the school's direction. As a member, you also get:</p><ul><li>Reduced price at the lunch restaurant</li><li>The option to buy a 10-lunch card at the external guest price; after two annual visits, your first lunch is on us</li><li>A 10% discount when booking the school's facilities for meetings, sports activities, etc.</li></ul><p>Membership fee 2025: SEK 175. Bankgiro: 000-0000. Swish: 123 456 7890. Please include your email address with payment.</p>",
  },
]);

const DEFAULT: Omit<typeof associationContent.$inferInsert, "id" | "updatedAt"> = {
  sections: DEFAULT_SECTIONS,
  heading: "",
  headingVisible: true,
  headingColor: null,
  mapHeading: "The school's buildings",
  buildings:
    "<h3>1. Main House</h3><ul><li>Reception</li><li>Dining halls</li><li>Gymnasium</li><li>Gym</li><li>Computer room</li><li>Boarding rooms</li><li>Laundry room</li></ul><h3>2. Workshop House</h3><ul><li>Ceramics workshop</li><li>Boarding rooms</li><li>Classrooms</li></ul><h3>3. Library House</h3><ul><li>Meeting rooms</li><li>Study and career guidance</li></ul><h3>4. North House</h3><ul><li>Classrooms</li></ul><h3>5. Studio House</h3><ul><li>Studios</li></ul><h3>6. East House</h3><ul><li>Boarding rooms</li></ul><h3>7. Caretaker's House</h3><h3>8. Log Cabin</h3><h3>9. Parking</h3>",
  boardHeading: "The Board",
  boardIntro:
    "The Board consists of seven members representing various municipalities in northwestern Skåne, with broad expertise in social and educational matters.",
  blocks: "[]",
};

function migrateFromSections(sectionsJson: string): string {
  try {
    const secs = JSON.parse(sectionsJson ?? "[]") as { id: string; heading: string; body: string }[];
    if (!secs.length) return "[]";
    return JSON.stringify(secs.map((s) => ({
      id: s.id, type: "section" as const, heading: s.heading, headingVisible: !!s.heading, body: s.body,
    })));
  } catch { return "[]"; }
}

export async function GET() {
  try {
    const db = getDb();
    const [row] = await db.select().from(associationContent).where(eq(associationContent.id, "main")).limit(1);
    const data = row ?? { ...DEFAULT };
    const rawBlocks = data.blocks ?? "[]";
    const hasBlocks = (() => { try { return (JSON.parse(rawBlocks) as unknown[]).length > 0; } catch { return false; } })();
    const blocks = hasBlocks ? rawBlocks : migrateFromSections(data.sections ?? "[]");
    return NextResponse.json({ ...(row ?? { id: "main", ...DEFAULT }), blocks });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  try {
    const access = await requireStudioAccess(req);
    if (access.response) return access.response;

    const body = await req.json() as Partial<Omit<typeof associationContent.$inferInsert, "id" | "updatedAt">>;
    const db = getDb();
    const now = new Date();

    const [existing] = await db.select().from(associationContent).where(eq(associationContent.id, "main")).limit(1);

    if (existing) {
      const [updated] = await db
        .update(associationContent)
        .set({ ...body, updatedAt: now })
        .where(eq(associationContent.id, "main"))
        .returning();
      revalidatePath("/about-redirect");
      return NextResponse.json(updated);
    } else {
      const [created] = await db
        .insert(associationContent)
        .values({ id: "main", ...DEFAULT, ...body, updatedAt: now })
        .returning();
      revalidatePath("/about-redirect");
      return NextResponse.json(created);
    }
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
