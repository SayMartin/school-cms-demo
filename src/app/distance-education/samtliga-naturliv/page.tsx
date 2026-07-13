import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Nature Life at a Distance" };

const links = [
  {
    href: "/distance-education/samtliga-naturliv?takt=50",
    label: "50% courses",
    description: "Study at half pace – combine with other work or studies.",
  },
  {
    href: "/distance-education/samtliga-naturliv?takt=25",
    label: "25% courses",
    description: "Study at quarter pace – a flexible schedule on your own time.",
  },
  {
    href: "/distance-education/samtliga-naturliv?typ=sommar",
    label: "Summer courses",
    description: "Shorter nature life courses during the summer season.",
  },
];

export default function SamtligaNaturlivPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-8">
      <div>
        <h1>Nature Life at a Distance</h1>
        <p className="mt-2 text-gray-600">
          Explore nature on your own terms — choose the study pace that suits you.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-lg border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow border-t-4 border-t-[#155a30]"
            >
              <p className="font-semibold text-gray-900">{link.label}</p>
              <p className="mt-1 text-sm text-gray-600">{link.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
