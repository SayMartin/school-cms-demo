import { mediaUrl } from "@/lib/r2/client";
import Image from "next/image";

export type VenueData = {
  name: string;
  category: string | null;
  capacity: number | null;
  priceInfo: string | null;
  availableTo: string;
  features: string; // JSON array
  imageKey: string | null;
};

const availableToLabel: Record<string, string> = {
  all: "Associations, companies and private individuals",
  organizations: "Associations and companies",
};

const CATEGORY_COLOR: Record<string, string> = {
  "Conference Room": "bg-brand-blue-light text-brand-blue-dark",
  "Event Venue": "bg-brand-pink-light text-brand-pink-dark",
  "Sports Hall": "bg-brand-green-light text-brand-green-dark",
  Classroom: "bg-brand-yellow-light text-brand-yellow-dark",
  "Dining Hall": "bg-brand-parchment-light text-brand-parchment-dark-dark",
  Other: "bg-gray-100 text-gray-600",
};

export function VenueView({ venue }: { venue: VenueData }) {
  let features: string[] = [];
  try { features = JSON.parse(venue.features) as string[]; } catch { /* empty */ }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {venue.imageKey && (
        <div className="relative h-64 w-full">
          <Image
            src={mediaUrl(venue.imageKey)}
            alt={venue.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="px-6 py-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {venue.category && (
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${CATEGORY_COLOR[venue.category] ?? "bg-gray-100 text-gray-600"}`}>
              {venue.category}
            </span>
          )}
          {venue.capacity && (
            <span className="text-sm text-gray-600">
              Up to <strong>{venue.capacity}</strong> people
            </span>
          )}
          {venue.priceInfo && (
            <span className="text-sm text-gray-600">{venue.priceInfo}</span>
          )}
        </div>

        {features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {features.map((f) => (
              <span key={f} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
                {f}
              </span>
            ))}
          </div>
        )}

        <p className="text-sm text-gray-600">
          Available to: {availableToLabel[venue.availableTo] ?? venue.availableTo}
        </p>
      </div>
    </div>
  );
}
