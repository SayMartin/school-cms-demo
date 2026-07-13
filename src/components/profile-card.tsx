import Image from "next/image";
import { mediaUrl } from "@/lib/r2/client";
import { RichTextContent } from "@/components/rich-text-content";
import { AccordionButton } from "@/components/accordion-button";

type Props = {
  name: string;
  title?: string | string[];
  imageKey?: string | null;
  phone?: string;
  directPhone?: string;
  email?: string;
  bio?: string | null;
};

export function ProfileCard({
  name,
  title,
  imageKey,
  phone,
  directPhone,
  email,
  bio,
}: Props) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col items-center text-center gap-4 p-6">
      {/* Avatar */}
      <div className="relative h-56 w-56 overflow-hidden rounded-full bg-gray-50 shrink-0">
        {imageKey ? (
          <Image
            src={mediaUrl(imageKey)}
            alt={name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <h2 className="flex h-full items-center justify-center">
            {initials}
          </h2>
        )}
      </div>

      {/* Name + title */}
      <div>
        <h3 className="leading-snug">{name}</h3>
        {title && (
          <div className="mt-1 space-y-0.5">
            {(Array.isArray(title) ? title : [title]).map((t, i) => (
              <p key={i} className="italic">
                {t}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Contact */}
      {(phone || directPhone || email) && (
        <div className="space-y-1">
          {phone && (
            <p>
              Switchboard:{" "}
              <a
                href={`tel:${phone.replace(/[\s–-]/g, "")}`}
                className="underline underline-offset-2"
              >
                {phone}
              </a>
            </p>
          )}
          {directPhone && (
            <p>
              Direct:{" "}
              <a
                href={`tel:${directPhone.replace(/[\s–-]/g, "")}`}
                className="underline underline-offset-2"
              >
                {directPhone}
              </a>
            </p>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="block underline underline-offset-2"
            >
              {email}
            </a>
          )}
        </div>
      )}

      {/* Read more / Close + expanding bio */}
      {bio && (
        <AccordionButton label="Read more" closeLabel="Close">
          <RichTextContent html={bio} className="rich-content text-left" />
        </AccordionButton>
      )}
    </div>
  );
}
