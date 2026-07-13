import type { Metadata } from "next";
import { asc, eq, notInArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { profile, department, profileDepartment, contactContent } from "@/lib/db/schema";
import { RichTextContent } from "@/components/rich-text-content";
import { AccordionBlock } from "@/components/accordion-block";
import { Slideshow } from "@/components/slideshow";
import { ProfileCard } from "@/components/profile-card";
import { YoutubeBlockView } from "@/components/youtube-block-view";
import { VideoBlockView } from "@/components/video-block-view";
import { parseContentBlocks } from "@/lib/parse-blocks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact" };

export default async function KontaktPage() {
  const db = getDb();

  const [content, departments, rows] = await Promise.all([
    db
      .select()
      .from(contactContent)
      .where(eq(contactContent.id, "main"))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(department)
      .where(notInArray(department.name, ["Styrelsen", "Sommarkurser", "Kvällskurser", "MHFA - Första hjälpen till psykisk hälsa"]))
      .orderBy(asc(department.sortOrder)),
    db
      .select({
        profileId: profile.id,
        name: profile.name,
        phone: profile.phone,
        directPhone: profile.directPhone,
        email: profile.email,
        imageKey: profile.imageKey,
        bio: profile.bio,
        profileSortOrder: profile.sortOrder,
        departmentId: profileDepartment.departmentId,
        title: profileDepartment.title,
      })
      .from(profile)
      .innerJoin(profileDepartment, eq(profile.id, profileDepartment.profileId))
      .where(eq(profile.published, true))
      .orderBy(asc(profileDepartment.sortOrder), asc(profile.sortOrder)),
  ]);

  const profilesByDept = new Map<string, typeof rows>();
  for (const row of rows) {
    if (!profilesByDept.has(row.departmentId))
      profilesByDept.set(row.departmentId, []);
    profilesByDept.get(row.departmentId)!.push(row);
  }

  const defaultProfile = {
    profileId: "__default__",
    name: "Demo Folk High School",
    phone: "010-123 45 00",
    directPhone: null,
    email: "exp@exempel-folkhogskola.se",
    imageKey: null,
    bio: null,
    title: "[]",
  };

  const blocks = parseContentBlocks(content?.blocks ?? "[]");

  const deptItems = departments.map((dept) => {
    const profiles = profilesByDept.get(dept.id) ?? [];
    return {
      id: dept.id,
      name: dept.name,
      profiles: profiles.length > 0 ? profiles : [defaultProfile],
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {content?.headingVisible && content?.heading && (
        <h1 style={{ color: content.headingColor ?? "#111827" }}>{content.heading}</h1>
      )}

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2>Address</h2>
          <address className="mt-2 not-italic text-gray-600 leading-relaxed">
            Demo Folk High School
            <br />
            {content?.addressStreet}
            <br />
            {content?.addressCity}
          </address>
        </div>

        <div>
          <h2>Contact us</h2>
          <dl className="mt-2 space-y-1 text-gray-600">
            <div>
              <dt className="sr-only">Phone</dt>
              <dd>
                <a
                  href={`tel:${content?.phone?.replace(/[\s-]/g, "")}`}
                  className="hover:text-brand-green-dark"
                >
                  {content?.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Email</dt>
              <dd>
                <a
                  href={`mailto:${content?.email}`}
                  className="hover:text-brand-green-dark"
                >
                  {content?.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Invoice</dt>
              <dd>
                Invoice:{" "}
                <a
                  href={`mailto:${content?.invoiceEmail}`}
                  className="hover:text-brand-green-dark"
                >
                  {content?.invoiceEmail}
                </a>
              </dd>
              {content?.invoiceNote && (
                <dd className="text-sm text-gray-600">{content.invoiceNote}</dd>
              )}
            </div>
            <div>
              <dt className="sr-only">Bankgiro</dt>
              <dd>Bankgiro: {content?.bankgiro}</dd>
            </div>
          </dl>
        </div>

      </div>

      {blocks.map((block) => {
        if (block.type === "section") return (
          <section key={block.id} className="mt-10">
            {block.headingVisible && block.heading && (
              <h2 style={{ color: block.headingColor ?? "#111827" }}>{block.heading}</h2>
            )}
            {block.body && (
              <div className={`${block.headingVisible && block.heading ? "mt-2" : "mt-0"} max-w-7xl text-gray-600`}>
                <RichTextContent html={block.body} />
              </div>
            )}
          </section>
        );


        if (block.type === "accordion-section") return (
          <div key={block.id} className="mt-10 max-w-7xl">
            <AccordionBlock summary={block.summary}>
              {block.body && <RichTextContent html={block.body} className="text-gray-600" />}
            </AccordionBlock>
          </div>
        );

        if (block.type === "slideshow") return (
          <div key={block.id} className="mt-10">
            <Slideshow block={block} />
          </div>
        );
        if (block.type === "youtube") return (
          <div key={block.id} className="mt-10">
            <YoutubeBlockView block={block} />
          </div>
        );
        if (block.type === "video") return (
          <div key={block.id} className="mt-10">
            <VideoBlockView block={block} />
          </div>
        );
        return null;
      })}

      <div className="mt-10">
         <h2>Find us</h2>
        <div className="relative w-full mt-3 overflow-hidden" style={{ aspectRatio: "7/3" }}>
          <iframe
            src="https://maps.google.com/maps?q=Stockholm+Sweden&ll=59.3293,18.0686&z=12&output=embed"
            className="absolute inset-0 h-full w-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Map to Demo Folk High School"
          />
        </div>
      </div> 

      {deptItems.length > 0 && (
        <div className="mt-16 space-y-14">
          <h2>Staff</h2>
          {deptItems.map((dept) => (
            <section key={dept.id}>
              <h3 className="border-b border-gray-200 pb-3 mb-8">
                {dept.name}
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {dept.profiles.map((p) => (
                  <ProfileCard
                    key={p.profileId}
                    name={p.name}
                    title={JSON.parse(p.title) as string[]}
                    imageKey={p.imageKey}
                    phone={p.phone ?? undefined}
                    directPhone={p.directPhone ?? undefined}
                    email={p.email ?? undefined}
                    bio={p.bio}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
